package com.company.product.api.dto.auth;

public record AuthResponse(
    String token,
    UserResponse user
) {
}
