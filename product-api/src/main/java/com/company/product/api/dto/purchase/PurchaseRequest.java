package com.company.product.api.dto.purchase;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PurchaseRequest(
    @NotNull(message = "Смета обязательна")
    Long estimateId,
    @NotBlank(message = "Название поставщика обязательно")
    String supplierName,
    @NotBlank(message = "Комментарий обязателен")
    String comment
) {
}
