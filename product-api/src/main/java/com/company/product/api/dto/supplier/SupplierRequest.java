package com.company.product.api.dto.supplier;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record SupplierRequest(
    @NotBlank(message = "Название поставщика обязательно")
    String name,
    @NotBlank(message = "Контактное лицо обязательно")
    String contactPerson,
    @NotBlank(message = "Телефон обязателен")
    String phone,
    @Email(message = "Введите корректный email")
    @NotBlank(message = "Email обязателен")
    String email,
    @NotBlank(message = "Адрес обязателен")
    String address,
    String websiteUrl,
    String telegram,
    @NotNull(message = "Рейтинг обязателен")
    @DecimalMin(value = "0.0", message = "Рейтинг не может быть отрицательным")
    BigDecimal rating,
    boolean active
) {
}
