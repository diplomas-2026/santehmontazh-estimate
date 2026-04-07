package com.company.product.api.repository;

import com.company.product.api.entity.Supplier;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    Optional<Supplier> findByNameIgnoreCase(String name);

    @Query("""
        select distinct so.supplier from SupplierOffer so
        join so.purchaseItem pi
        where pi.material.id = :materialId
        order by so.supplier.name
        """)
    List<Supplier> findLinkedByMaterialId(Long materialId);
}
