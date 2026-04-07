package com.company.product.api.dto.ai;

import java.math.BigDecimal;

public record AiEstimateDraftItemResponse(
    String workName,
    Long materialId,
    String materialName,
    String unit,
    BigDecimal quantity,
    BigDecimal unitPrice,
    String comment,
    boolean matchedMaterial,
    boolean needsAttention
) {
}
