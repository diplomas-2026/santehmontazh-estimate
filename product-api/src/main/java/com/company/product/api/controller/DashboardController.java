package com.company.product.api.controller;

import com.company.product.api.dto.dashboard.DashboardSummaryResponse;
import com.company.product.api.dto.dashboard.DeviationRowResponse;
import com.company.product.api.service.DashboardService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        return dashboardService.summary();
    }

    @GetMapping("/deviations")
    public List<DeviationRowResponse> deviations() {
        return dashboardService.deviations();
    }
}
