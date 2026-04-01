package com.company.product.api.security;

import com.company.product.api.config.AppProperties;
import com.company.product.api.entity.UserAccount;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final AppProperties appProperties;

    public JwtService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public String generateToken(UserAccount user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(appProperties.jwt().expirationHours(), ChronoUnit.HOURS);

        return Jwts.builder()
            .subject(user.getEmail())
            .issuer(appProperties.jwt().issuer())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .claim("userId", user.getId())
            .claim("role", user.getRole().name())
            .claim("fullName", user.getFullName())
            .signWith(secretKey())
            .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, AuthenticatedUser user) {
        Claims claims = parseClaims(token);
        return claims.getSubject().equalsIgnoreCase(user.getUsername())
            && claims.getExpiration().after(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(secretKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey secretKey() {
        return Keys.hmacShaKeyFor(appProperties.jwt().secret().getBytes(StandardCharsets.UTF_8));
    }
}
