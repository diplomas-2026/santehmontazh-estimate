package com.company.product.api.dto.dashboard;

import java.math.BigDecimal;

public record DeviationRowResponse(
    Long projectId,
    String projectName,
    Long estimateId,
    String estimateName,
    BigDecimal plannedTotal,
    BigDecimal actualTotal,
    BigDecimal deviation
) {
}
