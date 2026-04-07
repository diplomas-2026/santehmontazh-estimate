package com.company.product.api.service;

import com.company.product.api.dto.dashboard.DashboardSummaryResponse;
import com.company.product.api.dto.dashboard.DeviationRowResponse;
import com.company.product.api.entity.Estimate;
import com.company.product.api.entity.Purchase;
import com.company.product.api.entity.Project;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.repository.EstimateItemRepository;
import com.company.product.api.repository.EstimateRepository;
import com.company.product.api.repository.ProjectRepository;
import com.company.product.api.repository.PurchaseRepository;
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
    private final PurchaseRepository purchaseRepository;
    private final UserRepository userRepository;

    public DashboardService(ProjectRepository projectRepository,
                            EstimateRepository estimateRepository,
                            EstimateItemRepository estimateItemRepository,
                            PurchaseRepository purchaseRepository,
                            UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.estimateRepository = estimateRepository;
        this.estimateItemRepository = estimateItemRepository;
        this.purchaseRepository = purchaseRepository;
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
        List<Purchase> purchases = actor.getRole() == Role.ADMIN
            ? purchaseRepository.findAll()
            : purchaseRepository.findByProjectOwnerId(actor.getId());
        BigDecimal activeEstimateTotal = estimates.stream()
            .flatMap(estimate -> estimateItemRepository.findByEstimateId(estimate.getId()).stream())
            .map(item -> item.getLineTotal())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal activePurchasePlannedTotal = purchases.stream()
            .map(Purchase::getPlannedTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal completedActualTotal = purchases.stream()
            .map(Purchase::getActualTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDeviation = purchases.stream()
            .map(p -> p.getActualTotal().subtract(p.getPlannedTotal()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardSummaryResponse(
            projects.stream().collect(Collectors.groupingBy(p -> p.getStatus().name(), Collectors.counting())),
            estimates.stream().collect(Collectors.groupingBy(e -> e.getStatus().name(), Collectors.counting())),
            purchases.stream().collect(Collectors.groupingBy(p -> p.getStatus().name(), Collectors.counting())),
            activeEstimateTotal,
            activePurchasePlannedTotal,
            completedActualTotal,
            totalDeviation
        );
    }

    public List<DeviationRowResponse> deviations() {
        UserAccount actor = currentActor();
        List<Purchase> purchases = actor.getRole() == Role.ADMIN
            ? purchaseRepository.findAll()
            : purchaseRepository.findByProjectOwnerId(actor.getId());
        return purchases.stream()
            .map(purchase -> new DeviationRowResponse(
                purchase.getId(),
                purchase.getProject().getName(),
                purchase.getEstimate().getName(),
                purchase.getPlannedTotal(),
                purchase.getActualTotal(),
                purchase.getActualTotal().subtract(purchase.getPlannedTotal())
            ))
            .toList();
    }

    private UserAccount currentActor() {
        return userRepository.findById(SecurityUtils.currentUser().id())
            .orElseThrow();
    }
}
