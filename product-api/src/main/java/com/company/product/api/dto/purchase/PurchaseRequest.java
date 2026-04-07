package com.company.product.api.dto.purchase;

import jakarta.validation.constraints.NotNull;

public record PurchaseRequest(
    @NotNull(message = "Смета обязательна")
    Long estimateId,
    String supplierName,
    String supplierUrl,
    String comment
) {
}
