package com.company.product.api.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Cors cors, Jwt jwt, Bootstrap bootstrap, Ai ai) {

    public record Cors(List<String> allowedOrigins) {
    }

    public record Jwt(String issuer, String secret, long expirationHours) {
    }

    public record Bootstrap(boolean seedEnabled, boolean demoUsersEnabled, String usersFile) {
    }

    public record Ai(boolean enabled, long dailyTokenLimit, String resetZone, int minTokensPerRequest, int maxCompletionTokens) {
    }
}
