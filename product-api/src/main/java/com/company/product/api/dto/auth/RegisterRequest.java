package com.company.product.api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Введите имя")
    String fullName,
    @Email(message = "Введите корректный email")
    @NotBlank(message = "Email обязателен")
    String email,
    @NotBlank(message = "Пароль обязателен")
    @Size(min = 8, message = "Пароль должен содержать не менее 8 символов")
    String password
) {
}
