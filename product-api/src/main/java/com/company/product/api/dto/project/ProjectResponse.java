package com.company.product.api.dto.project;

import com.company.product.api.entity.ProjectStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ProjectResponse(
    Long id,
    String name,
    String code,
    String address,
    String description,
    ProjectStatus status,
    LocalDate plannedStartDate,
    LocalDate plannedEndDate,
    BigDecimal estimateTotal,
    BigDecimal purchaseTotal
) {
}
