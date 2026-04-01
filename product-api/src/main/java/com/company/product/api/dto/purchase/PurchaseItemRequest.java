package com.company.product.api.dto.purchase;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PurchaseItemRequest(
    @NotNull(message = "Плановое количество обязательно")
    @DecimalMin(value = "0.00", inclusive = true, message = "Количество не может быть отрицательным")
    BigDecimal plannedQuantity,
    @NotNull(message = "Плановая цена обязательна")
    @DecimalMin(value = "0.00", inclusive = true, message = "Цена не может быть отрицательной")
    BigDecimal plannedPrice,
    @NotNull(message = "Фактическое количество обязательно")
    @DecimalMin(value = "0.00", inclusive = true, message = "Количество не может быть отрицательным")
    BigDecimal actualQuantity,
    @NotNull(message = "Фактическая цена обязательна")
    @DecimalMin(value = "0.00", inclusive = true, message = "Цена не может быть отрицательной")
    BigDecimal actualPrice,
    @NotBlank(message = "Комментарий обязателен")
    String comment
) {
}
