package com.company.product.api.dto.auth;

import com.company.product.api.entity.Role;

public record UserResponse(
    Long id,
    String fullName,
    String email,
    Role role
) {
}
