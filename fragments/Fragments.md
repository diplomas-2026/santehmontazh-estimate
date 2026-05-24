### Рисунок 2.36 - Фрагмент кода AuthController

### [Скрин кода](./img_1.png)

```java
@PostMapping("/login")
public AuthResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
}
```

### Рисунок 2.37 - Фрагмент кода JwtAuthenticationFilter

### [Скрин кода](./img_2.png)

```java
@Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain) throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header == null || !header.startsWith("Bearer ")) {
        filterChain.doFilter(request, response);
        return;
    }

    String token = header.substring(7);
    String email = jwtService.extractUsername(token);
    if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
        AuthenticatedUser user = (AuthenticatedUser) userDetailsService.loadUserByUsername(email);
        if (jwtService.isTokenValid(token, user)) {
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user,
                null,
                user.getAuthorities()
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
    }

    filterChain.doFilter(request, response);
}
```

### Рисунок 2.38 - Фрагмент кода ProjectController

### [Скрин кода](./img_3.png)

```java
@PostMapping
@PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
public ProjectResponse create(@Valid @RequestBody ProjectRequest request) {
    return projectService.create(request);
}
```

### Рисунок 2.39 - Фрагмент кода EstimateController

### [Скрин кода](./img_4.png)

```java
@PostMapping("/estimates")
@PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
public EstimateResponse create(@Valid @RequestBody EstimateRequest request) {
    return estimateService.create(request);
}
```

### Рисунок 2.40 - Фрагмент кода экспорта Excel

### [Скрин кода](./img_5.png)

```java
private byte[] buildWorkbook(Project project, List<Estimate> estimates) {
    try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle sectionStyle = createSectionStyle(workbook);
        Set<String> usedSheetNames = new HashSet<>();

        for (Estimate estimate : estimates) {
            writeEstimateSheet(workbook, project, toResponse(estimate), headerStyle, sectionStyle, usedSheetNames);
        }

        workbook.write(outputStream);
        return outputStream.toByteArray();
    } catch (Exception exception) {
        throw new IllegalStateException("Не удалось сформировать Excel-отчет по смете", exception);
    }
}
```

### Рисунок 2.41 - Фрагмент кодаMaterialController иSupplierController

### [Скрин кода](./img_6.png)

```java
@PostMapping
@PreAuthorize("hasRole('ADMIN')")
public MaterialResponse create(@Valid @RequestBody MaterialRequest request) {
    return materialService.create(request);
}

@PostMapping
@PreAuthorize("hasRole('ADMIN')")
public SupplierResponse create(@Valid @RequestBody SupplierRequest request) {
    return supplierService.create(request);
}
```

### Рисунок 2.42 - Фрагмент кодаDashboardController иAiEstimateAssistantController

### [Скрин кода](./img_7.png)

```java
@GetMapping("/summary")
public DashboardSummaryResponse summary() {
    return dashboardService.summary();
}

@PostMapping("/estimate-assistant/sessions")
@PreAuthorize("hasAnyRole('ADMIN','BASE_USER')")
public AiEstimateAssistantSessionResponse start(@Valid @RequestBody AiEstimateAssistantStartRequest request) {
    return aiEstimateAssistantService.start(request);
}
```

### Рисунок 2.43 - Фрагмент клиентского кода api.js

### [Скрин кода](./img_8.png)

```javascript
export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '' }));
    const message = error.message?.trim();
    if (message) {
      throw new Error(message);
    }

    if (response.status >= 500) {
      throw new Error(SERVER_ERROR_MESSAGE);
    }

    throw new Error('Не удалось выполнить запрос. Проверьте введенные данные и попробуйте еще раз.');
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}
```

### Рисунок 2.44 - Фрагмент кода SubscriptionController

### [Скрин кода](./img_9.png)

```java
@GetMapping("/me")
public ResponseEntity<SubscriptionResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
    SubscriptionResponse response = subscriptionService.getMySubscription(user);
    return response == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(response);
}
```

### Листинг кода программного продукта страниц на 3-4.

