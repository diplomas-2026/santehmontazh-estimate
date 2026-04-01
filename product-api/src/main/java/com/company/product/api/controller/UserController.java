package com.company.product.api.controller;

import com.company.product.api.dto.auth.UserResponse;
import com.company.product.api.dto.user.UserManagementRequest;
import com.company.product.api.service.UserManagementService;
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
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserManagementService userManagementService;

    public UserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public List<UserResponse> findAll() {
        return userManagementService.findAll();
    }

    @PostMapping
    public UserResponse create(@Valid @RequestBody UserManagementRequest request) {
        return userManagementService.create(request);
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserManagementRequest request) {
        return userManagementService.update(id, request);
    }
}
