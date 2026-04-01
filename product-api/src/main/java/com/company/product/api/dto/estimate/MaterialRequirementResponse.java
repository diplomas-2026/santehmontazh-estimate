package com.company.product.api.dto.estimate;

import java.math.BigDecimal;

public record MaterialRequirementResponse(
    Long materialId,
    String materialName,
    String unit,
    BigDecimal quantity,
    BigDecimal estimatedCost
) {
}
