package com.company.product.api.controller;

import com.company.product.api.dto.subscription.SubscriptionCheckoutRequest;
import com.company.product.api.dto.subscription.SubscriptionResponse;
import com.company.product.api.security.AuthenticatedUser;
import com.company.product.api.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscription")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/me")
    public ResponseEntity<SubscriptionResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
        SubscriptionResponse response = subscriptionService.getMySubscription(user);
        return response == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(response);
    }

    @PostMapping("/checkout")
    public SubscriptionResponse checkout(@AuthenticationPrincipal AuthenticatedUser user,
                                         @Valid @RequestBody SubscriptionCheckoutRequest request) {
        return subscriptionService.checkout(user, request);
    }
}

