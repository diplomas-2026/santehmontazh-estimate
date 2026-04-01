package com.company.product.api.service;

import com.company.product.api.dto.purchase.ApprovalCommentRequest;
import com.company.product.api.dto.purchase.ApprovalCommentResponse;
import com.company.product.api.dto.purchase.PurchaseItemRequest;
import com.company.product.api.dto.purchase.PurchaseItemResponse;
import com.company.product.api.dto.purchase.PurchaseRequest;
import com.company.product.api.dto.purchase.PurchaseResponse;
import com.company.product.api.dto.purchase.SupplierOfferRequest;
import com.company.product.api.dto.purchase.SupplierOfferResponse;
import com.company.product.api.entity.ApprovalComment;
import com.company.product.api.entity.AuditEntityType;
import com.company.product.api.entity.CommentEntityType;
import com.company.product.api.entity.Estimate;
import com.company.product.api.entity.EstimateItem;
import com.company.product.api.entity.EstimateStatus;
import com.company.product.api.entity.Purchase;
import com.company.product.api.entity.PurchaseItem;
import com.company.product.api.entity.PurchaseStatus;
import com.company.product.api.entity.Supplier;
import com.company.product.api.entity.SupplierOffer;
import com.company.product.api.entity.UserAccount;
import com.company.product.api.exception.BadRequestException;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.ApprovalCommentRepository;
import com.company.product.api.repository.EstimateItemRepository;
import com.company.product.api.repository.EstimateRepository;
import com.company.product.api.repository.PurchaseItemRepository;
import com.company.product.api.repository.PurchaseRepository;
import com.company.product.api.repository.SupplierOfferRepository;
import com.company.product.api.repository.SupplierRepository;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.SecurityUtils;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final EstimateRepository estimateRepository;
    private final EstimateItemRepository estimateItemRepository;
    private final SupplierRepository supplierRepository;
    private final SupplierOfferRepository supplierOfferRepository;
    private final ApprovalCommentRepository approvalCommentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public PurchaseService(PurchaseRepository purchaseRepository,
                           PurchaseItemRepository purchaseItemRepository,
                           EstimateRepository estimateRepository,
                           EstimateItemRepository estimateItemRepository,
                           SupplierRepository supplierRepository,
                           SupplierOfferRepository supplierOfferRepository,
                           ApprovalCommentRepository approvalCommentRepository,
                           UserRepository userRepository,
                           AuditService auditService) {
        this.purchaseRepository = purchaseRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.estimateRepository = estimateRepository;
        this.estimateItemRepository = estimateItemRepository;
        this.supplierRepository = supplierRepository;
        this.supplierOfferRepository = supplierOfferRepository;
        this.approvalCommentRepository = approvalCommentRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public List<PurchaseResponse> findAll() {
        return purchaseRepository.findAll().stream().map(this::toResponse).toList();
    }

    public PurchaseResponse findById(Long id) {
        return toResponse(getPurchase(id));
    }

    @Transactional
    public PurchaseResponse create(PurchaseRequest request) {
        Estimate estimate = estimateRepository.findById(request.estimateId())
            .orElseThrow(() -> new NotFoundException("Смета не найдена"));
        if (estimate.getStatus() != EstimateStatus.READY_FOR_PURCHASE) {
            throw new BadRequestException("Закупку можно создать только для сметы, готовой к закупке");
        }
        UserAccount actor = currentActor();
        Purchase purchase = new Purchase();
        purchase.setProject(estimate.getProject());
        purchase.setEstimate(estimate);
        purchase.setCreatedBy(actor);
        purchase.setStatus(PurchaseStatus.DRAFT);
        purchase.setSupplierName(request.supplierName());
        purchase.setComment(request.comment());
        purchase.setPlannedTotal(BigDecimal.ZERO);
        purchase.setActualTotal(BigDecimal.ZERO);
        purchase.setUpdatedAt(OffsetDateTime.now());
        Purchase saved = purchaseRepository.save(purchase);

        BigDecimal plannedTotal = BigDecimal.ZERO;
        for (EstimateItem estimateItem : estimateItemRepository.findByEstimateId(estimate.getId())) {
            PurchaseItem item = new PurchaseItem();
            item.setPurchase(saved);
            item.setMaterial(estimateItem.getMaterial());
            item.setPlannedQuantity(estimateItem.getQuantity());
            item.setPlannedPrice(estimateItem.getUnitPrice());
            item.setPlannedLineTotal(estimateItem.getLineTotal());
            item.setActualQuantity(BigDecimal.ZERO);
            item.setActualPrice(BigDecimal.ZERO);
            item.setActualLineTotal(BigDecimal.ZERO);
            item.setComment("Сформировано автоматически из сметы");
            purchaseItemRepository.save(item);
            plannedTotal = plannedTotal.add(item.getPlannedLineTotal());
        }

        saved.setPlannedTotal(plannedTotal);
        saved.setActualTotal(BigDecimal.ZERO);
        purchaseRepository.save(saved);
        estimate.setStatus(EstimateStatus.IN_PURCHASE);
        estimate.setUpdatedAt(OffsetDateTime.now());
        estimateRepository.save(estimate);
        auditService.log(AuditEntityType.PURCHASE, saved.getId(), "CREATED", actor, "Создана закупка из сметы");
        return toResponse(saved);
    }

    @Transactional
    public PurchaseResponse update(Long id, PurchaseRequest request) {
        Purchase purchase = getEditablePurchase(id);
        purchase.setSupplierName(request.supplierName());
        purchase.setComment(request.comment());
        purchase.setUpdatedAt(OffsetDateTime.now());
        Purchase saved = purchaseRepository.save(purchase);
        auditService.log(AuditEntityType.PURCHASE, saved.getId(), "UPDATED", currentActor(), "Обновлены метаданные закупки");
        return toResponse(saved);
    }

    @Transactional
    public PurchaseResponse updateItem(Long itemId, PurchaseItemRequest request) {
        PurchaseItem item = purchaseItemRepository.findById(itemId)
            .orElseThrow(() -> new NotFoundException("Позиция закупки не найдена"));
        Purchase purchase = getEditablePurchase(item.getPurchase().getId());
        item.setPlannedQuantity(request.plannedQuantity());
        item.setPlannedPrice(request.plannedPrice());
        item.setPlannedLineTotal(request.plannedQuantity().multiply(request.plannedPrice()));
        item.setActualQuantity(request.actualQuantity());
        item.setActualPrice(request.actualPrice());
        item.setActualLineTotal(request.actualQuantity().multiply(request.actualPrice()));
        item.setComment(request.comment());
        purchaseItemRepository.save(item);
        recalculateTotals(purchase);
        auditService.log(AuditEntityType.PURCHASE, purchase.getId(), "ITEM_UPDATED", currentActor(), "Обновлена позиция закупки");
        return toResponse(purchase);
    }

    public List<SupplierOfferResponse> offers(Long itemId) {
        purchaseItemRepository.findById(itemId).orElseThrow(() -> new NotFoundException("Позиция закупки не найдена"));
        return supplierOfferRepository.findByPurchaseItemId(itemId).stream().map(this::toOfferResponse).toList();
    }

    @Transactional
    public List<SupplierOfferResponse> addOffer(Long itemId, SupplierOfferRequest request) {
        PurchaseItem item = purchaseItemRepository.findById(itemId)
            .orElseThrow(() -> new NotFoundException("Позиция закупки не найдена"));
        getEditablePurchase(item.getPurchase().getId());
        Supplier supplier = supplierRepository.findById(request.supplierId())
            .orElseThrow(() -> new NotFoundException("Поставщик не найден"));

        SupplierOffer offer = new SupplierOffer();
        offer.setPurchaseItem(item);
        offer.setSupplier(supplier);
        offer.setOfferedPrice(request.offeredPrice());
        offer.setDeliveryDays(request.deliveryDays());
        offer.setComment(request.comment());
        offer.setSelected(false);
        supplierOfferRepository.save(offer);
        auditService.log(AuditEntityType.PURCHASE, item.getPurchase().getId(), "OFFER_ADDED", currentActor(), "Добавлено предложение поставщика");
        return offers(itemId);
    }

    @Transactional
    public List<SupplierOfferResponse> selectOffer(Long itemId, Long offerId) {
        PurchaseItem item = purchaseItemRepository.findById(itemId)
            .orElseThrow(() -> new NotFoundException("Позиция закупки не найдена"));
        Purchase purchase = getEditablePurchase(item.getPurchase().getId());
        List<SupplierOffer> offers = supplierOfferRepository.findByPurchaseItemId(itemId);
        SupplierOffer target = offers.stream()
            .filter(offer -> offer.getId().equals(offerId))
            .findFirst()
            .orElseThrow(() -> new NotFoundException("Предложение поставщика не найдено"));

        for (SupplierOffer offer : offers) {
            offer.setSelected(offer.getId().equals(offerId));
            supplierOfferRepository.save(offer);
        }

        item.setPlannedPrice(target.getOfferedPrice());
        item.setPlannedLineTotal(item.getPlannedQuantity().multiply(target.getOfferedPrice()));
        purchaseItemRepository.save(item);
        recalculateTotals(purchase);
        auditService.log(AuditEntityType.PURCHASE, purchase.getId(), "OFFER_SELECTED", currentActor(), "Выбрано предложение поставщика");
        return offers(itemId);
    }

    @Transactional
    public PurchaseResponse submit(Long purchaseId) {
        Purchase purchase = getEditablePurchase(purchaseId);
        purchase.setStatus(PurchaseStatus.SUBMITTED);
        purchase.setUpdatedAt(OffsetDateTime.now());
        purchaseRepository.save(purchase);
        auditService.log(AuditEntityType.PURCHASE, purchase.getId(), "SUBMITTED", currentActor(), "Закупка отправлена на согласование");
        return toResponse(purchase);
    }

    @Transactional
    public PurchaseResponse approve(Long purchaseId) {
        Purchase purchase = getPurchase(purchaseId);
        if (purchase.getStatus() != PurchaseStatus.SUBMITTED) {
            throw new BadRequestException("Утвердить можно только закупку в статусе SUBMITTED");
        }
        purchase.setStatus(PurchaseStatus.APPROVED);
        purchase.setUpdatedAt(OffsetDateTime.now());
        purchaseRepository.save(purchase);
        auditService.log(AuditEntityType.PURCHASE, purchase.getId(), "APPROVED", currentActor(), "Закупка утверждена");
        return toResponse(purchase);
    }

    @Transactional
    public PurchaseResponse returnForRevision(Long purchaseId, ApprovalCommentRequest request) {
        Purchase purchase = getPurchase(purchaseId);
        ApprovalComment comment = new ApprovalComment();
        comment.setEntityType(CommentEntityType.PURCHASE);
        comment.setEntityId(purchaseId);
        comment.setAuthor(currentActor());
        comment.setMessage(request.message());
        approvalCommentRepository.save(comment);

        purchase.setStatus(PurchaseStatus.DRAFT);
        purchase.setUpdatedAt(OffsetDateTime.now());
        purchaseRepository.save(purchase);
        auditService.log(AuditEntityType.PURCHASE, purchase.getId(), "RETURNED_FOR_REVISION", currentActor(), "Закупка возвращена на доработку");
        return toResponse(purchase);
    }

    @Transactional
    public PurchaseResponse order(Long purchaseId) {
        Purchase purchase = getPurchase(purchaseId);
        if (purchase.getStatus() != PurchaseStatus.APPROVED) {
            throw new BadRequestException("Заказ можно оформить только после утверждения");
        }
        purchase.setStatus(PurchaseStatus.ORDERED);
        purchase.setUpdatedAt(OffsetDateTime.now());
        purchaseRepository.save(purchase);
        auditService.log(AuditEntityType.PURCHASE, purchase.getId(), "ORDERED", currentActor(), "Закупка переведена в статус ORDERED");
        return toResponse(purchase);
    }

    @Transactional
    public PurchaseResponse receive(Long purchaseId) {
        Purchase purchase = getPurchase(purchaseId);
        if (purchase.getStatus() != PurchaseStatus.ORDERED) {
            throw new BadRequestException("Получение доступно только после оформления заказа");
        }
        purchase.setStatus(PurchaseStatus.RECEIVED);
        purchase.setUpdatedAt(OffsetDateTime.now());
        recalculateTotals(purchase);
        purchaseRepository.save(purchase);
        auditService.log(AuditEntityType.PURCHASE, purchase.getId(), "RECEIVED", currentActor(), "Закупка завершена");
        return toResponse(purchase);
    }

    public List<ApprovalCommentResponse> comments(Long purchaseId) {
        getPurchase(purchaseId);
        return approvalCommentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtAsc(CommentEntityType.PURCHASE, purchaseId)
            .stream()
            .map(comment -> new ApprovalCommentResponse(comment.getId(), comment.getAuthor().getFullName(),
                comment.getMessage(), comment.getCreatedAt()))
            .toList();
    }

    @Transactional
    public List<ApprovalCommentResponse> addComment(Long purchaseId, ApprovalCommentRequest request) {
        getPurchase(purchaseId);
        ApprovalComment comment = new ApprovalComment();
        comment.setEntityType(CommentEntityType.PURCHASE);
        comment.setEntityId(purchaseId);
        comment.setAuthor(currentActor());
        comment.setMessage(request.message());
        approvalCommentRepository.save(comment);
        auditService.log(AuditEntityType.PURCHASE, purchaseId, "COMMENT_ADDED", currentActor(), "Добавлен комментарий к закупке");
        return comments(purchaseId);
    }

    public String print(Long purchaseId) {
        PurchaseResponse response = toResponse(getPurchase(purchaseId));
        return """
            Закупка #%d
            Объект: %s
            Смета: %s
            Статус: %s
            Плановая сумма: %s
            Фактическая сумма: %s
            Поставщик: %s
            Комментарий: %s
            """.formatted(response.id(), response.projectName(), response.estimateName(), response.status(),
            response.plannedTotal(), response.actualTotal(), response.supplierName(), response.comment());
    }

    private void recalculateTotals(Purchase purchase) {
        List<PurchaseItem> items = purchaseItemRepository.findByPurchaseId(purchase.getId());
        purchase.setPlannedTotal(items.stream().map(PurchaseItem::getPlannedLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add));
        purchase.setActualTotal(items.stream().map(PurchaseItem::getActualLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add));
        purchase.setUpdatedAt(OffsetDateTime.now());
        purchaseRepository.save(purchase);
    }

    private Purchase getPurchase(Long id) {
        return purchaseRepository.findById(id).orElseThrow(() -> new NotFoundException("Закупка не найдена"));
    }

    private Purchase getEditablePurchase(Long id) {
        Purchase purchase = getPurchase(id);
        if (!(purchase.getStatus() == PurchaseStatus.DRAFT || purchase.getStatus() == PurchaseStatus.SUBMITTED)) {
            throw new BadRequestException("Закупка недоступна для редактирования в текущем статусе");
        }
        return purchase;
    }

    private PurchaseResponse toResponse(Purchase purchase) {
        List<PurchaseItemResponse> items = purchaseItemRepository.findByPurchaseId(purchase.getId()).stream()
            .map(item -> new PurchaseItemResponse(item.getId(), item.getMaterial().getId(), item.getMaterial().getName(),
                item.getMaterial().getUnit(), item.getPlannedQuantity(), item.getPlannedPrice(), item.getPlannedLineTotal(),
                item.getActualQuantity(), item.getActualPrice(), item.getActualLineTotal(), item.getComment(),
                supplierOfferRepository.findByPurchaseItemId(item.getId()).stream().map(this::toOfferResponse).toList()))
            .toList();
        List<ApprovalCommentResponse> comments = comments(purchase.getId());
        return new PurchaseResponse(
            purchase.getId(),
            purchase.getProject().getId(),
            purchase.getProject().getName(),
            purchase.getEstimate().getId(),
            purchase.getEstimate().getName(),
            purchase.getStatus(),
            purchase.getPlannedTotal(),
            purchase.getActualTotal(),
            purchase.getActualTotal().subtract(purchase.getPlannedTotal()),
            purchase.getSupplierName(),
            purchase.getComment(),
            purchase.getCreatedAt(),
            purchase.getUpdatedAt(),
            items,
            comments
        );
    }

    private SupplierOfferResponse toOfferResponse(SupplierOffer offer) {
        return new SupplierOfferResponse(offer.getId(), offer.getSupplier().getId(), offer.getSupplier().getName(),
            offer.getOfferedPrice(), offer.getDeliveryDays(), offer.getComment(), offer.isSelected());
    }

    private UserAccount currentActor() {
        return userRepository.findById(SecurityUtils.currentUser().id())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
    }
}
