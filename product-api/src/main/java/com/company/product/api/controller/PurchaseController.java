package com.company.product.api.controller;

import com.company.product.api.dto.purchase.ApprovalCommentRequest;
import com.company.product.api.dto.purchase.ApprovalCommentResponse;
import com.company.product.api.dto.purchase.PurchaseItemRequest;
import com.company.product.api.dto.purchase.PurchaseRequest;
import com.company.product.api.dto.purchase.PurchaseResponse;
import com.company.product.api.dto.purchase.SupplierOfferRequest;
import com.company.product.api.dto.purchase.SupplierOfferResponse;
import com.company.product.api.service.PurchaseService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @GetMapping("/purchases")
    public List<PurchaseResponse> findAll() {
        return purchaseService.findAll();
    }

    @GetMapping("/purchases/{id}")
    public PurchaseResponse findById(@PathVariable Long id) {
        return purchaseService.findById(id);
    }

    @PostMapping("/purchases")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public PurchaseResponse create(@Valid @RequestBody PurchaseRequest request) {
        return purchaseService.create(request);
    }

    @PostMapping("/purchases/from-estimate/{estimateId}")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public PurchaseResponse createFromEstimate(@PathVariable Long estimateId) {
        return purchaseService.createFromEstimate(estimateId);
    }

    @PutMapping("/purchases/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public PurchaseResponse update(@PathVariable Long id, @Valid @RequestBody PurchaseRequest request) {
        return purchaseService.update(id, request);
    }

    @PutMapping("/purchase-items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public PurchaseResponse updateItem(@PathVariable Long itemId, @Valid @RequestBody PurchaseItemRequest request) {
        return purchaseService.updateItem(itemId, request);
    }

    @GetMapping("/purchase-items/{itemId}/offers")
    public List<SupplierOfferResponse> offers(@PathVariable Long itemId) {
        return purchaseService.offers(itemId);
    }

    @PostMapping("/purchase-items/{itemId}/offers")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public List<SupplierOfferResponse> addOffer(@PathVariable Long itemId, @Valid @RequestBody SupplierOfferRequest request) {
        return purchaseService.addOffer(itemId, request);
    }

    @PostMapping("/purchase-items/{itemId}/offers/{offerId}/select")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public List<SupplierOfferResponse> selectOffer(@PathVariable Long itemId, @PathVariable Long offerId) {
        return purchaseService.selectOffer(itemId, offerId);
    }

    @PostMapping("/purchases/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public PurchaseResponse start(@PathVariable Long id) {
        return purchaseService.start(id);
    }

    @PostMapping("/purchases/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public PurchaseResponse complete(@PathVariable Long id) {
        return purchaseService.complete(id);
    }

    @GetMapping("/projects/{projectId}/purchases")
    public List<PurchaseResponse> findByProject(@PathVariable Long projectId) {
        return purchaseService.findByProject(projectId);
    }

    @GetMapping("/purchases/{id}/comments")
    public List<ApprovalCommentResponse> comments(@PathVariable Long id) {
        return purchaseService.comments(id);
    }

    @PostMapping("/purchases/{id}/comments")
    public List<ApprovalCommentResponse> addComment(@PathVariable Long id, @Valid @RequestBody ApprovalCommentRequest request) {
        return purchaseService.addComment(id, request);
    }

    @GetMapping(value = "/purchases/{id}/print", produces = MediaType.TEXT_PLAIN_VALUE)
    public String print(@PathVariable Long id) {
        return purchaseService.print(id);
    }
}
