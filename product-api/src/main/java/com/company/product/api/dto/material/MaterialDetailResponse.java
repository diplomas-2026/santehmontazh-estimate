package com.company.product.api.dto.material;

import com.company.product.api.dto.common.ReviewResponse;
import java.math.BigDecimal;
import java.util.List;

public record MaterialDetailResponse(
    Long id,
    String name,
    String sku,
    String unit,
    Long categoryId,
    String categoryName,
    BigDecimal defaultPrice,
    String description,
    String photoUrl,
    boolean active,
    List<MaterialSupplierResponse> suppliers,
    List<ReviewResponse> reviews
) {
}
