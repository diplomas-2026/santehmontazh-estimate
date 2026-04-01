package com.company.product.api.repository;

import com.company.product.api.entity.Supplier;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    Optional<Supplier> findByNameIgnoreCase(String name);
}
