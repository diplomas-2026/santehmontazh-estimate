package com.company.product.api.dto.estimate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record EstimateItemRequest(
    Long materialId,
    String workName,
    @NotNull(message = "Количество обязательно")
    @DecimalMin(value = "0.01", message = "Количество должно быть больше нуля")
    BigDecimal quantity,
    @NotNull(message = "Цена обязательна")
    @DecimalMin(value = "0.01", message = "Цена должна быть больше нуля")
    BigDecimal unitPrice,
    String comment
) {
}
