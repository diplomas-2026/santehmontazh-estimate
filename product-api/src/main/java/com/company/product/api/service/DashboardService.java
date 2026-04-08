package com.company.product.api.service;

import com.company.product.api.dto.dashboard.DashboardSummaryResponse;
import com.company.product.api.dto.dashboard.DeviationRowResponse;
import com.company.product.api.entity.Estimate;
import com.company.product.api.entity.Project;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.EstimateItemRepository;
import com.company.product.api.repository.EstimateRepository;
import com.company.product.api.repository.ProjectRepository;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.SecurityUtils;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final EstimateRepository estimateRepository;
    private final EstimateItemRepository estimateItemRepository;
    private final UserRepository userRepository;

    public DashboardService(ProjectRepository projectRepository,
                            EstimateRepository estimateRepository,
                            EstimateItemRepository estimateItemRepository,
                            UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.estimateRepository = estimateRepository;
        this.estimateItemRepository = estimateItemRepository;
        this.userRepository = userRepository;
    }

    public DashboardSummaryResponse summary() {
        UserAccount actor = currentActor();
        List<Project> projects = actor.getRole() == Role.ADMIN
            ? projectRepository.findAll()
            : projectRepository.findByOwnerId(actor.getId());
        List<Estimate> estimates = actor.getRole() == Role.ADMIN
            ? estimateRepository.findAll()
            : estimateRepository.findByProjectOwnerIdOrderByUpdatedAtDesc(actor.getId());
        BigDecimal plannedEstimateTotal = estimates.stream()
            .flatMap(estimate -> estimateItemRepository.findByEstimateId(estimate.getId()).stream())
            .map(item -> item.getLineTotal())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal actualEstimateTotal = estimates.stream()
            .flatMap(estimate -> estimateItemRepository.findByEstimateId(estimate.getId()).stream())
            .map(item -> item.getActualLineTotal())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDeviation = actualEstimateTotal.subtract(plannedEstimateTotal);

        return new DashboardSummaryResponse(
            projects.stream().collect(Collectors.groupingBy(p -> p.getStatus().name(), Collectors.counting())),
            estimates.stream().collect(Collectors.groupingBy(e -> e.getStatus().name(), Collectors.counting())),
            plannedEstimateTotal,
            actualEstimateTotal,
            totalDeviation
        );
    }

    public List<DeviationRowResponse> deviations() {
        UserAccount actor = currentActor();
        List<Estimate> estimates = actor.getRole() == Role.ADMIN
            ? estimateRepository.findAll()
            : estimateRepository.findByProjectOwnerIdOrderByUpdatedAtDesc(actor.getId());
        return estimates.stream()
            .map(estimate -> {
                BigDecimal plannedTotal = estimateItemRepository.findByEstimateId(estimate.getId()).stream()
                    .map(item -> item.getLineTotal())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal actualTotal = estimateItemRepository.findByEstimateId(estimate.getId()).stream()
                    .map(item -> item.getActualLineTotal())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                return new DeviationRowResponse(
                    estimate.getProject().getId(),
                    estimate.getProject().getName(),
                    estimate.getId(),
                    estimate.getName(),
                    plannedTotal,
                    actualTotal,
                    actualTotal.subtract(plannedTotal)
                );
            })
            .toList();
    }

    private UserAccount currentActor() {
        return userRepository.findById(SecurityUtils.currentUser().id())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
    }
}
