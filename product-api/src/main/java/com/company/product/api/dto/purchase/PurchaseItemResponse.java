package com.company.product.api.dto.purchase;

import java.math.BigDecimal;
import java.util.List;

public record PurchaseItemResponse(
    Long id,
    Long materialId,
    String materialName,
    String unit,
    BigDecimal plannedQuantity,
    BigDecimal plannedPrice,
    BigDecimal plannedLineTotal,
    BigDecimal actualQuantity,
    BigDecimal actualPrice,
    BigDecimal actualLineTotal,
    String supplierName,
    String supplierUrl,
    String comment,
    List<SupplierOfferResponse> offers,
    List<PurchaseSupplierHintResponse> supplierHints
) {
}
