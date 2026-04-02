const roleLabels = {
  ADMIN: 'Администратор',
  ESTIMATOR: 'Сметчик',
  PURCHASER: 'Снабженец',
  MANAGER: 'Руководитель',
};

const projectStatusLabels = {
  DRAFT: 'Черновик',
  PLANNED: 'Запланирован',
  IN_PROGRESS: 'В работе',
  PURCHASE_IN_PROGRESS: 'Идет закупка',
  COMPLETED: 'Завершен',
};

const estimateStatusLabels = {
  DRAFT: 'Черновик',
  IN_PURCHASE: 'В закупке',
  READY_FOR_PURCHASE: 'Готова к закупке',
  APPROVED: 'Утверждена',
};

const purchaseStatusLabels = {
  DRAFT: 'Черновик',
  SUBMITTED: 'На согласовании',
  APPROVED: 'Утверждена',
  IN_ORDER: 'Заказ оформлен',
  RECEIVED: 'Получена',
  RETURNED_FOR_REVISION: 'Возвращена на доработку',
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

