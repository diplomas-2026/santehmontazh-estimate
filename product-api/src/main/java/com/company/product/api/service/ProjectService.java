package com.company.product.api.service;

import com.company.product.api.dto.project.ProjectRequest;
import com.company.product.api.dto.project.ProjectResponse;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.Estimate;
import com.company.product.api.entity.EstimateStatus;
import com.company.product.api.entity.Project;
import com.company.product.api.entity.Purchase;
import com.company.product.api.entity.PurchaseStatus;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.exception.BadRequestException;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.EstimateItemRepository;
import com.company.product.api.repository.EstimateRepository;
import com.company.product.api.repository.ProjectRepository;
import com.company.product.api.repository.PurchaseRepository;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.SecurityUtils;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final EstimateRepository estimateRepository;
    private final EstimateItemRepository estimateItemRepository;
    private final PurchaseRepository purchaseRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public ProjectService(ProjectRepository projectRepository,
                          EstimateRepository estimateRepository,
                          EstimateItemRepository estimateItemRepository,
                          PurchaseRepository purchaseRepository,
                          UserRepository userRepository,
                          AuditService auditService) {
        this.projectRepository = projectRepository;
        this.estimateRepository = estimateRepository;
        this.estimateItemRepository = estimateItemRepository;
        this.purchaseRepository = purchaseRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public List<ProjectResponse> findAll() {
        UserAccount actor = currentActor();
        List<Project> projects = actor.getRole() == Role.ADMIN
            ? projectRepository.findAll()
            : projectRepository.findByOwnerId(actor.getId());
        return projects.stream().map(this::toResponse).toList();
    }

    public ProjectResponse findById(Long id) {
        return toResponse(getAccessibleProject(id));
    }

    @Transactional
    public ProjectResponse create(ProjectRequest request) {
        Project project = new Project();
        apply(project, request);
        project.setOwner(currentActor());
        Project saved = projectRepository.save(project);
        auditService.log(AuditEntityType.PROJECT, saved.getId(), "CREATED", currentActor(), "Создан новый объект");
        return toResponse(saved);
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest request) {
        Project project = getEditableProject(id);
        apply(project, request);
        Project saved = projectRepository.save(project);
        auditService.log(AuditEntityType.PROJECT, saved.getId(), "UPDATED", currentActor(), "Обновлены данные объекта");
        return toResponse(saved);
    }

    @Transactional
    public ProjectResponse complete(Long id) {
        Project project = getAccessibleProject(id);
        if (project.getStatus() == com.company.product.api.entity.ProjectStatus.COMPLETED) {
            throw new BadRequestException("Объект уже завершен");
        }

        List<Estimate> estimates = estimateRepository.findByProjectIdOrderByUpdatedAtDesc(project.getId());
        boolean hasOpenEstimates = estimates.stream().anyMatch(estimate ->
            estimate.getStatus() != EstimateStatus.ARCHIVED && estimate.getStatus() != EstimateStatus.COMPLETED);
        if (hasOpenEstimates) {
            throw new BadRequestException("Нельзя завершить объект, пока не архивированы все сметы");
        }

        List<Purchase> purchases = purchaseRepository.findByProjectId(project.getId());
        boolean hasOpenPurchases = purchases.stream().anyMatch(purchase -> purchase.getStatus() != PurchaseStatus.COMPLETED);
        if (hasOpenPurchases) {
            throw new BadRequestException("Нельзя завершить объект, пока не завершены все закупки");
        }

        project.setStatus(com.company.product.api.entity.ProjectStatus.COMPLETED);
        Project saved = projectRepository.save(project);
        auditService.log(AuditEntityType.PROJECT, saved.getId(), "COMPLETED", currentActor(), "Объект завершен");
        return toResponse(saved);
    }

    private void apply(Project project, ProjectRequest request) {
        if (request.status() == com.company.product.api.entity.ProjectStatus.COMPLETED) {
            throw new BadRequestException("Завершить объект можно только отдельным действием");
        }
        project.setName(request.name());
        project.setCode(request.code());
        project.setAddress(request.address());
        project.setDescription(request.description());
        project.setStatus(request.status());
        project.setPlannedStartDate(request.plannedStartDate());
        project.setPlannedEndDate(request.plannedEndDate());
    }

    private ProjectResponse toResponse(Project project) {
        List<Estimate> estimates = estimateRepository.findByProjectIdOrderByUpdatedAtDesc(project.getId());
        List<Purchase> purchases = purchaseRepository.findByProjectId(project.getId());
        BigDecimal estimateTotal = estimates.stream()
            .flatMap(estimate -> estimateItemRepository.findByEstimateId(estimate.getId()).stream())
            .map(item -> item.getLineTotal())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal purchaseTotal = purchases.stream()
            .map(Purchase::getPlannedTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ProjectResponse(project.getId(), project.getName(), project.getCode(), project.getAddress(),
            project.getDescription(), project.getStatus(), project.getPlannedStartDate(), project.getPlannedEndDate(),
            estimateTotal, purchaseTotal);
    }

    private com.company.product.api.entity.UserAccount currentActor() {
        return userRepository.findById(SecurityUtils.currentUser().id())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
    }

    private Project getAccessibleProject(Long id) {
        UserAccount actor = currentActor();
        return actor.getRole() == Role.ADMIN
            ? projectRepository.findById(id).orElseThrow(() -> new NotFoundException("Объект не найден"))
            : projectRepository.findByIdAndOwnerId(id, actor.getId()).orElseThrow(() -> new NotFoundException("Объект не найден"));
    }

    private Project getEditableProject(Long id) {
        Project project = getAccessibleProject(id);
        if (project.getStatus() == com.company.product.api.entity.ProjectStatus.COMPLETED) {
            throw new BadRequestException("Объект недоступен для редактирования в текущем статусе");
        }
        return project;
    }
}
