package com.company.product.api.service;

import com.company.product.api.config.AppProperties;
import com.company.product.api.dto.ai.AiEstimateAssistantAnswerRequest;
import com.company.product.api.dto.ai.AiEstimateAssistantSessionResponse;
import com.company.product.api.dto.ai.AiEstimateAssistantStartRequest;
import com.company.product.api.dto.ai.AiEstimateDraftItemResponse;
import com.company.product.api.dto.ai.AiEstimateQuestionResponse;
import com.company.product.api.dto.ai.AiUsageResponse;
import com.company.product.api.dto.estimate.EstimateResponse;
import com.company.product.api.entity.AiEstimateSession;
import com.company.product.api.entity.AiEstimateSessionStatus;
import com.company.product.api.entity.AiTokenUsageDay;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.Material;
import com.company.product.api.entity.Project;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.exception.BadRequestException;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.AiEstimateSessionRepository;
import com.company.product.api.repository.AiTokenUsageDayRepository;
import com.company.product.api.repository.MaterialRepository;
import com.company.product.api.repository.ProjectRepository;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.SecurityUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AiEstimateAssistantService {

    private static final Logger log = LoggerFactory.getLogger(AiEstimateAssistantService.class);

    private static final TypeReference<List<AiEstimateQuestionResponse>> QUESTIONS_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<List<AiEstimateDraftModelItem>> DRAFT_MODEL_ITEMS_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<Map<String, String>> ANSWERS_TYPE = new TypeReference<>() {
    };
    private static final String SYSTEM_PROMPT = """
        Ты AI-помощник для системы расчета смет и фиксации факта по материалам и работам.
        Твоя задача — НЕ придумывать точную смету из воздуха. Сначала ты должен понять, хватает ли данных.

        Работай строго в одном из двух режимов:
        1. QUESTIONING — если данных недостаточно. Тогда задай от 1 до 3 самых полезных уточняющих вопросов.
        2. READY — если данных уже достаточно для черновика сметы.

        Важные правила:
        - Не придумывай точные количества без оснований.
        - Если информации недостаточно, спрашивай про размеры, количество точек, комплектацию, объем работ и другие параметры.
        - Если что-то можно только предположить, явно помечай это в comment и ставь needsAttention=true.
        - Возвращай только валидный JSON без markdown и без пояснений вокруг.
        - Все ответы и вопросы формулируй на русском языке.
        - В черновике сметы допустимы как позиции с материалом, так и позиции-работы.
        - Для материалов указывай materialQuery — строку, по которой можно попытаться найти материал в локальном каталоге.

        Формат ответа:
        {
          "status": "QUESTIONING" | "READY",
          "assistantMessage": "краткое сообщение пользователю",
          "estimateName": "название сметы",
          "estimateNotes": "краткое описание логики черновика",
          "questions": [
            {
              "key": "stable_snake_case_key",
              "label": "вопрос для пользователя",
              "placeholder": "пример ответа",
              "reason": "зачем нужен этот вопрос"
            }
          ],
          "items": [
            {
              "workName": "название позиции",
              "materialQuery": "поисковая строка материала или пусто",
              "quantity": 0.0,
              "unit": "шт",
              "unitPriceHint": 0.0,
              "comment": "пояснение по позиции",
              "needsAttention": true
            }
          ]
        }

        Если status=QUESTIONING, items должен быть пустым массивом.
        Если status=READY, questions должен быть пустым массивом.
        """;

    private final AppProperties appProperties;
    private final AiEstimateSessionRepository sessionRepository;
    private final AiTokenUsageDayRepository tokenUsageDayRepository;
    private final ProjectRepository projectRepository;
    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;
    private final EstimateService estimateService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final ChatModel chatModel;

    public AiEstimateAssistantService(AppProperties appProperties,
                                      AiEstimateSessionRepository sessionRepository,
                                      AiTokenUsageDayRepository tokenUsageDayRepository,
                                      ProjectRepository projectRepository,
                                      MaterialRepository materialRepository,
                                      UserRepository userRepository,
                                      EstimateService estimateService,
                                      AuditService auditService,
                                      ObjectMapper objectMapper,
                                      ObjectProvider<ChatModel> chatModelProvider) {
        this.appProperties = appProperties;
        this.sessionRepository = sessionRepository;
        this.tokenUsageDayRepository = tokenUsageDayRepository;
        this.projectRepository = projectRepository;
        this.materialRepository = materialRepository;
        this.userRepository = userRepository;
        this.estimateService = estimateService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
        this.chatModel = chatModelProvider.getIfAvailable();
    }

    public AiUsageResponse usage() {
        ZoneId zoneId = ZoneId.of(appProperties.ai().resetZone());
        LocalDate businessDate = LocalDate.now(zoneId);
        AiTokenUsageDay usageDay = tokenUsageDayRepository.findByBusinessDate(businessDate)
            .orElseGet(() -> emptyUsageDay(businessDate));
        long remaining = Math.max(0, appProperties.ai().dailyTokenLimit() - usageDay.getUsedTokens());
        return new AiUsageResponse(
            isAiAvailable(),
            appProperties.ai().dailyTokenLimit(),
            usageDay.getUsedTokens(),
            remaining,
            businessDate.plusDays(1).atStartOfDay(zoneId).toOffsetDateTime(),
            buildAvailabilityMessage(remaining)
        );
    }

    @Transactional
    public AiEstimateAssistantSessionResponse start(AiEstimateAssistantStartRequest request) {
        Project project = getAccessibleProject(request.projectId());
        ensureAiAvailable();
        ensureEnoughTokens();

        ModelDecision decision = askModel(project, request.message(), Map.of());

        AiEstimateSession session = new AiEstimateSession();
        session.setProject(project);
        session.setCreatedBy(currentActor());
        session.setStatus(decision.response().status());
        session.setInitialRequest(request.message().trim());
        session.setAssistantMessage(decision.response().assistantMessage());
        session.setEstimateName(defaultEstimateName(decision.response().estimateName(), project));
        session.setEstimateNotes(defaultEstimateNotes(decision.response().estimateNotes(), request.message()));
        session.setQuestionsJson(writeJson(decision.response().questions()));
        session.setAnswersJson(writeJson(Map.of()));
        session.setDraftItemsJson(writeJson(decision.response().items()));
        session.setTotalTokensUsed(decision.totalTokens());
        session.setUpdatedAt(OffsetDateTime.now());
        sessionRepository.save(session);

        consumeTokens(decision.totalTokens());
        auditService.log(AuditEntityType.ESTIMATE, project.getId(), "AI_SESSION_STARTED", currentActor(), "Запущен AI-помощник по смете");
        return toResponse(session);
    }

    @Transactional
    public AiEstimateAssistantSessionResponse answer(Long sessionId, AiEstimateAssistantAnswerRequest request) {
        AiEstimateSession session = getSession(sessionId);
        ensureSessionNotApplied(session);
        ensureAiAvailable();
        ensureEnoughTokens();

        Map<String, String> mergedAnswers = new LinkedHashMap<>(readAnswers(session.getAnswersJson()));
        request.answers().forEach((key, value) -> {
            if (value != null && !value.trim().isBlank()) {
                mergedAnswers.put(key, value.trim());
            }
        });
        if (mergedAnswers.isEmpty()) {
            throw new BadRequestException("Нужно заполнить хотя бы один ответ для продолжения");
        }

        ModelDecision decision = askModel(session.getProject(), session.getInitialRequest(), mergedAnswers);
        session.setStatus(decision.response().status());
        session.setAssistantMessage(decision.response().assistantMessage());
        session.setEstimateName(defaultEstimateName(decision.response().estimateName(), session.getProject()));
        session.setEstimateNotes(defaultEstimateNotes(decision.response().estimateNotes(), session.getInitialRequest()));
        session.setQuestionsJson(writeJson(decision.response().questions()));
        session.setAnswersJson(writeJson(mergedAnswers));
        session.setDraftItemsJson(writeJson(decision.response().items()));
        session.setTotalTokensUsed(session.getTotalTokensUsed() + decision.totalTokens());
        session.setUpdatedAt(OffsetDateTime.now());
        sessionRepository.save(session);

        consumeTokens(decision.totalTokens());
        auditService.log(AuditEntityType.ESTIMATE, session.getProject().getId(), "AI_SESSION_ANSWERED", currentActor(), "Обновлены ответы для AI-помощника");
        return toResponse(session);
    }

    @Transactional
    public EstimateResponse apply(Long sessionId) {
        AiEstimateSession session = getSession(sessionId);
        ensureSessionNotApplied(session);
        if (session.getStatus() != AiEstimateSessionStatus.READY) {
            throw new BadRequestException("AI-помощник еще не готов к созданию сметы. Сначала ответьте на уточняющие вопросы.");
        }

        List<AiEstimateDraftItemResponse> draftItems = mapDraftItems(readDraftItems(session.getDraftItemsJson()));
        if (draftItems.isEmpty()) {
            throw new BadRequestException("AI не сформировал позиции для сметы. Попробуйте уточнить запрос.");
        }

        EstimateResponse created = estimateService.createFromAiDraft(
            session.getProject().getId(),
            session.getEstimateName(),
            session.getEstimateNotes(),
            draftItems
        );
        session.setStatus(AiEstimateSessionStatus.APPLIED);
        session.setUpdatedAt(OffsetDateTime.now());
        sessionRepository.save(session);
        auditService.log(AuditEntityType.ESTIMATE, created.id(), "AI_APPLIED", currentActor(), "Черновик сметы создан через AI-помощник");
        return created;
    }

    public AiEstimateAssistantSessionResponse findById(Long sessionId) {
        return toResponse(getSession(sessionId));
    }

    private ModelDecision askModel(Project project, String initialRequest, Map<String, String> answers) {
        String promptText = buildUserPrompt(project, initialRequest, answers);
        List<Message> messages = List.of(
            new SystemMessage(SYSTEM_PROMPT),
            new UserMessage(promptText)
        );
        ChatResponse response;
        try {
            response = chatModel.call(new Prompt(messages));
        } catch (Exception exception) {
            log.error("GigaChat request failed for project {}", project.getId(), exception);
            throw new BadRequestException("AI-помощник не смог получить ответ от модели. Попробуйте еще раз через пару секунд.");
        }

        String content = extractContent(response);
        AiModelResponse parsed = normalizeModelResponse(parseModelResponse(content));
        if (parsed.status() == AiEstimateSessionStatus.QUESTIONING && parsed.questions().isEmpty()) {
            throw new BadRequestException("AI не вернул уточняющие вопросы. Попробуйте еще раз.");
        }
        if (parsed.status() == AiEstimateSessionStatus.READY && parsed.items().isEmpty()) {
            throw new BadRequestException("AI не смог сформировать черновик сметы. Попробуйте уточнить запрос.");
        }
        long totalTokens = extractTotalTokens(response, content);
        return new ModelDecision(parsed, totalTokens);
    }

    private String extractContent(ChatResponse response) {
        if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
            throw new BadRequestException("AI вернул пустой ответ. Попробуйте еще раз.");
        }
        String text = response.getResult().getOutput().getText();
        if (text == null || text.isBlank()) {
            throw new BadRequestException("AI вернул пустой ответ. Попробуйте еще раз.");
        }
        return stripMarkdownFence(text);
    }

    private long extractTotalTokens(ChatResponse response, String content) {
        try {
            Object usage = response.getMetadata().getClass().getMethod("getUsage").invoke(response.getMetadata());
            if (usage == null) {
                return fallbackTokens(content);
            }
            Object totalTokens = usage.getClass().getMethod("getTotalTokens").invoke(usage);
            if (totalTokens instanceof Number number) {
                return number.longValue();
            }
        } catch (Exception ignored) {
            // fallback below
        }
        return fallbackTokens(content);
    }

    private long fallbackTokens(String content) {
        return Math.max(250, Math.round(content.length() / 3.5));
    }

    private String buildUserPrompt(Project project, String initialRequest, Map<String, String> answers) {
        StringBuilder builder = new StringBuilder();
        builder.append("Контекст объекта:\n");
        builder.append("- Название: ").append(project.getName()).append('\n');
        builder.append("- Описание: ").append(project.getDescription()).append('\n');
        builder.append("- Адрес: ").append(project.getAddress()).append('\n');
        builder.append('\n');
        builder.append("Первичный запрос пользователя:\n");
        builder.append(initialRequest).append('\n');

        if (!answers.isEmpty()) {
            builder.append('\n').append("Уже полученные ответы на уточнения:\n");
            answers.forEach((key, value) -> builder.append("- ").append(key).append(": ").append(value).append('\n'));
        }

        builder.append('\n');
        builder.append("Сформируй следующий шаг. Если данных мало — спроси. Если достаточно — подготовь черновик сметы.");
        return builder.toString();
    }

    private AiEstimateAssistantSessionResponse toResponse(AiEstimateSession session) {
        List<AiEstimateDraftItemResponse> draftItems = mapDraftItems(readDraftItems(session.getDraftItemsJson()));
        return new AiEstimateAssistantSessionResponse(
            session.getId(),
            session.getProject().getId(),
            session.getStatus(),
            session.getAssistantMessage(),
            session.getEstimateName(),
            session.getEstimateNotes(),
            readQuestions(session.getQuestionsJson()),
            draftItems,
            session.getTotalTokensUsed(),
            usage()
        );
    }

    private List<AiEstimateDraftItemResponse> mapDraftItems(List<AiEstimateDraftModelItem> items) {
        List<AiEstimateDraftItemResponse> result = new ArrayList<>();
        for (AiEstimateDraftModelItem item : items) {
            Material material = resolveMaterial(item.materialQuery());
            BigDecimal price = material != null
                ? material.getDefaultPrice()
                : normalizeMoney(item.unitPriceHint());
            result.add(new AiEstimateDraftItemResponse(
                normalizeText(item.workName()),
                material != null ? material.getId() : null,
                material != null ? material.getName() : null,
                material != null ? material.getUnit() : normalizeUnit(item.unit()),
                normalizeQuantity(item.quantity()),
                price,
                normalizeText(item.comment()),
                material != null,
                item.needsAttention() || material == null
            ));
        }
        return result;
    }

    private Material resolveMaterial(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        Optional<Material> bySku = materialRepository.findBySkuIgnoreCase(query.trim());
        if (bySku.isPresent()) {
            return bySku.get();
        }
        return materialRepository.findTop10ByNameContainingIgnoreCaseOrderByNameAsc(query.trim()).stream().findFirst().orElse(null);
    }

    private void ensureAiAvailable() {
        if (!isAiAvailable()) {
            throw new BadRequestException("AI-помощник сейчас недоступен. Проверьте настройку GigaChat API key.");
        }
    }

    private boolean isAiAvailable() {
        return appProperties.ai().enabled() && chatModel != null;
    }

    private String buildAvailabilityMessage(long remaining) {
        if (!appProperties.ai().enabled()) {
            return "AI-помощник отключен в конфигурации.";
        }
        if (chatModel == null) {
            return "AI-помощник недоступен: не настроен GigaChat.";
        }
        if (remaining < appProperties.ai().minTokensPerRequest()) {
            return "Лимит токенов почти исчерпан. Новый запрос будет доступен после ночного сброса.";
        }
        return "AI-помощник готов к работе.";
    }

    private void ensureEnoughTokens() {
        AiUsageResponse usage = usage();
        if (usage.remainingTokens() < appProperties.ai().minTokensPerRequest()) {
            throw new BadRequestException("На сегодня исчерпан лимит токенов AI. Новый запрос будет доступен после 00:00 по Самаре.");
        }
    }

    @Transactional
    protected void consumeTokens(long totalTokens) {
        ZoneId zoneId = ZoneId.of(appProperties.ai().resetZone());
        LocalDate businessDate = LocalDate.now(zoneId);
        AiTokenUsageDay usageDay = tokenUsageDayRepository.findByBusinessDate(businessDate).orElseGet(() -> {
            AiTokenUsageDay day = new AiTokenUsageDay();
            day.setBusinessDate(businessDate);
            day.setUsedTokens(0);
            day.setRequestCount(0);
            day.setUpdatedAt(OffsetDateTime.now());
            return tokenUsageDayRepository.save(day);
        });
        usageDay.setUsedTokens(usageDay.getUsedTokens() + totalTokens);
        usageDay.setRequestCount(usageDay.getRequestCount() + 1);
        usageDay.setUpdatedAt(OffsetDateTime.now());
        tokenUsageDayRepository.save(usageDay);
    }

    private AiTokenUsageDay emptyUsageDay(LocalDate businessDate) {
        AiTokenUsageDay usageDay = new AiTokenUsageDay();
        usageDay.setBusinessDate(businessDate);
        usageDay.setUsedTokens(0);
        usageDay.setRequestCount(0);
        usageDay.setUpdatedAt(OffsetDateTime.now());
        return usageDay;
    }

    private AiEstimateSession getSession(Long sessionId) {
        UserAccount actor = currentActor();
        return actor.getRole() == Role.ADMIN
            ? sessionRepository.findById(sessionId).orElseThrow(() -> new NotFoundException("AI-сессия не найдена"))
            : sessionRepository.findByIdAndCreatedById(sessionId, actor.getId()).orElseThrow(() -> new NotFoundException("AI-сессия не найдена"));
    }

    private void ensureSessionNotApplied(AiEstimateSession session) {
        if (session.getStatus() == AiEstimateSessionStatus.APPLIED) {
            throw new BadRequestException("Этот AI-черновик уже использован для создания сметы.");
        }
    }

    private Project getAccessibleProject(Long projectId) {
        UserAccount actor = currentActor();
        return actor.getRole() == Role.ADMIN
            ? projectRepository.findById(projectId).orElseThrow(() -> new NotFoundException("Объект не найден"))
            : projectRepository.findByIdAndOwnerId(projectId, actor.getId()).orElseThrow(() -> new NotFoundException("Объект не найден"));
    }

    private UserAccount currentActor() {
        return userRepository.findById(SecurityUtils.currentUser().id())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
    }

    private String defaultEstimateName(String rawName, Project project) {
        String normalized = normalizeText(rawName);
        return normalized.isBlank() ? "Черновик сметы для " + project.getName() : normalized;
    }

    private String defaultEstimateNotes(String rawNotes, String initialRequest) {
        String normalized = normalizeText(rawNotes);
        return normalized.isBlank() ? "Черновик сформирован AI на основе запроса: " + initialRequest : normalized;
    }

    private BigDecimal normalizeQuantity(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ONE;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ONE;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeUnit(String value) {
        return value == null || value.isBlank() ? "шт" : value.trim();
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private List<AiEstimateQuestionResponse> readQuestions(String json) {
        return readJson(json, QUESTIONS_TYPE, List.of());
    }

    private Map<String, String> readAnswers(String json) {
        return readJson(json, ANSWERS_TYPE, new LinkedHashMap<>());
    }

    private List<AiEstimateDraftModelItem> readDraftItems(String json) {
        return readJson(json, DRAFT_MODEL_ITEMS_TYPE, List.of());
    }

    private <T> T readJson(String json, TypeReference<T> typeReference, T fallback) {
        if (json == null || json.isBlank()) {
            return fallback;
        }
        try {
            return objectMapper.readValue(json, typeReference);
        } catch (JsonProcessingException exception) {
            return fallback;
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Не удалось сохранить состояние AI-сессии", exception);
        }
    }

    private AiModelResponse parseModelResponse(String content) {
        try {
            return objectMapper.readValue(content, AiModelResponse.class);
        } catch (JsonProcessingException exception) {
            throw new BadRequestException("AI вернул ответ в неожиданном формате. Попробуйте еще раз.");
        }
    }

    private AiModelResponse normalizeModelResponse(AiModelResponse response) {
        return new AiModelResponse(
            response.status(),
            normalizeText(response.assistantMessage()),
            normalizeText(response.estimateName()),
            normalizeText(response.estimateNotes()),
            response.questions() == null ? List.of() : response.questions(),
            response.items() == null ? List.of() : response.items()
        );
    }

    private String stripMarkdownFence(String text) {
        String normalized = text.trim();
        if (normalized.startsWith("```")) {
            normalized = normalized.replaceFirst("^```(?:json)?\\s*", "");
            normalized = normalized.replaceFirst("\\s*```$", "");
        }
        return normalized.trim();
    }

    private record ModelDecision(AiModelResponse response, long totalTokens) {
    }

    private record AiModelResponse(
        AiEstimateSessionStatus status,
        String assistantMessage,
        String estimateName,
        String estimateNotes,
        List<AiEstimateQuestionResponse> questions,
        List<AiEstimateDraftModelItem> items
    ) {
    }

    private record AiEstimateDraftModelItem(
        String workName,
        String materialQuery,
        BigDecimal quantity,
        String unit,
        BigDecimal unitPriceHint,
        String comment,
        boolean needsAttention
    ) {
    }
}
