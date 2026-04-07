package com.company.product.api.repository;

import com.company.product.api.entity.AiTokenUsageDay;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiTokenUsageDayRepository extends JpaRepository<AiTokenUsageDay, Long> {

    Optional<AiTokenUsageDay> findByBusinessDate(LocalDate businessDate);
}
