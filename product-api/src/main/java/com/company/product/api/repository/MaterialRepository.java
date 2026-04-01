package com.company.product.api.repository;

import com.company.product.api.entity.Material;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    Optional<Material> findBySkuIgnoreCase(String sku);
}
