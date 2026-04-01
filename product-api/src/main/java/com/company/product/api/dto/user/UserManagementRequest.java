package com.company.product.api.dto.user;

import com.company.product.api.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserManagementRequest(
    @NotBlank(message = "Введите имя")
    String fullName,
    @Email(message = "Введите корректный email")
    @NotBlank(message = "Email обязателен")
    String email,
    @Size(min = 8, message = "Пароль должен содержать не менее 8 символов")
    String password,
    @NotNull(message = "Роль обязательна")
    Role role,
    boolean active
) {
}
