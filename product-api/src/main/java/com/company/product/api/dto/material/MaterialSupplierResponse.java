package com.company.product.api.dto.material;

import java.math.BigDecimal;

public record MaterialSupplierResponse(
    Long id,
    String name,
    BigDecimal rating,
    String phone,
    String email,
    String websiteUrl,
    String telegram
) {
}
