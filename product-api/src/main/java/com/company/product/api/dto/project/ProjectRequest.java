package com.company.product.api.dto.project;

import com.company.product.api.entity.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ProjectRequest(
    @NotBlank(message = "Название объекта обязательно")
    String name,
    @NotBlank(message = "Код объекта обязателен")
    String code,
    @NotBlank(message = "Адрес обязателен")
    String address,
    @NotBlank(message = "Описание обязательно")
    String description,
    @NotNull(message = "Статус обязателен")
    ProjectStatus status,
    @NotNull(message = "Дата начала обязательна")
    LocalDate plannedStartDate,
    @NotNull(message = "Дата завершения обязательна")
    LocalDate plannedEndDate
) {
}
