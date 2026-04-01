package com.company.product.api.service;

import com.company.product.api.dto.auth.AuthResponse;
import com.company.product.api.dto.auth.LoginRequest;
import com.company.product.api.dto.auth.RegisterRequest;
import com.company.product.api.dto.auth.UserResponse;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.exception.BadRequestException;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.AuthenticatedUser;
import com.company.product.api.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (BadCredentialsException exception) {
            throw new BadRequestException("Неверный email или пароль");
        }

        UserAccount user = userRepository.findByEmailIgnoreCase(request.email())
            .orElseThrow(() -> new BadRequestException("Неверный email или пароль"));
        return toAuthResponse(user);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        userRepository.findByEmailIgnoreCase(request.email()).ifPresent(existing -> {
            throw new BadRequestException("Пользователь с таким email уже существует");
        });

        UserAccount user = new UserAccount();
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.ESTIMATOR);
        user.setActive(true);
        UserAccount savedUser = userRepository.save(user);
        auditService.log(AuditEntityType.USER, savedUser.getId(), "REGISTERED", savedUser, "Самостоятельная регистрация");
        return toAuthResponse(savedUser);
    }

    public UserResponse me(AuthenticatedUser authenticatedUser) {
        return new UserResponse(
            authenticatedUser.id(),
            authenticatedUser.fullName(),
            authenticatedUser.getUsername(),
            authenticatedUser.role()
        );
    }

    private AuthResponse toAuthResponse(UserAccount user) {
        return new AuthResponse(
            jwtService.generateToken(user),
            new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole())
        );
    }
}
