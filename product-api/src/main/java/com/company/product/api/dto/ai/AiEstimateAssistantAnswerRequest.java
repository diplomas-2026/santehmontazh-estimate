package com.company.product.api.dto.ai;

import jakarta.validation.constraints.NotEmpty;
import java.util.Map;

public record AiEstimateAssistantAnswerRequest(
    @NotEmpty(message = "Нужно ответить хотя бы на один вопрос")
    Map<String, String> answers
) {
}
