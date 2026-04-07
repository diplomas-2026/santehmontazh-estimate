package com.company.product.api.repository;

import com.company.product.api.entity.Material;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    Optional<Material> findBySkuIgnoreCase(String sku);

    List<Material> findTop10ByNameContainingIgnoreCaseOrderByNameAsc(String name);

    @Query("""
        select distinct m from Supplier s
        join s.materials m
        where s.id = :supplierId
        order by m.name
        """)
    List<Material> findLinkedBySupplierId(Long supplierId);
}
