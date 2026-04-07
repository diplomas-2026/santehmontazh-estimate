package com.company.product.api.service;

import com.company.product.api.dto.material.MaterialCategoryResponse;
import com.company.product.api.dto.material.MaterialDetailResponse;
import com.company.product.api.dto.material.MaterialRequest;
import com.company.product.api.dto.material.MaterialResponse;
import com.company.product.api.dto.material.MaterialSupplierResponse;
import com.company.product.api.dto.common.ReviewRequest;
import com.company.product.api.dto.common.ReviewResponse;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.Material;
import com.company.product.api.entity.MaterialCategory;
import com.company.product.api.entity.MaterialReview;
import com.company.product.api.entity.Supplier;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.MaterialCategoryRepository;
import com.company.product.api.repository.MaterialRepository;
import com.company.product.api.repository.MaterialReviewRepository;
import com.company.product.api.repository.SupplierRepository;
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
    private final SupplierRepository supplierRepository;
    private final MaterialReviewRepository materialReviewRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public MaterialService(MaterialRepository materialRepository,
                           MaterialCategoryRepository categoryRepository,
                           SupplierRepository supplierRepository,
                           MaterialReviewRepository materialReviewRepository,
                           UserRepository userRepository,
                           AuditService auditService) {
        this.materialRepository = materialRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.materialReviewRepository = materialReviewRepository;
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

    public MaterialDetailResponse findById(Long id) {
        Material material = materialRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Материал не найден"));
        List<MaterialSupplierResponse> suppliers = supplierRepository.findLinkedByMaterialId(id).stream()
            .map(this::toSupplierResponse)
            .toList();
        List<ReviewResponse> reviews = materialReviewRepository.findByMaterialIdOrderByCreatedAtDesc(id).stream()
            .map(this::toReviewResponse)
            .toList();
        return new MaterialDetailResponse(
            material.getId(),
            material.getName(),
            material.getSku(),
            material.getUnit(),
            material.getCategory().getId(),
            material.getCategory().getName(),
            material.getDefaultPrice(),
            material.getDescription(),
            material.getPhotoUrl(),
            material.isActive(),
            suppliers,
            reviews
        );
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

    @Transactional
    public List<ReviewResponse> addReview(Long materialId, ReviewRequest request) {
        Material material = materialRepository.findById(materialId)
            .orElseThrow(() -> new NotFoundException("Материал не найден"));
        UserAccount actor = currentActor();
        boolean creating = materialReviewRepository.findByMaterialIdAndAuthorId(materialId, actor.getId()).isEmpty();
        MaterialReview review = materialReviewRepository.findByMaterialIdAndAuthorId(materialId, actor.getId())
            .orElseGet(() -> {
                MaterialReview created = new MaterialReview();
                created.setMaterial(material);
                created.setAuthor(actor);
                return created;
            });
        review.setRating(request.rating());
        review.setComment(request.comment());
        materialReviewRepository.save(review);
        auditService.log(
            AuditEntityType.MATERIAL,
            materialId,
            creating ? "REVIEW_ADDED" : "REVIEW_UPDATED",
            actor,
            creating ? "Добавлен отзыв по материалу" : "Обновлен отзыв по материалу"
        );
        return materialReviewRepository.findByMaterialIdOrderByCreatedAtDesc(materialId).stream()
            .map(this::toReviewResponse)
            .toList();
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
        material.setPhotoUrl(blankToNull(request.photoUrl()));
        material.setActive(request.active());
    }

    private MaterialResponse toResponse(Material material) {
        return new MaterialResponse(material.getId(), material.getName(), material.getSku(), material.getUnit(),
            material.getCategory().getId(), material.getCategory().getName(), material.getDefaultPrice(),
            material.getDescription(), material.getPhotoUrl(), material.isActive());
    }

    private MaterialSupplierResponse toSupplierResponse(Supplier supplier) {
        return new MaterialSupplierResponse(
            supplier.getId(),
            supplier.getName(),
            supplier.getRating(),
            supplier.getPhone(),
            supplier.getEmail(),
            supplier.getWebsiteUrl(),
            supplier.getTelegram()
        );
    }

    private ReviewResponse toReviewResponse(MaterialReview review) {
        Long currentUserId = SecurityUtils.currentUser().id();
        return new ReviewResponse(
            review.getId(),
            review.getAuthor().getId(),
            review.getAuthor().getFullName(),
            review.getRating(),
            review.getComment(),
            review.getCreatedAt(),
            review.getAuthor().getId().equals(currentUserId)
        );
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private com.company.product.api.entity.UserAccount currentActor() {
        return userRepository.findById(SecurityUtils.currentUser().id())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
    }
}
