package com.company.product.api.dto.material;

import java.math.BigDecimal;

public record MaterialResponse(
    Long id,
    String name,
    String sku,
    String unit,
    Long categoryId,
    String categoryName,
    BigDecimal defaultPrice,
    String description,
    boolean active
) {
}
