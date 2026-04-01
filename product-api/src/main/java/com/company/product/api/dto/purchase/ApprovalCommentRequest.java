package com.company.product.api.dto.purchase;

import jakarta.validation.constraints.NotBlank;

public record ApprovalCommentRequest(
    @NotBlank(message = "Комментарий обязателен")
    String message
) {
}
