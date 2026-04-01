package com.company.product.api.dto.estimate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EstimateRequest(
    @NotNull(message = "Объект обязателен")
    Long projectId,
    @NotBlank(message = "Название сметы обязательно")
    String name,
    @NotBlank(message = "Примечание обязательно")
    String notes
) {
}
