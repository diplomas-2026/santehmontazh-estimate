package com.company.product.api.service;

import com.company.product.api.dto.material.MaterialCategoryResponse;
import com.company.product.api.dto.material.MaterialRequest;
import com.company.product.api.dto.material.MaterialResponse;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.Material;
import com.company.product.api.entity.MaterialCategory;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.MaterialCategoryRepository;
import com.company.product.api.repository.MaterialRepository;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.SecurityUtils;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final MaterialCategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public MaterialService(MaterialRepository materialRepository,
                           MaterialCategoryRepository categoryRepository,
                           UserRepository userRepository,
                           AuditService auditService) {
        this.materialRepository = materialRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public List<MaterialResponse> findAll() {
        return materialRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<MaterialCategoryResponse> categories() {
        return categoryRepository.findAll().stream()
            .map(category -> new MaterialCategoryResponse(category.getId(), category.getName(), category.getDescription()))
            .toList();
    }

    @Transactional
    public MaterialResponse create(MaterialRequest request) {
        Material material = new Material();
        apply(material, request);
        Material saved = materialRepository.save(material);
        auditService.log(AuditEntityType.MATERIAL, saved.getId(), "CREATED", currentActor(), "Создан материал");
        return toResponse(saved);
    }

    @Transactional
    public MaterialResponse update(Long id, MaterialRequest request) {
        Material material = materialRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Материал не найден"));
        apply(material, request);
        Material saved = materialRepository.save(material);
        auditService.log(AuditEntityType.MATERIAL, saved.getId(), "UPDATED", currentActor(), "Обновлен материал");
        return toResponse(saved);
    }

    private void apply(Material material, MaterialRequest request) {
        MaterialCategory category = categoryRepository.findById(request.categoryId())
            .orElseThrow(() -> new NotFoundException("Категория материала не найдена"));
        material.setName(request.name());
        material.setSku(request.sku());
        material.setUnit(request.unit());
        material.setCategory(category);
        material.setDefaultPrice(request.defaultPrice());
        material.setDescription(request.description());
        material.setActive(request.active());
    }

    private MaterialResponse toResponse(Material material) {
        return new MaterialResponse(material.getId(), material.getName(), material.getSku(), material.getUnit(),
            material.getCategory().getId(), material.getCategory().getName(), material.getDefaultPrice(),
            material.getDescription(), material.isActive());
    }

    private com.company.product.api.entity.UserAccount currentActor() {
        return userRepository.findById(SecurityUtils.currentUser().id())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
    }
}
