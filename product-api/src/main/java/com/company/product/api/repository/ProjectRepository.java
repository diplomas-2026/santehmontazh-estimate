package com.company.product.api.repository;

import com.company.product.api.entity.Project;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByOwnerId(Long ownerId);

    Optional<Project> findByIdAndOwnerId(Long id, Long ownerId);
}
