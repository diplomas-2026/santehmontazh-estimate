package com.company.product.api.service;

import com.company.product.api.dto.supplier.SupplierRequest;
import com.company.product.api.dto.supplier.SupplierResponse;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.Supplier;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.SupplierRepository;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.SecurityUtils;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public SupplierService(SupplierRepository supplierRepository,
                           UserRepository userRepository,
                           AuditService auditService) {
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public List<SupplierResponse> findAll() {
        return supplierRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public SupplierResponse create(SupplierRequest request) {
        Supplier supplier = new Supplier();
        apply(supplier, request);
        Supplier saved = supplierRepository.save(supplier);
        auditService.log(AuditEntityType.SUPPLIER, saved.getId(), "CREATED", currentActor(), "Создан поставщик");
        return toResponse(saved);
    }

    @Transactional
    public SupplierResponse update(Long id, SupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Поставщик не найден"));
        apply(supplier, request);
        Supplier saved = supplierRepository.save(supplier);
        auditService.log(AuditEntityType.SUPPLIER, saved.getId(), "UPDATED", currentActor(), "Обновлен поставщик");
        return toResponse(saved);
    }

    private void apply(Supplier supplier, SupplierRequest request) {
        supplier.setName(request.name());
        supplier.setContactPerson(request.contactPerson());
        supplier.setPhone(request.phone());
        supplier.setEmail(request.email());
        supplier.setAddress(request.address());
        supplier.setRating(request.rating());
        supplier.setActive(request.active());
    }

    private SupplierResponse toResponse(Supplier supplier) {
        return new SupplierResponse(supplier.getId(), supplier.getName(), supplier.getContactPerson(),
            supplier.getPhone(), supplier.getEmail(), supplier.getAddress(), supplier.getRating(), supplier.isActive());
    }

    private com.company.product.api.entity.UserAccount currentActor() {
        return userRepository.findById(SecurityUtils.currentUser().id())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
    }
}
