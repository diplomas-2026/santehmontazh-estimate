package com.company.product.api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @Email(message = "Введите корректный email")
    @NotBlank(message = "Email обязателен")
    String email,
    @NotBlank(message = "Пароль обязателен")
    String password
) {
}
