package com.company.product.api.seed;

import com.company.product.api.config.AppProperties;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.Estimate;
import com.company.product.api.entity.EstimateItem;
import com.company.product.api.entity.EstimateStatus;
import com.company.product.api.entity.Material;
import com.company.product.api.entity.MaterialCategory;
import com.company.product.api.entity.MaterialReview;
import com.company.product.api.entity.Project;
import com.company.product.api.entity.ProjectStatus;
import com.company.product.api.entity.Purchase;
import com.company.product.api.entity.PurchaseItem;
import com.company.product.api.entity.PurchaseStatus;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.Supplier;
import com.company.product.api.entity.SupplierOffer;
import com.company.product.api.entity.SupplierReview;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.repository.EstimateItemRepository;
import com.company.product.api.repository.EstimateRepository;
import com.company.product.api.repository.MaterialCategoryRepository;
import com.company.product.api.repository.MaterialRepository;
import com.company.product.api.repository.MaterialReviewRepository;
import com.company.product.api.repository.ProjectRepository;
import com.company.product.api.repository.PurchaseItemRepository;
import com.company.product.api.repository.PurchaseRepository;
import com.company.product.api.repository.SupplierOfferRepository;
import com.company.product.api.repository.SupplierRepository;
import com.company.product.api.repository.SupplierReviewRepository;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.service.AuditService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SeedDataLoader {

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final MaterialCategoryRepository categoryRepository;
    private final MaterialRepository materialRepository;
    private final MaterialReviewRepository materialReviewRepository;
    private final SupplierRepository supplierRepository;
    private final SupplierReviewRepository supplierReviewRepository;
    private final EstimateRepository estimateRepository;
    private final EstimateItemRepository estimateItemRepository;
    private final PurchaseRepository purchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final SupplierOfferRepository supplierOfferRepository;
    private final AuditService auditService;

    public SeedDataLoader(AppProperties appProperties,
                          ObjectMapper objectMapper,
                          PasswordEncoder passwordEncoder,
                          UserRepository userRepository,
                          ProjectRepository projectRepository,
                          MaterialCategoryRepository categoryRepository,
                          MaterialRepository materialRepository,
                          MaterialReviewRepository materialReviewRepository,
                          SupplierRepository supplierRepository,
                          SupplierReviewRepository supplierReviewRepository,
                          EstimateRepository estimateRepository,
                          EstimateItemRepository estimateItemRepository,
                          PurchaseRepository purchaseRepository,
                          PurchaseItemRepository purchaseItemRepository,
                          SupplierOfferRepository supplierOfferRepository,
                          AuditService auditService) {
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.categoryRepository = categoryRepository;
        this.materialRepository = materialRepository;
        this.materialReviewRepository = materialReviewRepository;
        this.supplierRepository = supplierRepository;
        this.supplierReviewRepository = supplierReviewRepository;
        this.estimateRepository = estimateRepository;
        this.estimateItemRepository = estimateItemRepository;
        this.purchaseRepository = purchaseRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.supplierOfferRepository = supplierOfferRepository;
        this.auditService = auditService;
    }

    @PostConstruct
    @Transactional
    public void load() throws IOException {
        Map<String, UserAccount> users = ensureDemoUsers();
        if (appProperties.bootstrap().seedEnabled()) {
            seedCategories();
            seedMaterials();
            seedSuppliers();
            seedMaterialReviews(users);
            seedSupplierReviews(users);
            if (projectRepository.count() == 0) {
                seedProjects(users);
                seedEstimates(users);
                seedEstimateItems();
                seedPurchases(users);
                seedPurchaseItems();
                seedSupplierOffers();
            }
        }
        writeUsersFile(users);
    }

    private Map<String, UserAccount> ensureDemoUsers() {
        Map<String, DemoUser> demoUsers = Map.of(
            "admin@santehmontazh.local", new DemoUser("Администратор системы", "Admin123!", Role.ADMIN),
            "estimator@santehmontazh.local", new DemoUser("Пользователь проекта 1", "Estimator123!", Role.BASE_USER),
            "purchaser@santehmontazh.local", new DemoUser("Пользователь проекта 2", "Purchaser123!", Role.BASE_USER),
            "manager@santehmontazh.local", new DemoUser("Пользователь проекта 3", "Manager123!", Role.BASE_USER)
        );
        Map<String, UserAccount> created = new HashMap<>();
        demoUsers.forEach((email, data) -> {
            UserAccount user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
                UserAccount account = new UserAccount();
                account.setFullName(data.fullName());
                account.setEmail(email);
                account.setPasswordHash(passwordEncoder.encode(data.password()));
                account.setRole(data.role());
                account.setActive(true);
                UserAccount saved = userRepository.save(account);
                auditService.log(AuditEntityType.USER, saved.getId(), "BOOTSTRAP_USER_CREATED", saved, "Создан тестовый пользователь");
                return saved;
            });
            created.put(email, user);
        });
        return created;
    }

    private void seedCategories() throws IOException {
        List<CategorySeed> items = readList("seed-data/material-categories.json", new TypeReference<>() {});
        for (CategorySeed item : items) {
            categoryRepository.findByNameIgnoreCase(item.name()).orElseGet(() -> {
                MaterialCategory category = new MaterialCategory();
                category.setName(item.name());
                category.setDescription(item.description());
                return categoryRepository.save(category);
            });
        }
    }

    private void seedMaterials() throws IOException {
        List<MaterialSeed> items = readList("seed-data/materials.json", new TypeReference<>() {});
        for (MaterialSeed item : items) {
            Material material = materialRepository.findBySkuIgnoreCase(item.sku()).orElseGet(Material::new);
            material.setName(item.name());
            material.setSku(item.sku());
            material.setUnit(item.unit());
            material.setCategory(categoryRepository.findByNameIgnoreCase(item.categoryName()).orElseThrow());
            material.setDefaultPrice(item.defaultPrice());
            material.setDescription(item.description());
            material.setPhotoUrl(item.photoUrl().isBlank() ? null : item.photoUrl());
            material.setActive(item.active());
            materialRepository.save(material);
        }
    }

    private void seedSuppliers() throws IOException {
        List<SupplierSeed> items = readList("seed-data/suppliers.json", new TypeReference<>() {});
        for (SupplierSeed item : items) {
            Supplier supplier = supplierRepository.findByNameIgnoreCase(item.name()).orElseGet(Supplier::new);
            supplier.setName(item.name());
            supplier.setContactPerson(item.contactPerson());
            supplier.setPhone(item.phone());
            supplier.setEmail(item.email());
            supplier.setAddress(item.address());
            supplier.setWebsiteUrl(item.websiteUrl().isBlank() ? null : item.websiteUrl());
            supplier.setTelegram(item.telegram().isBlank() ? null : item.telegram());
            supplier.setRating(item.rating());
            supplier.setActive(item.active());
            supplierRepository.save(supplier);
        }
    }

    private void seedProjects(Map<String, UserAccount> users) throws IOException {
        List<ProjectSeed> items = readList("seed-data/projects.json", new TypeReference<>() {});
        for (ProjectSeed item : items) {
            Project project = new Project();
            project.setName(item.name());
            project.setCode(item.code());
            project.setAddress(item.address());
            project.setDescription(item.description());
            project.setStatus(ProjectStatus.valueOf(item.status()));
            project.setPlannedStartDate(item.plannedStartDate());
            project.setPlannedEndDate(item.plannedEndDate());
            project.setOwner(users.get(item.ownerEmail()));
            projectRepository.save(project);
        }
    }

    private void seedEstimates(Map<String, UserAccount> users) throws IOException {
        List<EstimateSeed> items = readList("seed-data/estimates.json", new TypeReference<>() {});
        for (EstimateSeed item : items) {
            Project project = projectRepository.findAll().stream().filter(p -> p.getCode().equals(item.projectCode())).findFirst().orElseThrow();
            UserAccount user = users.get(item.createdByEmail());
            Estimate estimate = new Estimate();
            estimate.setProject(project);
            estimate.setName(item.name());
            estimate.setStatus(EstimateStatus.valueOf(item.status()));
            estimate.setNotes(item.notes());
            estimate.setCreatedBy(user);
            estimate.setUpdatedAt(OffsetDateTime.now());
            estimateRepository.save(estimate);
        }
    }

    private void seedEstimateItems() throws IOException {
        List<EstimateItemSeed> items = readList("seed-data/estimate-items.json", new TypeReference<>() {});
        for (EstimateItemSeed item : items) {
            Estimate estimate = findEstimate(item.projectCode(), item.estimateName());
            Material material = materialRepository.findBySkuIgnoreCase(item.materialSku()).orElseThrow();
            EstimateItem estimateItem = new EstimateItem();
            estimateItem.setEstimate(estimate);
            estimateItem.setMaterial(material);
            estimateItem.setWorkName(item.workName());
            estimateItem.setQuantity(item.quantity());
            estimateItem.setUnitPrice(item.unitPrice());
            estimateItem.setLineTotal(item.quantity().multiply(item.unitPrice()));
            estimateItem.setComment(item.comment());
            estimateItemRepository.save(estimateItem);
        }
    }

    private void seedPurchases(Map<String, UserAccount> users) throws IOException {
        List<PurchaseSeed> items = readList("seed-data/purchases.json", new TypeReference<>() {});
        for (PurchaseSeed item : items) {
            Estimate estimate = findEstimate(item.projectCode(), item.estimateName());
            Purchase purchase = new Purchase();
            purchase.setProject(estimate.getProject());
            purchase.setEstimate(estimate);
            purchase.setCreatedBy(users.get(item.createdByEmail()));
            purchase.setStatus(PurchaseStatus.valueOf(item.status()));
            purchase.setPlannedTotal(BigDecimal.ZERO);
            purchase.setActualTotal(BigDecimal.ZERO);
            purchase.setSupplierName(item.supplierName());
            purchase.setComment(item.comment());
            purchase.setUpdatedAt(OffsetDateTime.now());
            purchaseRepository.save(purchase);
        }
    }

    private void seedPurchaseItems() throws IOException {
        List<PurchaseItemSeed> items = readList("seed-data/purchase-items.json", new TypeReference<>() {});
        for (PurchaseItemSeed item : items) {
            Purchase purchase = findPurchase(item.projectCode(), item.estimateName());
            Material material = materialRepository.findBySkuIgnoreCase(item.materialSku()).orElseThrow();
            PurchaseItem purchaseItem = new PurchaseItem();
            purchaseItem.setPurchase(purchase);
            purchaseItem.setMaterial(material);
            purchaseItem.setPlannedQuantity(item.plannedQuantity());
            purchaseItem.setPlannedPrice(item.plannedPrice());
            purchaseItem.setPlannedLineTotal(item.plannedQuantity().multiply(item.plannedPrice()));
            purchaseItem.setActualQuantity(item.actualQuantity());
            purchaseItem.setActualPrice(item.actualPrice());
            purchaseItem.setActualLineTotal(item.actualQuantity().multiply(item.actualPrice()));
            purchaseItem.setComment(item.comment());
            purchaseItemRepository.save(purchaseItem);
        }
        purchaseRepository.findAll().forEach(this::recalculatePurchaseTotals);
    }

    private void seedSupplierOffers() throws IOException {
        List<SupplierOfferSeed> items = readList("seed-data/supplier-offers.json", new TypeReference<>() {});
        for (SupplierOfferSeed item : items) {
            Purchase purchase = findPurchase(item.projectCode(), item.estimateName());
            Material material = materialRepository.findBySkuIgnoreCase(item.materialSku()).orElseThrow();
            PurchaseItem purchaseItem = purchaseItemRepository.findByPurchaseId(purchase.getId()).stream()
                .filter(current -> current.getMaterial().getId().equals(material.getId()))
                .findFirst()
                .orElseThrow();
            Supplier supplier = supplierRepository.findByNameIgnoreCase(item.supplierName()).orElseThrow();
            SupplierOffer offer = new SupplierOffer();
            offer.setPurchaseItem(purchaseItem);
            offer.setSupplier(supplier);
            offer.setOfferedPrice(item.offeredPrice());
            offer.setDeliveryDays(item.deliveryDays());
            offer.setComment(item.comment());
            offer.setSelected(item.selected());
            supplierOfferRepository.save(offer);
        }
    }

    private void seedMaterialReviews(Map<String, UserAccount> users) throws IOException {
        List<MaterialReviewSeed> items = readList("seed-data/material-reviews.json", new TypeReference<>() {});
        for (MaterialReviewSeed item : items) {
            Material material = materialRepository.findBySkuIgnoreCase(item.materialSku()).orElseThrow();
            UserAccount author = users.get(item.authorEmail());
            boolean exists = materialReviewRepository.findByMaterialIdOrderByCreatedAtDesc(material.getId()).stream()
                .anyMatch(review -> review.getAuthor().getEmail().equalsIgnoreCase(item.authorEmail())
                    && review.getComment().equals(item.comment()));
            if (exists) {
                continue;
            }
            MaterialReview review = new MaterialReview();
            review.setMaterial(material);
            review.setAuthor(author);
            review.setRating(item.rating());
            review.setComment(item.comment());
            materialReviewRepository.save(review);
        }
    }

    private void seedSupplierReviews(Map<String, UserAccount> users) throws IOException {
        List<SupplierReviewSeed> items = readList("seed-data/supplier-reviews.json", new TypeReference<>() {});
        for (SupplierReviewSeed item : items) {
            Supplier supplier = supplierRepository.findByNameIgnoreCase(item.supplierName()).orElseThrow();
            UserAccount author = users.get(item.authorEmail());
            boolean exists = supplierReviewRepository.findBySupplierIdOrderByCreatedAtDesc(supplier.getId()).stream()
                .anyMatch(review -> review.getAuthor().getEmail().equalsIgnoreCase(item.authorEmail())
                    && review.getComment().equals(item.comment()));
            if (exists) {
                continue;
            }
            SupplierReview review = new SupplierReview();
            review.setSupplier(supplier);
            review.setAuthor(author);
            review.setRating(item.rating());
            review.setComment(item.comment());
            supplierReviewRepository.save(review);
        }
    }

    private void writeUsersFile(Map<String, UserAccount> users) throws IOException {
        Path path = Path.of(appProperties.bootstrap().usersFile());
        Path parent = path.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        List<String> lines = List.of(
            "email=admin@santehmontazh.local; password=Admin123!; role=ADMIN",
            "email=estimator@santehmontazh.local; password=Estimator123!; role=BASE_USER",
            "email=purchaser@santehmontazh.local; password=Purchaser123!; role=BASE_USER",
            "email=manager@santehmontazh.local; password=Manager123!; role=BASE_USER"
        );
        Files.write(path, lines);
    }

    private Purchase findPurchase(String projectCode, String estimateName) {
        Estimate estimate = findEstimate(projectCode, estimateName);
        return purchaseRepository.findByEstimateId(estimate.getId()).stream().findFirst().orElseThrow();
    }

    private Estimate findEstimate(String projectCode, String estimateName) {
        Project project = projectRepository.findAll().stream().filter(p -> p.getCode().equals(projectCode)).findFirst().orElseThrow();
        return estimateRepository.findByProjectIdOrderByUpdatedAtDesc(project.getId()).stream()
            .filter(estimate -> estimate.getName().equals(estimateName))
            .findFirst()
            .orElseThrow();
    }

    private void recalculatePurchaseTotals(Purchase purchase) {
        List<PurchaseItem> items = purchaseItemRepository.findByPurchaseId(purchase.getId());
        purchase.setPlannedTotal(items.stream().map(PurchaseItem::getPlannedLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add));
        purchase.setActualTotal(items.stream().map(PurchaseItem::getActualLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add));
        purchaseRepository.save(purchase);
    }

    private <T> List<T> readList(String classpath, TypeReference<List<T>> typeReference) throws IOException {
        ClassPathResource resource = new ClassPathResource(classpath);
        if (resource.exists()) {
            try (InputStream inputStream = resource.getInputStream()) {
                return objectMapper.readValue(inputStream, typeReference);
            }
        }

        Path filesystemPath = Path.of(classpath);
        if (Files.exists(filesystemPath)) {
            try (InputStream inputStream = Files.newInputStream(filesystemPath)) {
                return objectMapper.readValue(inputStream, typeReference);
            }
        }

        Path appRelativePath = Path.of("/app").resolve(classpath);
        try (InputStream inputStream = Files.newInputStream(appRelativePath)) {
            return objectMapper.readValue(inputStream, typeReference);
        }
    }

    private record DemoUser(String fullName, String password, Role role) {
    }

    private record CategorySeed(String name, String description) {
    }

    private record MaterialSeed(String name, String sku, String unit, String categoryName, BigDecimal defaultPrice,
                                String description, String photoUrl, boolean active) {
    }

    private record SupplierSeed(String name, String contactPerson, String phone, String email, String address,
                                String websiteUrl, String telegram, BigDecimal rating, boolean active) {
    }

    private record ProjectSeed(String name, String code, String address, String description, String status,
                               java.time.LocalDate plannedStartDate, java.time.LocalDate plannedEndDate,
                               String ownerEmail) {
    }

    private record EstimateSeed(String projectCode, String name, String status, String notes,
                                String createdByEmail) {
    }

    private record EstimateItemSeed(String projectCode, String estimateName, String materialSku, String workName,
                                    BigDecimal quantity, BigDecimal unitPrice, String comment) {
    }

    private record PurchaseSeed(String projectCode, String estimateName, String createdByEmail, String status,
                                String supplierName, String comment) {
    }

    private record PurchaseItemSeed(String projectCode, String estimateName, String materialSku, BigDecimal plannedQuantity,
                                    BigDecimal plannedPrice, BigDecimal actualQuantity, BigDecimal actualPrice,
                                    String comment) {
    }

    private record SupplierOfferSeed(String projectCode, String estimateName, String materialSku, String supplierName,
                                     BigDecimal offeredPrice, int deliveryDays, String comment, boolean selected) {
    }

    private record MaterialReviewSeed(String materialSku, String authorEmail, int rating, String comment) {
    }

    private record SupplierReviewSeed(String supplierName, String authorEmail, int rating, String comment) {
    }
}
