package com.company.product.api.controller;

import com.company.product.api.dto.material.MaterialCategoryResponse;
import com.company.product.api.dto.material.MaterialRequest;
import com.company.product.api.dto.material.MaterialResponse;
import com.company.product.api.service.MaterialService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    private final MaterialService materialService;

    public MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    @GetMapping
    public List<MaterialResponse> findAll() {
        return materialService.findAll();
    }

    @GetMapping("/categories")
    public List<MaterialCategoryResponse> categories() {
        return materialService.categories();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public MaterialResponse create(@Valid @RequestBody MaterialRequest request) {
        return materialService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MaterialResponse update(@PathVariable Long id, @Valid @RequestBody MaterialRequest request) {
        return materialService.update(id, request);
    }
}
