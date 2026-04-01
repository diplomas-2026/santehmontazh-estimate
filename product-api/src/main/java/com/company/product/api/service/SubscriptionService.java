package com.company.product.api.service;

import com.company.product.api.dto.subscription.SubscriptionCheckoutRequest;
import com.company.product.api.dto.subscription.SubscriptionResponse;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.Subscription;
import com.company.product.api.entity.SubscriptionStatus;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.exception.BadRequestException;
import com.company.product.api.repository.SubscriptionRepository;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.AuthenticatedUser;
import java.time.OffsetDateTime;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriptionService {

    private static final Map<String, PlanDefinition> PLANS = Map.of(
        "starter", new PlanDefinition("Start", Map.of("month", new PeriodDefinition("1 месяц", 1, "2 900 ₽"),
            "quarter", new PeriodDefinition("3 месяца", 3, "7 500 ₽"),
            "year", new PeriodDefinition("12 месяцев", 12, "27 900 ₽"))),
        "pro", new PlanDefinition("Pro", Map.of("month", new PeriodDefinition("1 месяц", 1, "6 900 ₽"),
            "quarter", new PeriodDefinition("3 месяца", 3, "17 900 ₽"),
            "year", new PeriodDefinition("12 месяцев", 12, "64 900 ₽"))),
        "enterprise", new PlanDefinition("Scale", Map.of("month", new PeriodDefinition("1 месяц", 1, "12 900 ₽"),
            "quarter", new PeriodDefinition("3 месяца", 3, "33 900 ₽"),
            "year", new PeriodDefinition("12 месяцев", 12, "124 900 ₽")))
    );

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               UserRepository userRepository,
                               AuditService auditService) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public SubscriptionResponse getMySubscription(AuthenticatedUser authenticatedUser) {
        Subscription subscription = subscriptionRepository.findByUserId(authenticatedUser.id()).orElse(null);
        if (subscription == null) {
            return null;
        }
        if (subscription.getExpiresAt().isBefore(OffsetDateTime.now()) && subscription.getStatus() == SubscriptionStatus.ACTIVE) {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
        }
        return toResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse checkout(AuthenticatedUser authenticatedUser, SubscriptionCheckoutRequest request) {
        validateCheckoutRequest(authenticatedUser, request);

        UserAccount user = userRepository.findById(authenticatedUser.id())
            .orElseThrow(() -> new BadRequestException("Пользователь не найден"));

        PlanDefinition plan = PLANS.get(request.tierId());
        if (plan == null) {
            throw new BadRequestException("Выбран неизвестный тариф");
        }

        PeriodDefinition period = plan.periods().get(request.periodId());
        if (period == null) {
            throw new BadRequestException("Выбран неизвестный период подписки");
        }

        Subscription subscription = subscriptionRepository.findByUserId(user.getId()).orElseGet(Subscription::new);
        subscription.setUser(user);
        subscription.setTierId(request.tierId());
        subscription.setTierName(plan.name());
        subscription.setPeriodId(request.periodId());
        subscription.setPeriodLabel(period.label());
        subscription.setPriceLabel(period.priceLabel());
        subscription.setCompanyName(request.companyName().trim());
        subscription.setCardHolder(request.cardHolder().trim());
        subscription.setStatus(SubscriptionStatus.ACTIVE);

        OffsetDateTime activatedAt = OffsetDateTime.now();
        OffsetDateTime expiresAt = activatedAt.plusMonths(period.months());
        subscription.setActivatedAt(activatedAt);
        subscription.setExpiresAt(expiresAt);

        Subscription savedSubscription = subscriptionRepository.save(subscription);
        auditService.log(
            AuditEntityType.SUBSCRIPTION,
            savedSubscription.getId(),
            "SUBSCRIPTION_ACTIVATED",
            user,
            "%s на %s".formatted(plan.name(), period.label())
        );
        return toResponse(savedSubscription);
    }

    private void validateCheckoutRequest(AuthenticatedUser authenticatedUser, SubscriptionCheckoutRequest request) {
        if (!authenticatedUser.getUsername().equalsIgnoreCase(request.email().trim())) {
            throw new BadRequestException("Оформить подписку можно только для авторизованного пользователя");
        }
        if (digitsOnly(request.cardNumber()).length() < 16) {
            throw new BadRequestException("Номер карты должен содержать не менее 16 цифр");
        }
        if (request.expiry().trim().length() < 4) {
            throw new BadRequestException("Укажите срок действия карты");
        }
        if (digitsOnly(request.cvc()).length() < 3) {
            throw new BadRequestException("CVC должен содержать не менее 3 цифр");
        }
    }

    private String digitsOnly(String value) {
        return value.replaceAll("\\D", "");
    }

    private SubscriptionResponse toResponse(Subscription subscription) {
        return new SubscriptionResponse(
            subscription.getId(),
            subscription.getTierId(),
            subscription.getTierName(),
            subscription.getPeriodId(),
            subscription.getPeriodLabel(),
            subscription.getPriceLabel(),
            subscription.getCompanyName(),
            subscription.getCardHolder(),
            subscription.getStatus(),
            subscription.getActivatedAt(),
            subscription.getExpiresAt()
        );
    }

    private record PlanDefinition(String name, Map<String, PeriodDefinition> periods) {
    }

    private record PeriodDefinition(String label, int months, String priceLabel) {
    }
}
