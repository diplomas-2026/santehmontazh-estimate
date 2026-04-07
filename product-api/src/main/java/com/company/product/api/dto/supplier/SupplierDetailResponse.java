package com.company.product.api.dto.supplier;

import com.company.product.api.dto.common.ReviewResponse;
import java.math.BigDecimal;
import java.util.List;

public record SupplierDetailResponse(
    Long id,
    String name,
    String contactPerson,
    String phone,
    String email,
    String address,
    String websiteUrl,
    String telegram,
    BigDecimal rating,
    boolean active,
    List<SupplierMaterialResponse> materials,
    List<ReviewResponse> reviews
) {
}
