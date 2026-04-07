package com.company.product.api.repository;

import com.company.product.api.entity.AiEstimateSession;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiEstimateSessionRepository extends JpaRepository<AiEstimateSession, Long> {

    Optional<AiEstimateSession> findByIdAndCreatedById(Long id, Long createdById);
}
