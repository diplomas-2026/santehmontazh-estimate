package com.company.product.api.repository;

import com.company.product.api.entity.EstimateItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstimateItemRepository extends JpaRepository<EstimateItem, Long> {

    List<EstimateItem> findByEstimateId(Long estimateId);
}
