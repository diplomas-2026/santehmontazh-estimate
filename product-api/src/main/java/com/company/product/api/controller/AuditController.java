package com.company.product.api.controller;

import com.company.product.api.dto.audit.AuditEventResponse;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.service.AuditQueryService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {

    private final AuditQueryService auditQueryService;

    public AuditController(AuditQueryService auditQueryService) {
        this.auditQueryService = auditQueryService;
    }

    @GetMapping
    public List<AuditEventResponse> findAll() {
        return auditQueryService.findAll();
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public List<AuditEventResponse> findByEntity(@PathVariable AuditEntityType entityType, @PathVariable Long entityId) {
        return auditQueryService.findByEntity(entityType, entityId);
    }
}
