package com.company.product.api.dto.estimate;

import com.company.product.api.entity.EstimateStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record EstimateResponse(
    Long id,
    Long projectId,
    String projectName,
    String name,
    Integer version,
    EstimateStatus status,
    String notes,
    Long createdById,
    String createdByName,
    Long baseEstimateId,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    BigDecimal total,
    List<EstimateItemResponse> items
) {
}
