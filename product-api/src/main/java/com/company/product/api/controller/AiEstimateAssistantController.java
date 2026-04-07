package com.company.product.api.controller;

import com.company.product.api.dto.ai.AiEstimateAssistantAnswerRequest;
import com.company.product.api.dto.ai.AiEstimateAssistantSessionResponse;
import com.company.product.api.dto.ai.AiEstimateAssistantStartRequest;
import com.company.product.api.dto.ai.AiUsageResponse;
import com.company.product.api.dto.estimate.EstimateResponse;
import com.company.product.api.service.AiEstimateAssistantService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiEstimateAssistantController {

    private final AiEstimateAssistantService aiEstimateAssistantService;

    public AiEstimateAssistantController(AiEstimateAssistantService aiEstimateAssistantService) {
        this.aiEstimateAssistantService = aiEstimateAssistantService;
    }

    @GetMapping("/usage")
    public AiUsageResponse usage() {
        return aiEstimateAssistantService.usage();
    }

    @PostMapping("/estimate-assistant/sessions")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public AiEstimateAssistantSessionResponse start(@Valid @RequestBody AiEstimateAssistantStartRequest request) {
        return aiEstimateAssistantService.start(request);
    }

    @GetMapping("/estimate-assistant/sessions/{id}")
    public AiEstimateAssistantSessionResponse findById(@PathVariable Long id) {
        return aiEstimateAssistantService.findById(id);
    }

    @PostMapping("/estimate-assistant/sessions/{id}/answers")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public AiEstimateAssistantSessionResponse answer(@PathVariable Long id,
                                                     @Valid @RequestBody AiEstimateAssistantAnswerRequest request) {
        return aiEstimateAssistantService.answer(id, request);
    }

    @PostMapping("/estimate-assistant/sessions/{id}/apply")
    @PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
    public EstimateResponse apply(@PathVariable Long id) {
        return aiEstimateAssistantService.apply(id);
    }
}
