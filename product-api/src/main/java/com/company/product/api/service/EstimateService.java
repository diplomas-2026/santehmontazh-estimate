package com.company.product.api.service;

import com.company.product.api.dto.ai.AiEstimateDraftItemResponse;
import com.company.product.api.dto.estimate.EstimateItemRequest;
import com.company.product.api.dto.estimate.EstimateItemResponse;
import com.company.product.api.dto.estimate.EstimateRequest;
import com.company.product.api.dto.estimate.EstimateResponse;
import com.company.product.api.dto.estimate.MaterialRequirementResponse;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.Estimate;
import com.company.product.api.entity.EstimateItem;
import com.company.product.api.entity.EstimateStatus;
import com.company.product.api.entity.Material;
import com.company.product.api.entity.Project;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.exception.BadRequestException;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.EstimateItemRepository;
import com.company.product.api.repository.EstimateRepository;
import com.company.product.api.repository.MaterialRepository;
import com.company.product.api.repository.ProjectRepository;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.SecurityUtils;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EstimateService {

    private final EstimateRepository estimateRepository;
    private final EstimateItemRepository estimateItemRepository;
    private final ProjectRepository projectRepository;
    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public EstimateService(EstimateRepository estimateRepository,
                           EstimateItemRepository estimateItemRepository,
                           ProjectRepository projectRepository,
                           MaterialRepository materialRepository,
                           UserRepository userRepository,
                           AuditService auditService) {
        this.estimateRepository = estimateRepository;
        this.estimateItemRepository = estimateItemRepository;
        this.projectRepository = projectRepository;
        this.materialRepository = materialRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public List<EstimateResponse> findAll() {
        UserAccount actor = currentActor();
        List<Estimate> estimates = actor.getRole() == Role.ADMIN
            ? estimateRepository.findAll()
            : estimateRepository.findByProjectOwnerIdOrderByUpdatedAtDesc(actor.getId());
        return estimates.stream()
            .sorted(Comparator.comparing(Estimate::getUpdatedAt).reversed())
            .map(this::toResponse)
            .toList();
    }

    public EstimateResponse findById(Long id) {
        return toResponse(getEstimate(id));
    }

    @Transactional
    public EstimateResponse create(EstimateRequest request) {
        UserAccount actor = currentActor();
        Project project = getEditableProject(request.projectId(), actor);

        Estimate estimate = new Estimate();
        estimate.setProject(project);
        estimate.setName(request.name());
        estimate.setStatus(EstimateStatus.DRAFT);
        estimate.setNotes(request.notes());
        estimate.setCreatedBy(actor);
        estimate.setUpdatedAt(OffsetDateTime.now());
        Estimate saved = estimateRepository.save(estimate);
        auditService.log(AuditEntityType.ESTIMATE, saved.getId(), "CREATED", actor, "Создана новая смета");
        return toResponse(saved);
    }

    @Transactional
    public EstimateResponse createFromAiDraft(Long projectId, String name, String notes, List<AiEstimateDraftItemResponse> draftItems) {
        UserAccount actor = currentActor();
        Project project = getEditableProject(projectId, actor);

        Estimate estimate = new Estimate();
        estimate.setProject(project);
        estimate.setName(name);
        estimate.setStatus(EstimateStatus.DRAFT);
        estimate.setNotes(notes);
        estimate.setCreatedBy(actor);
        estimate.setUpdatedAt(OffsetDateTime.now());
        Estimate saved = estimateRepository.save(estimate);

        for (AiEstimateDraftItemResponse draftItem : draftItems) {
            Material material = resolveMaterial(draftItem.materialId());
            String workName = normalizeWorkName(draftItem.workName());
            validateEstimateItem(material, workName);

            EstimateItem item = new EstimateItem();
            item.setEstimate(saved);
            item.setMaterial(material);
            item.setWorkName(workName);
            item.setQuantity(draftItem.quantity());
            item.setUnitPrice(draftItem.unitPrice());
            item.setLineTotal(draftItem.quantity().multiply(draftItem.unitPrice()));
            item.setComment(normalizeComment(draftItem.comment()));
            item.setActualQuantity(BigDecimal.ZERO);
            item.setActualPrice(BigDecimal.ZERO);
            item.setActualLineTotal(BigDecimal.ZERO);
            item.setPurchaseSourceName("");
            item.setPurchaseSourceUrl("");
            item.setPurchaseNote("");
            estimateItemRepository.save(item);
        }

        saved.setUpdatedAt(OffsetDateTime.now());
        estimateRepository.save(saved);
        auditService.log(AuditEntityType.ESTIMATE, saved.getId(), "AI_CREATED", actor, "Смета создана через AI-помощник");
        return toResponse(saved);
    }

    @Transactional
    public EstimateResponse update(Long id, EstimateRequest request) {
        Estimate estimate = getEditableEstimate(id);
        Project project = getEditableProject(request.projectId(), currentActor());
        estimate.setProject(project);
        estimate.setName(request.name());
        estimate.setNotes(request.notes());
        estimate.setUpdatedAt(OffsetDateTime.now());
        Estimate saved = estimateRepository.save(estimate);
        auditService.log(AuditEntityType.ESTIMATE, saved.getId(), "UPDATED", currentActor(), "Обновлены метаданные сметы");
        return toResponse(saved);
    }

    @Transactional
    public EstimateResponse addItem(Long estimateId, EstimateItemRequest request) {
        Estimate estimate = getEditableEstimate(estimateId);
        Material material = resolveMaterial(request.materialId());
        String workName = normalizeWorkName(request.workName());
        validateEstimateItem(material, workName);

        EstimateItem item = new EstimateItem();
        item.setEstimate(estimate);
        item.setMaterial(material);
        item.setWorkName(workName);
        item.setQuantity(request.quantity());
        item.setUnitPrice(request.unitPrice());
        item.setLineTotal(request.quantity().multiply(request.unitPrice()));
        item.setComment(normalizeComment(request.comment()));
        applyActualFields(item, request);
        estimateItemRepository.save(item);

        syncEstimateStatusFromItems(estimate);
        estimate.setUpdatedAt(OffsetDateTime.now());
        estimateRepository.save(estimate);
        auditService.log(AuditEntityType.ESTIMATE, estimate.getId(), "ITEM_ADDED", currentActor(), "Добавлена позиция сметы");
        return toResponse(estimate);
    }

    @Transactional
    public EstimateResponse updateItem(Long itemId, EstimateItemRequest request) {
        EstimateItem item = estimateItemRepository.findById(itemId)
            .orElseThrow(() -> new NotFoundException("Позиция сметы не найдена"));
        Estimate estimate = getEditableEstimate(item.getEstimate().getId());
        Material material = resolveMaterial(request.materialId());
        String workName = normalizeWorkName(request.workName());
        validateEstimateItem(material, workName);

        item.setMaterial(material);
        item.setWorkName(workName);
        item.setQuantity(request.quantity());
        item.setUnitPrice(request.unitPrice());
        item.setLineTotal(request.quantity().multiply(request.unitPrice()));
        item.setComment(normalizeComment(request.comment()));
        applyActualFields(item, request);
        estimateItemRepository.save(item);

        syncEstimateStatusFromItems(estimate);
        estimate.setUpdatedAt(OffsetDateTime.now());
        estimateRepository.save(estimate);
        auditService.log(AuditEntityType.ESTIMATE, estimate.getId(), "ITEM_UPDATED", currentActor(), "Позиция сметы обновлена");
        return toResponse(estimate);
    }

    @Transactional
    public void deleteItem(Long itemId) {
        EstimateItem item = estimateItemRepository.findById(itemId)
            .orElseThrow(() -> new NotFoundException("Позиция сметы не найдена"));
        Estimate estimate = getEditableEstimate(item.getEstimate().getId());
        estimateItemRepository.delete(item);
        syncEstimateStatusFromItems(estimate);
        estimate.setUpdatedAt(OffsetDateTime.now());
        estimateRepository.save(estimate);
        auditService.log(AuditEntityType.ESTIMATE, estimate.getId(), "ITEM_DELETED", currentActor(), "Позиция сметы удалена");
    }

    public List<MaterialRequirementResponse> requirements(Long estimateId) {
        Estimate estimate = getEstimate(estimateId);
        Map<Long, MaterialRequirementAccumulator> map = new LinkedHashMap<>();
        for (EstimateItem item : estimateItemRepository.findByEstimateId(estimate.getId())) {
            if (item.getMaterial() == null) {
                continue;
            }
            map.computeIfAbsent(item.getMaterial().getId(), key -> new MaterialRequirementAccumulator(
                item.getMaterial().getId(),
                item.getMaterial().getName(),
                item.getMaterial().getUnit(),
                BigDecimal.ZERO,
                BigDecimal.ZERO
            )).add(item.getQuantity(), item.getLineTotal());
        }
        return map.values().stream().map(MaterialRequirementAccumulator::toResponse).toList();
    }

    @Transactional
    public EstimateResponse submitForPurchase(Long estimateId) {
        Estimate estimate = getEditableEstimate(estimateId);
        if (estimateItemRepository.findByEstimateId(estimateId).isEmpty()) {
            throw new BadRequestException("Нельзя запустить пустую смету в работу");
        }
        estimate.setStatus(EstimateStatus.IN_PROGRESS);
        estimate.setUpdatedAt(OffsetDateTime.now());
        Estimate saved = estimateRepository.save(estimate);
        auditService.log(AuditEntityType.ESTIMATE, saved.getId(), "STARTED", currentActor(), "Смета переведена в работу");
        return toResponse(saved);
    }

    @Transactional
    public EstimateResponse complete(Long estimateId) {
        Estimate estimate = getEstimate(estimateId);
        if (estimate.getStatus() == EstimateStatus.COMPLETED) {
            return toResponse(estimate);
        }
        List<EstimateItem> items = estimateItemRepository.findByEstimateId(estimate.getId());
        if (items.isEmpty()) {
            throw new BadRequestException("Нельзя завершить пустую смету");
        }
        boolean hasActuals = items.stream().anyMatch(this::hasAnyActualData);
        if (!hasActuals) {
            throw new BadRequestException("Сначала укажите факт хотя бы по одной позиции сметы");
        }
        estimate.setStatus(EstimateStatus.COMPLETED);
        estimate.setUpdatedAt(OffsetDateTime.now());
        Estimate saved = estimateRepository.save(estimate);
        auditService.log(AuditEntityType.ESTIMATE, saved.getId(), "COMPLETED", currentActor(), "Смета завершена");
        return toResponse(saved);
    }

    @Transactional
    public EstimateResponse archive(Long estimateId) {
        Estimate estimate = getEstimate(estimateId);
        if (estimate.getStatus() == EstimateStatus.ARCHIVED || estimate.getStatus() == EstimateStatus.COMPLETED) {
            return toResponse(estimate);
        }
        estimate.setStatus(EstimateStatus.ARCHIVED);
        estimate.setUpdatedAt(OffsetDateTime.now());
        Estimate saved = estimateRepository.save(estimate);
        auditService.log(AuditEntityType.ESTIMATE, saved.getId(), "ARCHIVED", currentActor(), "Смета архивирована");
        return toResponse(saved);
    }

    public List<EstimateResponse> findByProject(Long projectId) {
        Project project = getAccessibleProject(projectId, currentActor());
        return estimateRepository.findByProjectIdOrderByUpdatedAtDesc(project.getId()).stream()
            .map(this::toResponse)
            .toList();
    }

    public byte[] exportEstimateWorkbook(Long estimateId) {
        Estimate estimate = getEstimate(estimateId);
        return buildWorkbook(estimate.getProject(), List.of(estimate));
    }

    public byte[] exportProjectEstimatesWorkbook(Long estimateId) {
        Estimate estimate = getEstimate(estimateId);
        List<Estimate> estimates = estimateRepository.findByProjectIdOrderByUpdatedAtDesc(estimate.getProject().getId());
        return buildWorkbook(estimate.getProject(), estimates);
    }

    private Estimate getEstimate(Long id) {
        Estimate estimate = estimateRepository.findById(id).orElseThrow(() -> new NotFoundException("Смета не найдена"));
        UserAccount actor = currentActor();
        if (actor.getRole() != Role.ADMIN && !estimate.getProject().getOwner().getId().equals(actor.getId())) {
            throw new NotFoundException("Смета не найдена");
        }
        return estimate;
    }

    private Estimate getEditableEstimate(Long id) {
        Estimate estimate = getEstimate(id);
        if (estimate.getStatus() == EstimateStatus.ARCHIVED || estimate.getStatus() == EstimateStatus.COMPLETED) {
            throw new BadRequestException("Смета недоступна для редактирования в текущем статусе");
        }
        return estimate;
    }

    private EstimateResponse toResponse(Estimate estimate) {
        List<EstimateItemResponse> items = estimateItemRepository.findByEstimateId(estimate.getId()).stream()
            .map(item -> new EstimateItemResponse(
                item.getId(),
                item.getMaterial() != null ? item.getMaterial().getId() : null,
                item.getMaterial() != null ? item.getMaterial().getName() : null,
                item.getMaterial() != null ? item.getMaterial().getUnit() : null,
                item.getWorkName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getLineTotal(),
                item.getComment(),
                item.getActualQuantity(),
                item.getActualPrice(),
                item.getActualLineTotal(),
                item.getPurchaseSourceName(),
                item.getPurchaseSourceUrl(),
                item.getPurchaseNote()
            ))
            .toList();
        BigDecimal total = items.stream().map(EstimateItemResponse::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal actualTotal = items.stream().map(EstimateItemResponse::actualLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new EstimateResponse(
            estimate.getId(),
            estimate.getProject().getId(),
            estimate.getProject().getName(),
            estimate.getName(),
            estimate.getStatus(),
            estimate.getNotes(),
            estimate.getCreatedBy().getId(),
            estimate.getCreatedBy().getFullName(),
            estimate.getCreatedAt(),
            estimate.getUpdatedAt(),
            total,
            actualTotal,
            actualTotal.subtract(total),
            items
        );
    }

    private UserAccount currentActor() {
        return userRepository.findById(SecurityUtils.currentUser().id())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
    }

    private String normalizeComment(String comment) {
        return comment == null ? "" : comment.trim();
    }

    private String normalizeSource(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeWorkName(String workName) {
        return workName == null ? "" : workName.trim();
    }

    private Material resolveMaterial(Long materialId) {
        if (materialId == null) {
            return null;
        }
        return materialRepository.findById(materialId)
            .orElseThrow(() -> new NotFoundException("Материал не найден"));
    }

    private void validateEstimateItem(Material material, String workName) {
        if (material == null && workName.isBlank()) {
            throw new BadRequestException("Укажите материал или название работы");
        }
    }

    private void applyActualFields(EstimateItem item, EstimateItemRequest request) {
        BigDecimal actualQuantity = normalizeOptionalMoney(request.actualQuantity());
        BigDecimal actualPrice = normalizeOptionalMoney(request.actualPrice());
        item.setActualQuantity(actualQuantity);
        item.setActualPrice(actualPrice);
        item.setActualLineTotal(actualQuantity.multiply(actualPrice));
        item.setPurchaseSourceName(normalizeSource(request.purchaseSourceName()));
        item.setPurchaseSourceUrl(normalizeSource(request.purchaseSourceUrl()));
        item.setPurchaseNote(normalizeSource(request.purchaseNote()));
    }

    private BigDecimal normalizeOptionalMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.max(BigDecimal.ZERO);
    }

    private boolean hasAnyActualData(EstimateItem item) {
        return item.getActualQuantity().compareTo(BigDecimal.ZERO) > 0
            || item.getActualPrice().compareTo(BigDecimal.ZERO) > 0
            || !item.getPurchaseSourceName().isBlank()
            || !item.getPurchaseSourceUrl().isBlank()
            || !item.getPurchaseNote().isBlank();
    }

    private void syncEstimateStatusFromItems(Estimate estimate) {
        List<EstimateItem> items = estimateItemRepository.findByEstimateId(estimate.getId());
        boolean hasActualData = items.stream().anyMatch(this::hasAnyActualData);
        if (estimate.getStatus() == EstimateStatus.ARCHIVED || estimate.getStatus() == EstimateStatus.COMPLETED) {
            return;
        }
        estimate.setStatus(hasActualData ? EstimateStatus.IN_PROGRESS : EstimateStatus.DRAFT);
    }

    private Project getAccessibleProject(Long projectId, UserAccount actor) {
        return actor.getRole() == Role.ADMIN
            ? projectRepository.findById(projectId).orElseThrow(() -> new NotFoundException("Объект не найден"))
            : projectRepository.findByIdAndOwnerId(projectId, actor.getId()).orElseThrow(() -> new NotFoundException("Объект не найден"));
    }

    private Project getEditableProject(Long projectId, UserAccount actor) {
        Project project = getAccessibleProject(projectId, actor);
        if (project.getStatus() == com.company.product.api.entity.ProjectStatus.COMPLETED) {
            throw new BadRequestException("Объект недоступен для редактирования в текущем статусе");
        }
        return project;
    }

    private byte[] buildWorkbook(Project project, List<Estimate> estimates) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle sectionStyle = createSectionStyle(workbook);
            Set<String> usedSheetNames = new HashSet<>();

            for (Estimate estimate : estimates) {
                writeEstimateSheet(workbook, project, toResponse(estimate), headerStyle, sectionStyle, usedSheetNames);
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Не удалось сформировать Excel-отчет по смете", exception);
        }
    }

    private void writeEstimateSheet(Workbook workbook,
                                    Project project,
                                    EstimateResponse estimate,
                                    CellStyle headerStyle,
                                    CellStyle sectionStyle,
                                    Set<String> usedSheetNames) {
        Sheet sheet = workbook.createSheet(buildUniqueSheetName(estimate.name(), estimate.id(), usedSheetNames));
        int rowIndex = 0;

        rowIndex = writeMetaRow(sheet, rowIndex, "Объект", project.getName(), headerStyle);
        rowIndex = writeMetaRow(sheet, rowIndex, "Код объекта", project.getCode(), headerStyle);
        rowIndex = writeMetaRow(sheet, rowIndex, "Смета", estimate.name(), headerStyle);
        rowIndex = writeMetaRow(sheet, rowIndex, "Статус", estimate.status().name(), headerStyle);
        rowIndex = writeMetaRow(sheet, rowIndex, "Автор", estimate.createdByName(), headerStyle);
        rowIndex = writeMetaRow(sheet, rowIndex, "План", estimate.total().toPlainString(), headerStyle);
        rowIndex = writeMetaRow(sheet, rowIndex, "Факт", estimate.actualTotal().toPlainString(), headerStyle);
        rowIndex = writeMetaRow(sheet, rowIndex, "Отклонение", estimate.deviation().toPlainString(), headerStyle);
        rowIndex++;

        Row titleRow = sheet.createRow(rowIndex++);
        titleRow.createCell(0).setCellValue("Позиции сметы");
        titleRow.getCell(0).setCellStyle(sectionStyle);

        Row headerRow = sheet.createRow(rowIndex++);
        String[] columns = {
            "№", "Позиция", "Материал", "Ед.", "План кол-во", "План цена", "План сумма",
            "Факт кол-во", "Факт цена", "Факт сумма", "Где купили", "Ссылка", "Комментарий", "Заметка по факту"
        };
        for (int index = 0; index < columns.length; index++) {
            headerRow.createCell(index).setCellValue(columns[index]);
            headerRow.getCell(index).setCellStyle(headerStyle);
        }

        int position = 1;
        for (EstimateItemResponse item : estimate.items()) {
            Row row = sheet.createRow(rowIndex++);
            row.createCell(0).setCellValue(position++);
            row.createCell(1).setCellValue(item.workName() == null || item.workName().isBlank() ? "Позиция сметы" : item.workName());
            row.createCell(2).setCellValue(item.materialName() == null ? "" : item.materialName());
            row.createCell(3).setCellValue(item.unit() == null ? "" : item.unit());
            row.createCell(4).setCellValue(item.quantity().doubleValue());
            row.createCell(5).setCellValue(item.unitPrice().doubleValue());
            row.createCell(6).setCellValue(item.lineTotal().doubleValue());
            row.createCell(7).setCellValue(item.actualQuantity().doubleValue());
            row.createCell(8).setCellValue(item.actualPrice().doubleValue());
            row.createCell(9).setCellValue(item.actualLineTotal().doubleValue());
            row.createCell(10).setCellValue(item.purchaseSourceName());
            row.createCell(11).setCellValue(item.purchaseSourceUrl());
            row.createCell(12).setCellValue(item.comment());
            row.createCell(13).setCellValue(item.purchaseNote());
        }

        for (int index = 0; index < columns.length; index++) {
            sheet.autoSizeColumn(index);
        }
    }

    private int writeMetaRow(Sheet sheet, int rowIndex, String label, String value, CellStyle headerStyle) {
        Row row = sheet.createRow(rowIndex);
        row.createCell(0).setCellValue(label);
        row.getCell(0).setCellStyle(headerStyle);
        row.createCell(1).setCellValue(value == null ? "" : value);
        return rowIndex + 1;
    }

    private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
        XSSFFont font = workbook.createFont();
        font.setBold(true);

        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        return style;
    }

    private CellStyle createSectionStyle(XSSFWorkbook workbook) {
        XSSFFont font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());

        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private String buildUniqueSheetName(String estimateName, Long estimateId, Set<String> usedSheetNames) {
        String base = baseSheetName(estimateName, estimateId);
        String candidate = base;
        int suffix = 2;
        while (usedSheetNames.contains(candidate)) {
            String postfix = " (" + suffix + ")";
            int maxBaseLength = Math.max(1, 31 - postfix.length());
            String trimmedBase = base.length() > maxBaseLength ? base.substring(0, maxBaseLength) : base;
            candidate = trimmedBase + postfix;
            suffix++;
        }
        usedSheetNames.add(candidate);
        return candidate;
    }

    private String baseSheetName(String estimateName, Long estimateId) {
        String base = (estimateName == null || estimateName.isBlank()) ? "Смета " + estimateId : estimateName;
        String sanitized = base.replaceAll("[\\\\/*?:\\[\\]]", " ").trim();
        if (sanitized.isBlank()) {
            sanitized = "Смета " + estimateId;
        }
        return sanitized.length() > 31 ? sanitized.substring(0, 31) : sanitized;
    }

    private static final class MaterialRequirementAccumulator {
        private final Long materialId;
        private final String materialName;
        private final String unit;
        private BigDecimal quantity;
        private BigDecimal estimatedCost;

        private MaterialRequirementAccumulator(Long materialId, String materialName, String unit,
                                              BigDecimal quantity, BigDecimal estimatedCost) {
            this.materialId = materialId;
            this.materialName = materialName;
            this.unit = unit;
            this.quantity = quantity;
            this.estimatedCost = estimatedCost;
        }

        private void add(BigDecimal deltaQuantity, BigDecimal deltaCost) {
            quantity = quantity.add(deltaQuantity);
            estimatedCost = estimatedCost.add(deltaCost);
        }

        private MaterialRequirementResponse toResponse() {
            return new MaterialRequirementResponse(materialId, materialName, unit, quantity, estimatedCost);
        }
    }
}
