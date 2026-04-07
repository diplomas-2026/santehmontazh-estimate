package com.company.product.api.dto.common;

import java.time.OffsetDateTime;

public record ReviewResponse(
    Long id,
    String authorName,
    int rating,
    String comment,
    OffsetDateTime createdAt
) {
}
