package com.company.product.api.repository;

import com.company.product.api.entity.SupplierReview;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierReviewRepository extends JpaRepository<SupplierReview, Long> {

    List<SupplierReview> findBySupplierIdOrderByCreatedAtDesc(Long supplierId);
}
