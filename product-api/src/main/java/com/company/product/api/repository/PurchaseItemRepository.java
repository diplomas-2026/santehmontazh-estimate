package com.company.product.api.repository;

import com.company.product.api.entity.PurchaseItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseItemRepository extends JpaRepository<PurchaseItem, Long> {

    List<PurchaseItem> findByPurchaseId(Long purchaseId);
}
