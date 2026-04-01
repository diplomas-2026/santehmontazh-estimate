package com.company.product.api.dto.purchase;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record SupplierOfferRequest(
    @NotNull(message = "Поставщик обязателен")
    Long supplierId,
    @NotNull(message = "Цена обязательна")
    @DecimalMin(value = "0.01", message = "Цена должна быть больше нуля")
    BigDecimal offeredPrice,
    @NotNull(message = "Срок поставки обязателен")
    Integer deliveryDays,
    @NotBlank(message = "Комментарий обязателен")
    String comment
) {
}
