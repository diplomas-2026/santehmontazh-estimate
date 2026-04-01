package com.company.product.api.service;

import com.company.product.api.dto.auth.UserResponse;
import com.company.product.api.dto.user.UserManagementRequest;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.SecurityUtils;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserManagementService(UserRepository userRepository,
                                 PasswordEncoder passwordEncoder,
                                 AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
            .map(user -> new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole()))
            .toList();
    }

    @Transactional
    public UserResponse create(UserManagementRequest request) {
        UserAccount user = new UserAccount();
        apply(user, request);
        UserAccount saved = userRepository.save(user);
        auditService.log(AuditEntityType.USER, saved.getId(), "CREATED", currentActor(), "Пользователь создан администратором");
        return new UserResponse(saved.getId(), saved.getFullName(), saved.getEmail(), saved.getRole());
    }

    @Transactional
    public UserResponse update(Long id, UserManagementRequest request) {
        UserAccount user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("Пользователь не найден"));
        apply(user, request);
        UserAccount saved = userRepository.save(user);
        auditService.log(AuditEntityType.USER, saved.getId(), "UPDATED", currentActor(), "Пользователь обновлен администратором");
        return new UserResponse(saved.getId(), saved.getFullName(), saved.getEmail(), saved.getRole());
    }

    private void apply(UserAccount user, UserManagementRequest request) {
        user.setFullName(request.fullName());
        user.setEmail(request.email().toLowerCase());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        user.setRole(request.role());
        user.setActive(request.active());
    }

    private UserAccount currentActor() {
        return userRepository.findById(SecurityUtils.currentUser().id())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
    }
}
