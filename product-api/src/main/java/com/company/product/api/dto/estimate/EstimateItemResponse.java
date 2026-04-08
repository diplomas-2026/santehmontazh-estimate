package com.company.product.api.dto.estimate;

import java.math.BigDecimal;

public record EstimateItemResponse(
    Long id,
    Long materialId,
    String materialName,
    String unit,
    String workName,
    BigDecimal quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal,
    String comment,
    BigDecimal actualQuantity,
    BigDecimal actualPrice,
    BigDecimal actualLineTotal,
    String purchaseSourceName,
    String purchaseSourceUrl,
    String purchaseNote
) {
}
