package com.company.product.api.repository;

import com.company.product.api.entity.Estimate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstimateRepository extends JpaRepository<Estimate, Long> {

    List<Estimate> findByProjectIdOrderByVersionAsc(Long projectId);
}
