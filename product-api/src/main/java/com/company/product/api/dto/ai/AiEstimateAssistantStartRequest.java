package com.company.product.api.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AiEstimateAssistantStartRequest(
    @NotNull(message = "Объект обязателен")
    Long projectId,
    @NotBlank(message = "Опишите, что нужно посчитать")
    @Size(max = 2500, message = "Описание должно быть не длиннее 2500 символов")
    String message
) {
}
