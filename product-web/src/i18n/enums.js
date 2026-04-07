const roleLabels = {
  ADMIN: 'Администратор',
  BASE_USER: 'Пользователь',
};

const projectStatusLabels = {
  DRAFT: 'Черновик',
  IN_PROGRESS: 'В работе',
  PURCHASE_IN_PROGRESS: 'Идет закупка',
  COMPLETED: 'Завершен',
};

const estimateStatusLabels = {
  DRAFT: 'Черновик',
  IN_PURCHASE: 'В закупке',
  READY_FOR_PURCHASE: 'Готова к закупке',
  ARCHIVED: 'В архиве',
  COMPLETED: 'Завершена',
};

const purchaseStatusLabels = {
  DRAFT: 'Черновик',
  IN_PROGRESS: 'В закупке',
  COMPLETED: 'Завершена',
};

const subscriptionStatusLabels = {
  ACTIVE: 'Активна',
  EXPIRED: 'Истекла',
};

function translateFromMap(value, map) {
  if (!value) {
    return 'Не указано';
  }
  return map[value] ?? value;
}

export function translateRole(role) {
  return translateFromMap(role, roleLabels);
}

export function translateProjectStatus(status) {
  return translateFromMap(status, projectStatusLabels);
}

export function translateEstimateStatus(status) {
  return translateFromMap(status, estimateStatusLabels);
}

export function translatePurchaseStatus(status) {
  return translateFromMap(status, purchaseStatusLabels);
}

export function translateSubscriptionStatus(status) {
  return translateFromMap(status, subscriptionStatusLabels);
}
