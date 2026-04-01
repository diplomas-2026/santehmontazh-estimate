package com.company.product.api.dto.subscription;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SubscriptionCheckoutRequest(
    @NotBlank(message = "Выберите тариф")
    String tierId,
    @NotBlank(message = "Выберите период подписки")
    String periodId,
    @NotBlank(message = "Укажите название компании")
    String companyName,
    @Email(message = "Введите корректный email")
    @NotBlank(message = "Укажите email")
    String email,
    @NotBlank(message = "Укажите владельца карты")
    String cardHolder,
    @NotBlank(message = "Укажите номер карты")
    String cardNumber,
    @NotBlank(message = "Укажите срок действия")
    String expiry,
    @NotBlank(message = "Укажите CVC")
    String cvc
) {
}

