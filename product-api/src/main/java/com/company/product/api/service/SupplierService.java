package com.company.product.api.service;

import com.company.product.api.dto.common.ReviewRequest;
import com.company.product.api.dto.common.ReviewResponse;
import com.company.product.api.dto.supplier.SupplierDetailResponse;
import com.company.product.api.dto.supplier.SupplierMaterialResponse;
import com.company.product.api.dto.supplier.SupplierRequest;
import com.company.product.api.dto.supplier.SupplierResponse;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.Material;
import com.company.product.api.entity.Supplier;
import com.company.product.api.entity.SupplierReview;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.MaterialRepository;
import com.company.product.api.repository.SupplierRepository;
import com.company.product.api.repository.SupplierReviewRepository;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.SecurityUtils;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final MaterialRepository materialRepository;
    private final SupplierReviewRepository supplierReviewRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public SupplierService(SupplierRepository supplierRepository,
                           MaterialRepository materialRepository,
                           SupplierReviewRepository supplierReviewRepository,
                           UserRepository userRepository,
                           AuditService auditService) {
        this.supplierRepository = supplierRepository;
        this.materialRepository = materialRepository;
        this.supplierReviewRepository = supplierReviewRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public List<SupplierResponse> findAll() {
        return supplierRepository.findAll().stream().map(this::toResponse).toList();
    }

    public SupplierDetailResponse findById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Поставщик не найден"));
        List<SupplierMaterialResponse> materials = materialRepository.findLinkedBySupplierId(id).stream()
            .map(this::toMaterialResponse)
            .toList();
        List<ReviewResponse> reviews = supplierReviewRepository.findBySupplierIdOrderByCreatedAtDesc(id).stream()
            .map(this::toReviewResponse)
            .toList();
        return new SupplierDetailResponse(
            supplier.getId(),
            supplier.getName(),
            supplier.getContactPerson(),
            supplier.getPhone(),
            supplier.getEmail(),
            supplier.getAddress(),
            supplier.getWebsiteUrl(),
            supplier.getTelegram(),
            supplier.getRating(),
            supplier.isActive(),
            materials,
            reviews
        );
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

    @Transactional
    public List<ReviewResponse> addReview(Long supplierId, ReviewRequest request) {
        Supplier supplier = supplierRepository.findById(supplierId)
            .orElseThrow(() -> new NotFoundException("Поставщик не найден"));
        UserAccount actor = currentActor();
        boolean creating = supplierReviewRepository.findBySupplierIdAndAuthorId(supplierId, actor.getId()).isEmpty();
        SupplierReview review = supplierReviewRepository.findBySupplierIdAndAuthorId(supplierId, actor.getId())
            .orElseGet(() -> {
                SupplierReview created = new SupplierReview();
                created.setSupplier(supplier);
                created.setAuthor(actor);
                return created;
            });
        review.setRating(request.rating());
        review.setComment(request.comment());
        supplierReviewRepository.save(review);
        auditService.log(
            AuditEntityType.SUPPLIER,
            supplierId,
            creating ? "REVIEW_ADDED" : "REVIEW_UPDATED",
            actor,
            creating ? "Добавлен отзыв по поставщику" : "Обновлен отзыв по поставщику"
        );
        return supplierReviewRepository.findBySupplierIdOrderByCreatedAtDesc(supplierId).stream()
            .map(this::toReviewResponse)
            .toList();
    }

    private void apply(Supplier supplier, SupplierRequest request) {
        supplier.setName(request.name());
        supplier.setContactPerson(request.contactPerson());
        supplier.setPhone(request.phone());
        supplier.setEmail(request.email());
        supplier.setAddress(request.address());
        supplier.setWebsiteUrl(blankToNull(request.websiteUrl()));
        supplier.setTelegram(blankToNull(request.telegram()));
        supplier.setRating(request.rating());
        supplier.setActive(request.active());
    }

    private SupplierResponse toResponse(Supplier supplier) {
        return new SupplierResponse(supplier.getId(), supplier.getName(), supplier.getContactPerson(),
            supplier.getPhone(), supplier.getEmail(), supplier.getAddress(), supplier.getWebsiteUrl(),
            supplier.getTelegram(), supplier.getRating(), supplier.isActive());
    }

    private SupplierMaterialResponse toMaterialResponse(Material material) {
        return new SupplierMaterialResponse(
            material.getId(),
            material.getName(),
            material.getSku(),
            material.getUnit(),
            material.getDefaultPrice(),
            material.getPhotoUrl()
        );
    }

    private ReviewResponse toReviewResponse(SupplierReview review) {
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