```java
@Transactional
public EstimateResponse create(EstimateRequest request) {
    UserAccount actor = currentActor();
    Project project = getEditableProject(request.projectId(), actor);

    Estimate estimate = new Estimate();
    estimate.setProject(project);
    estimate.setName(request.name());
    estimate.setStatus(EstimateStatus.DRAFT);
    estimate.setNotes(request.notes());
    estimate.setCreatedBy(actor);
    estimate.setUpdatedAt(OffsetDateTime.now());
    Estimate saved = estimateRepository.save(estimate);
    auditService.log(AuditEntityType.ESTIMATE, saved.getId(), "CREATED", actor, "Создана новая смета");
    return toResponse(saved);
}

@Transactional
public EstimateResponse update(Long id, EstimateRequest request) {
    Estimate estimate = getEditableEstimate(id);
    Project project = getEditableProject(request.projectId(), currentActor());
    estimate.setProject(project);
    estimate.setName(request.name());
    estimate.setNotes(request.notes());
    estimate.setUpdatedAt(OffsetDateTime.now());
    Estimate saved = estimateRepository.save(estimate);
    auditService.log(AuditEntityType.ESTIMATE, saved.getId(), "UPDATED", currentActor(), "Обновлены метаданные сметы");
    return toResponse(saved);
}

@Transactional
public EstimateResponse addItem(Long estimateId, EstimateItemRequest request) {
    Estimate estimate = getEditableEstimate(estimateId);
    Material material = resolveMaterial(request.materialId());
    String workName = normalizeWorkName(request.workName());
    validateEstimateItem(material, workName);

    EstimateItem item = new EstimateItem();
    item.setEstimate(estimate);
    item.setMaterial(material);
    item.setWorkName(workName);
    item.setQuantity(request.quantity());
    item.setUnitPrice(request.unitPrice());
    item.setLineTotal(request.quantity().multiply(request.unitPrice()));
    item.setComment(normalizeComment(request.comment()));
    applyActualFields(item, request);
    estimateItemRepository.save(item);

    syncEstimateStatusFromItems(estimate);
    estimate.setUpdatedAt(OffsetDateTime.now());
    estimateRepository.save(estimate);
    auditService.log(AuditEntityType.ESTIMATE, estimate.getId(), "ITEM_ADDED", currentActor(), "Добавлена позиция сметы");
    return toResponse(estimate);
}

@Transactional
public EstimateResponse updateItem(Long itemId, EstimateItemRequest request) {
    EstimateItem item = estimateItemRepository.findById(itemId)
        .orElseThrow(() -> new NotFoundException("Позиция сметы не найдена"));
    Estimate estimate = getEditableEstimate(item.getEstimate().getId());
    Material material = resolveMaterial(request.materialId());
    String workName = normalizeWorkName(request.workName());
    validateEstimateItem(material, workName);

    item.setMaterial(material);
    item.setWorkName(workName);
    item.setQuantity(request.quantity());
    item.setUnitPrice(request.unitPrice());
    item.setLineTotal(request.quantity().multiply(request.unitPrice()));
    item.setComment(normalizeComment(request.comment()));
    applyActualFields(item, request);
    estimateItemRepository.save(item);

    syncEstimateStatusFromItems(estimate);
    estimate.setUpdatedAt(OffsetDateTime.now());
    estimateRepository.save(estimate);
    auditService.log(AuditEntityType.ESTIMATE, estimate.getId(), "ITEM_UPDATED", currentActor(), "Позиция сметы обновлена");
    return toResponse(estimate);
}

public List<MaterialRequirementResponse> requirements(Long estimateId) {
    Estimate estimate = getEstimate(estimateId);
    Map<Long, MaterialRequirementAccumulator> map = new LinkedHashMap<>();
    for (EstimateItem item : estimateItemRepository.findByEstimateId(estimate.getId())) {
        if (item.getMaterial() == null) {
            continue;
        }
        map.computeIfAbsent(item.getMaterial().getId(), key -> new MaterialRequirementAccumulator(
            item.getMaterial().getId(),
            item.getMaterial().getName(),
            item.getMaterial().getUnit(),
            BigDecimal.ZERO,
            BigDecimal.ZERO
        )).add(item.getQuantity(), item.getLineTotal());
    }
    return map.values().stream().map(MaterialRequirementAccumulator::toResponse).toList();
}

@Transactional
public EstimateResponse submitForPurchase(Long estimateId) {
    Estimate estimate = getEditableEstimate(estimateId);
    if (estimateItemRepository.findByEstimateId(estimateId).isEmpty()) {
        throw new BadRequestException("Нельзя запустить пустую смету в работу");
    }
    estimate.setStatus(EstimateStatus.IN_PROGRESS);
    estimate.setUpdatedAt(OffsetDateTime.now());
    Estimate saved = estimateRepository.save(estimate);
    auditService.log(AuditEntityType.ESTIMATE, saved.getId(), "STARTED", currentActor(), "Смета переведена в работу");
    return toResponse(saved);
}

@Transactional
public EstimateResponse complete(Long estimateId) {
    Estimate estimate = getEstimate(estimateId);
    if (estimate.getStatus() == EstimateStatus.COMPLETED) {
        return toResponse(estimate);
    }
    List<EstimateItem> items = estimateItemRepository.findByEstimateId(estimate.getId());
    if (items.isEmpty()) {
        throw new BadRequestException("Нельзя завершить пустую смету");
    }
    boolean hasActuals = items.stream().anyMatch(this::hasAnyActualData);
    if (!hasActuals) {
        throw new BadRequestException("Сначала укажите факт хотя бы по одной позиции сметы");
    }
    estimate.setStatus(EstimateStatus.COMPLETED);
    estimate.setUpdatedAt(OffsetDateTime.now());
    Estimate saved = estimateRepository.save(estimate);
    auditService.log(AuditEntityType.ESTIMATE, saved.getId(), "COMPLETED", currentActor(), "Смета завершена");
    return toResponse(saved);
}

@Transactional
public EstimateResponse archive(Long estimateId) {
    Estimate estimate = getEstimate(estimateId);
    if (estimate.getStatus() == EstimateStatus.ARCHIVED || estimate.getStatus() == EstimateStatus.COMPLETED) {
        return toResponse(estimate);
    }
    estimate.setStatus(EstimateStatus.ARCHIVED);
    estimate.setUpdatedAt(OffsetDateTime.now());
    Estimate saved = estimateRepository.save(estimate);
    auditService.log(AuditEntityType.ESTIMATE, saved.getId(), "ARCHIVED", currentActor(), "Смета архивирована");
    return toResponse(saved);
}

private byte[] buildWorkbook(Project project, List<Estimate> estimates) {
    try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle sectionStyle = createSectionStyle(workbook);
        Set<String> usedSheetNames = new HashSet<>();

        for (Estimate estimate : estimates) {
            writeEstimateSheet(workbook, project, toResponse(estimate), headerStyle, sectionStyle, usedSheetNames);
        }

        workbook.write(outputStream);
        return outputStream.toByteArray();
    } catch (Exception exception) {
        throw new IllegalStateException("Не удалось сформировать Excel-отчет по смете", exception);
    }
}

private void writeEstimateSheet(Workbook workbook,
                                Project project,
                                EstimateResponse estimate,
                                CellStyle headerStyle,
                                CellStyle sectionStyle,
                                Set<String> usedSheetNames) {
    Sheet sheet = workbook.createSheet(buildUniqueSheetName(estimate.name(), estimate.id(), usedSheetNames));
    int rowIndex = 0;

    rowIndex = writeMetaRow(sheet, rowIndex, "Объект", project.getName(), headerStyle);
    rowIndex = writeMetaRow(sheet, rowIndex, "Код объекта", project.getCode(), headerStyle);
    rowIndex = writeMetaRow(sheet, rowIndex, "Смета", estimate.name(), headerStyle);
    rowIndex = writeMetaRow(sheet, rowIndex, "Статус", estimate.status().name(), headerStyle);
    rowIndex = writeMetaRow(sheet, rowIndex, "Автор", estimate.createdByName(), headerStyle);
    rowIndex = writeMetaRow(sheet, rowIndex, "План", estimate.total().toPlainString(), headerStyle);
    rowIndex = writeMetaRow(sheet, rowIndex, "Факт", estimate.actualTotal().toPlainString(), headerStyle);
    rowIndex = writeMetaRow(sheet, rowIndex, "Отклонение", estimate.deviation().toPlainString(), headerStyle);
    rowIndex++;

    Row titleRow = sheet.createRow(rowIndex++);
    titleRow.createCell(0).setCellValue("Позиции сметы");
    titleRow.getCell(0).setCellStyle(sectionStyle);

    Row headerRow = sheet.createRow(rowIndex++);
    String[] columns = {
        "№", "Позиция", "Материал", "Ед.", "План кол-во", "План цена", "План сумма",
        "Факт кол-во", "Факт цена", "Факт сумма", "Где купили", "Ссылка", "Комментарий", "Заметка по факту"
    };
    for (int index = 0; index < columns.length; index++) {
        headerRow.createCell(index).setCellValue(columns[index]);
        headerRow.getCell(index).setCellStyle(headerStyle);
    }

    int position = 1;
    for (EstimateItemResponse item : estimate.items()) {
        Row row = sheet.createRow(rowIndex++);
        row.createCell(0).setCellValue(position++);
        row.createCell(1).setCellValue(item.workName() == null || item.workName().isBlank() ? "Позиция сметы" : item.workName());
        row.createCell(2).setCellValue(item.materialName() == null ? "" : item.materialName());
        row.createCell(3).setCellValue(item.unit() == null ? "" : item.unit());
        row.createCell(4).setCellValue(item.quantity().doubleValue());
        row.createCell(5).setCellValue(item.unitPrice().doubleValue());
        row.createCell(6).setCellValue(item.lineTotal().doubleValue());
        row.createCell(7).setCellValue(item.actualQuantity().doubleValue());
        row.createCell(8).setCellValue(item.actualPrice().doubleValue());
        row.createCell(9).setCellValue(item.actualLineTotal().doubleValue());
        row.createCell(10).setCellValue(item.purchaseSourceName());
        row.createCell(11).setCellValue(item.purchaseSourceUrl());
        row.createCell(12).setCellValue(item.comment());
        row.createCell(13).setCellValue(item.purchaseNote());
    }

    for (int index = 0; index < columns.length; index++) {
        sheet.autoSizeColumn(index);
    }
}

private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
    XSSFFont font = workbook.createFont();
    font.setBold(true);

    CellStyle style = workbook.createCellStyle();
    style.setFont(font);
    style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
    style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
    style.setAlignment(HorizontalAlignment.LEFT);
    return style;
}

private CellStyle createSectionStyle(XSSFWorkbook workbook) {
    XSSFFont font = workbook.createFont();
    font.setBold(true);
    font.setColor(IndexedColors.WHITE.getIndex());

    CellStyle style = workbook.createCellStyle();
    style.setFont(font);
    style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
    style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
    return style;
}
```
