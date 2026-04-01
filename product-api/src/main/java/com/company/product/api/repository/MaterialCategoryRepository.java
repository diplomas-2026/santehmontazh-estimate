package com.company.product.api.repository;

import com.company.product.api.entity.MaterialCategory;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialCategoryRepository extends JpaRepository<MaterialCategory, Long> {

    Optional<MaterialCategory> findByNameIgnoreCase(String name);
}
