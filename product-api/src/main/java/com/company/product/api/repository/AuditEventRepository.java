package com.company.product.api.repository;

import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.AuditEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {

    List<AuditEvent> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(AuditEntityType entityType, Long entityId);
}
