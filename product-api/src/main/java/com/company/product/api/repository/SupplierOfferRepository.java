package com.company.product.api.repository;

import com.company.product.api.entity.SupplierOffer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierOfferRepository extends JpaRepository<SupplierOffer, Long> {

    List<SupplierOffer> findByPurchaseItemId(Long purchaseItemId);
}
