package com.company.product.api.dto.ai;

import java.time.OffsetDateTime;

public record AiUsageResponse(
    boolean available,
    long dailyLimit,
    long usedTokens,
    long remainingTokens,
    OffsetDateTime resetAt,
    String message
) {
}
