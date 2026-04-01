package com.company.product.api.dto.purchase;

import java.time.OffsetDateTime;

public record ApprovalCommentResponse(
    Long id,
    String authorName,
    String message,
    OffsetDateTime createdAt
) {
}
