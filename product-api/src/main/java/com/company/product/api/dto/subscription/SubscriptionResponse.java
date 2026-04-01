package com.company.product.api.dto.subscription;

import com.company.product.api.entity.SubscriptionStatus;
import java.time.OffsetDateTime;

public record SubscriptionResponse(
    Long id,
    String tierId,
    String tierName,
    String periodId,
    String periodLabel,
    String priceLabel,
    String companyName,
    String cardHolder,
    SubscriptionStatus status,
    OffsetDateTime activatedAt,
    OffsetDateTime expiresAt
) {
}

