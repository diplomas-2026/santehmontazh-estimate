package com.company.product.api.dto.purchase;

import java.math.BigDecimal;

public record SupplierOfferResponse(
    Long id,
    Long supplierId,
    String supplierName,
    BigDecimal offeredPrice,
    Integer deliveryDays,
    String comment,
    boolean selected
) {
}
