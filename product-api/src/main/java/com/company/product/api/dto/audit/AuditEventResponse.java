package com.company.product.api.dto.audit;

import java.time.OffsetDateTime;

public record AuditEventResponse(
    Long id,
    String entityType,
    Long entityId,
    String action,
    String actorName,
    String details,
    OffsetDateTime createdAt
) {
}
