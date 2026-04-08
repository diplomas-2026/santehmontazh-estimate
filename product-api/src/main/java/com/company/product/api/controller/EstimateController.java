package com.company.product.api.controller;

import com.company.product.api.dto.estimate.EstimateItemRequest;
import com.company.product.api.dto.estimate.EstimateRequest;
import com.company.product.api.dto.estimate.EstimateResponse;
import com.company.product.api.dto.estimate.MaterialRequirementResponse;
import com.company.product.api.service.EstimateService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class EstimateController {

    private final EstimateService estimateService;

    public EstimateController(EstimateService estimateService) {
        this.estimateService = estimateService;
    }

    @GetMapping("/estimates")
    public List<EstimateResponse> findAll() {
        return estimateService.findAll();
    }

    @GetMapping("/estimates/{id}")
    public EstimateResponse findById(@PathVariable Long id) {
        return estimateService.findById(id);
    }

    @PostMapping("/estimates")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public EstimateResponse create(@Valid @RequestBody EstimateRequest request) {
        return estimateService.create(request);
    }

    @PutMapping("/estimates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public EstimateResponse update(@PathVariable Long id, @Valid @RequestBody EstimateRequest request) {
        return estimateService.update(id, request);
    }

    @PostMapping("/estimates/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public EstimateResponse addItem(@PathVariable Long id, @Valid @RequestBody EstimateItemRequest request) {
        return estimateService.addItem(id, request);
    }

    @PutMapping("/estimate-items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public EstimateResponse updateItem(@PathVariable Long itemId, @Valid @RequestBody EstimateItemRequest request) {
        return estimateService.updateItem(itemId, request);
    }

    @DeleteMapping("/estimate-items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public void deleteItem(@PathVariable Long itemId) {
        estimateService.deleteItem(itemId);
    }

    @GetMapping("/estimates/{id}/requirements")
    public List<MaterialRequirementResponse> requirements(@PathVariable Long id) {
        return estimateService.requirements(id);
    }

    @GetMapping(value = "/estimates/{id}/report.xlsx", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> exportEstimate(@PathVariable Long id) {
        byte[] report = estimateService.exportEstimateWorkbook(id);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=estimate-" + id + ".xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(report);
    }

    @GetMapping(value = "/estimates/{id}/project-report.xlsx", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> exportProjectEstimates(@PathVariable Long id) {
        byte[] report = estimateService.exportProjectEstimatesWorkbook(id);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=project-" + id + "-estimates.xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(report);
    }

    @PostMapping({"/estimates/{id}/start-work", "/estimates/{id}/submit-for-purchase"})
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public EstimateResponse startWork(@PathVariable Long id) {
        return estimateService.submitForPurchase(id);
    }

    @PostMapping("/estimates/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public EstimateResponse complete(@PathVariable Long id) {
        return estimateService.complete(id);
    }

    @PostMapping("/estimates/{id}/archive")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public EstimateResponse archive(@PathVariable Long id) {
        return estimateService.archive(id);
    }

    @GetMapping("/projects/{projectId}/estimates")
    public List<EstimateResponse> findByProject(@PathVariable Long projectId) {
        return estimateService.findByProject(projectId);
    }
}
