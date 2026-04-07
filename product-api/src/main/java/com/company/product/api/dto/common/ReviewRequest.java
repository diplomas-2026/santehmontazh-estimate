package com.company.product.api.dto.common;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ReviewRequest(
    @Min(value = 1, message = "Оценка должна быть не ниже 1")
    @Max(value = 5, message = "Оценка должна быть не выше 5")
    int rating,
    @NotBlank(message = "Текст отзыва обязателен")
    String comment
) {
}
