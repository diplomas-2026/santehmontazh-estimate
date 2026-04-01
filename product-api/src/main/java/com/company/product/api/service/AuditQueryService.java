package com.company.product.api.service;

import com.company.product.api.dto.audit.AuditEventResponse;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.repository.AuditEventRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuditQueryService {

    private final AuditEventRepository auditEventRepository;

    public AuditQueryService(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    public List<AuditEventResponse> findAll() {
        return auditEventRepository.findAll().stream()
            .map(event -> new AuditEventResponse(event.getId(), event.getEntityType().name(), event.getEntityId(),
                event.getAction(), event.getActor().getFullName(), event.getDetails(), event.getCreatedAt()))
            .toList();
    }

    public List<AuditEventResponse> findByEntity(AuditEntityType entityType, Long entityId) {
        return auditEventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId).stream()
            .map(event -> new AuditEventResponse(event.getId(), event.getEntityType().name(), event.getEntityId(),
                event.getAction(), event.getActor().getFullName(), event.getDetails(), event.getCreatedAt()))
            .toList();
    }
}
