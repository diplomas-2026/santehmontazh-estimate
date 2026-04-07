package com.company.product.api.service;

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
import com.company.product.api.entity.UserAccount;
import com.company.product.api.exception.BadRequestException;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.EstimateItemRepository;
import com.company.product.api.repository.EstimateRepository;
import com.company.product.api.repository.MaterialRepository;
import com.company.product.api.repository.ProjectRepository;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.SecurityUtils;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
        return estimateRepository.findAll().stream()
            .sorted(Comparator.comparing(Estimate::getUpdatedAt).reversed())
            .map(this::toResponse)
            .toList();
    }

    public EstimateResponse findById(Long id) {
        return toResponse(getEstimate(id));
    }

    @Transactional
    public EstimateResponse create(EstimateRequest request) {
        Project project = projectRepository.findById(request.projectId())
            .orElseThrow(() -> new NotFoundException("Объект не найден"));
        UserAccount actor = currentActor();

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
    public EstimateResponse update(Long id, EstimateRequest request) {
        Estimate estimate = getEditableEstimate(id);
        Project project = projectRepository.findById(request.projectId())
            .orElseThrow(() -> new NotFoundException("Объект не найден"));
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
        Material material = materialRepository.findById(request.materialId())
            .orElseThrow(() -> new NotFoundException("Материал не найден"));

        EstimateItem item = new EstimateItem();
        item.setEstimate(estimate);
        item.setMaterial(material);
        item.setWorkName(request.workName());
        item.setQuantity(request.quantity());
        item.setUnitPrice(request.unitPrice());
        item.setLineTotal(request.quantity().multiply(request.unitPrice()));
        item.setComment(request.comment());
        estimateItemRepository.save(item);

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
        Material material = materialRepository.findById(request.materialId())
            .orElseThrow(() -> new NotFoundException("Материал не найден"));

        item.setMaterial(material);
        item.setWorkName(request.workName());
        item.setQuantity(request.quantity());
        item.setUnitPrice(request.unitPrice());
        item.setLineTotal(request.quantity().multiply(request.unitPrice()));
        item.setComment(request.comment());
        estimateItemRepository.save(item);

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
        estimate.setUpdatedAt(OffsetDateTime.now());
        estimateRepository.save(estimate);
        auditService.log(AuditEntityType.ESTIMATE, estimate.getId(), "ITEM_DELETED", currentActor(), "Позиция сметы удалена");
    }

    public List<MaterialRequirementResponse> requirements(Long estimateId) {
        Estimate estimate = getEstimate(estimateId);
        Map<Long, MaterialRequirementAccumulator> map = new LinkedHashMap<>();
        for (EstimateItem item : estimateItemRepository.findByEstimateId(estimate.getId())) {
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
            throw new BadRequestException("Нельзя отправить пустую смету в закупку");
        }
        estimate.setStatus(EstimateStatus.READY_FOR_PURCHASE);
        estimate.setUpdatedAt(OffsetDateTime.now());
        Estimate saved = estimateRepository.save(estimate);
        auditService.log(AuditEntityType.ESTIMATE, saved.getId(), "SUBMITTED_FOR_PURCHASE", currentActor(), "Смета отправлена в закупку");
        return toResponse(saved);
    }

    private Estimate getEstimate(Long id) {
        return estimateRepository.findById(id).orElseThrow(() -> new NotFoundException("Смета не найдена"));
    }

    private Estimate getEditableEstimate(Long id) {
        Estimate estimate = getEstimate(id);
        if (estimate.getStatus() != EstimateStatus.DRAFT) {
            throw new BadRequestException("Смета недоступна для редактирования в текущем статусе");
        }
        return estimate;
    }

    private EstimateResponse toResponse(Estimate estimate) {
        List<EstimateItemResponse> items = estimateItemRepository.findByEstimateId(estimate.getId()).stream()
            .map(item -> new EstimateItemResponse(item.getId(), item.getMaterial().getId(), item.getMaterial().getName(),
                item.getMaterial().getUnit(), item.getWorkName(), item.getQuantity(), item.getUnitPrice(), item.getLineTotal(),
                item.getComment()))
            .toList();
        BigDecimal total = items.stream().map(EstimateItemResponse::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
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
            items
        );
    }

    private UserAccount currentActor() {
        return userRepository.findById(SecurityUtils.currentUser().id())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
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
