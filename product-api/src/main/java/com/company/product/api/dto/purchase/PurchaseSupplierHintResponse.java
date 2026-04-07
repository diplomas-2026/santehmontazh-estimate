package com.company.product.api.dto.purchase;

import java.math.BigDecimal;

public record PurchaseSupplierHintResponse(
    Long supplierId,
    String supplierName,
    BigDecimal rating,
    String phone,
    String email,
    String websiteUrl,
    String telegram
) {
}
