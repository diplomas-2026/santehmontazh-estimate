package com.company.product.api.dto.dashboard;

import java.math.BigDecimal;
import java.util.Map;

public record DashboardSummaryResponse(
    Map<String, Long> projectStatuses,
    Map<String, Long> estimateStatuses,
    BigDecimal plannedEstimateTotal,
    BigDecimal actualEstimateTotal,
    BigDecimal totalDeviation
) {
}
