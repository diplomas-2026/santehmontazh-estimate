package com.company.product.api.dto.ai;

import com.company.product.api.entity.AiEstimateSessionStatus;
import java.util.List;

public record AiEstimateAssistantSessionResponse(
    Long id,
    Long projectId,
    AiEstimateSessionStatus status,
    String assistantMessage,
    String estimateName,
    String estimateNotes,
    List<AiEstimateQuestionResponse> questions,
    List<AiEstimateDraftItemResponse> draftItems,
    long consumedTokens,
    AiUsageResponse usage
) {
}
