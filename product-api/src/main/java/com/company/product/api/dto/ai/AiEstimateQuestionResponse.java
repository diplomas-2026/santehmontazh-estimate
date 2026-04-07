package com.company.product.api.dto.ai;

public record AiEstimateQuestionResponse(
    String key,
    String label,
    String placeholder,
    String reason
) {
}
