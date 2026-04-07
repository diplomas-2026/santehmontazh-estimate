package com.company.product.api.repository;

import com.company.product.api.entity.MaterialReview;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialReviewRepository extends JpaRepository<MaterialReview, Long> {

    List<MaterialReview> findByMaterialIdOrderByCreatedAtDesc(Long materialId);
}
