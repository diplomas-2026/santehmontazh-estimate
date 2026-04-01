package com.company.product.api.dto.dashboard;

import java.math.BigDecimal;
import java.util.Map;

public record DashboardSummaryResponse(
    Map<String, Long> projectStatuses,
    Map<String, Long> estimateStatuses,
    Map<String, Long> purchaseStatuses,
    BigDecimal activeEstimateTotal,
    BigDecimal activePurchasePlannedTotal,
    BigDecimal completedPurchaseActualTotal,
    BigDecimal totalDeviation
) {
}
