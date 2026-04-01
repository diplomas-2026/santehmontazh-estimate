package com.company.product.api.service;

import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.AuditEvent;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.repository.AuditEventRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditEventRepository auditEventRepository;

    public AuditService(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    public void log(AuditEntityType entityType, Long entityId, String action, UserAccount actor, String details) {
        AuditEvent event = new AuditEvent();
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setAction(action);
        event.setActor(actor);
        event.setDetails(details);
        auditEventRepository.save(event);
    }
}
