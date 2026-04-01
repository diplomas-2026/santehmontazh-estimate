package com.company.product.api.dto.supplier;

import java.math.BigDecimal;

public record SupplierResponse(
    Long id,
    String name,
    String contactPerson,
    String phone,
    String email,
    String address,
    BigDecimal rating,
    boolean active
) {
}
