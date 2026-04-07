package com.company.product.api.dto.purchase;

import com.company.product.api.entity.PurchaseStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record PurchaseResponse(
    Long id,
    Long projectId,
    String projectName,
    Long estimateId,
    String estimateName,
    PurchaseStatus status,
    BigDecimal plannedTotal,
    BigDecimal actualTotal,
    BigDecimal deviation,
    String supplierName,
    String supplierUrl,
    String comment,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    List<PurchaseItemResponse> items,
    List<ApprovalCommentResponse> comments
) {
}
