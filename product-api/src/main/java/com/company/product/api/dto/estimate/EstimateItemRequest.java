package com.company.product.api.dto.estimate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record EstimateItemRequest(
    @NotNull(message = "Материал обязателен")
    Long materialId,
    @NotBlank(message = "Название работы обязательно")
    String workName,
    @NotNull(message = "Количество обязательно")
    @DecimalMin(value = "0.01", message = "Количество должно быть больше нуля")
    BigDecimal quantity,
    @NotNull(message = "Цена обязательна")
    @DecimalMin(value = "0.01", message = "Цена должна быть больше нуля")
    BigDecimal unitPrice,
    @NotBlank(message = "Комментарий обязателен")
    String comment
) {
}
