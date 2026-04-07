package com.company.product.api.repository;

import com.company.product.api.entity.SupplierReview;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierReviewRepository extends JpaRepository<SupplierReview, Long> {

    List<SupplierReview> findBySupplierIdOrderByCreatedAtDesc(Long supplierId);

    Optional<SupplierReview> findBySupplierIdAndAuthorId(Long supplierId, Long authorId);
}
