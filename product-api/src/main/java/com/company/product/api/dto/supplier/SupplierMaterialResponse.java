package com.company.product.api.dto.supplier;

import java.math.BigDecimal;

public record SupplierMaterialResponse(
    Long id,
    String name,
    String sku,
    String unit,
    BigDecimal defaultPrice,
    String photoUrl
) {
}
