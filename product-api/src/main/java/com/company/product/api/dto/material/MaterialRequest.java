package com.company.product.api.dto.material;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record MaterialRequest(
    @NotBlank(message = "Название материала обязательно")
    String name,
    @NotBlank(message = "Артикул обязателен")
    String sku,
    @NotBlank(message = "Единица измерения обязательна")
    String unit,
    @NotNull(message = "Категория обязательна")
    Long categoryId,
    @NotNull(message = "Базовая цена обязательна")
    @DecimalMin(value = "0.01", message = "Базовая цена должна быть больше нуля")
    BigDecimal defaultPrice,
    @NotBlank(message = "Описание обязательно")
    String description,
    String photoUrl,
    boolean active
) {
}
