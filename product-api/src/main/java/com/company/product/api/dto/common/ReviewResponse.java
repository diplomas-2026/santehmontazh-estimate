package com.company.product.api.dto.common;

import java.time.OffsetDateTime;

public record ReviewResponse(
    Long id,
    Long authorId,
    String authorName,
    int rating,
    String comment,
    OffsetDateTime createdAt,
    boolean currentUser
) {
}
