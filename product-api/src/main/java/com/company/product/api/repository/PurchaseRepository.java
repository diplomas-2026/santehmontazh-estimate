package com.company.product.api.repository;

import com.company.product.api.entity.Purchase;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    List<Purchase> findByEstimateId(Long estimateId);
}
