package com.company.product.api.dto.dashboard;

import java.math.BigDecimal;

public record DeviationRowResponse(
    Long purchaseId,
    String projectName,
    String estimateName,
    BigDecimal plannedTotal,
    BigDecimal actualTotal,
    BigDecimal deviation
) {
}
