const roleLabels = {
  ADMIN: 'Администратор',
  BASE_USER: 'Пользователь',
};

const projectStatusLabels = {
  DRAFT: 'Черновик',
  IN_PROGRESS: 'В работе',
  PURCHASE_IN_PROGRESS: 'Факт фиксируется',
  COMPLETED: 'Завершен',
};

const estimateStatusLabels = {
  DRAFT: 'Черновик',
  IN_PROGRESS: 'В работе',
  IN_PURCHASE: 'В работе',
  READY_FOR_PURCHASE: 'В работе',
  ARCHIVED: 'В архиве',
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

export function translateSubscriptionStatus(status) {
  return translateFromMap(status, subscriptionStatusLabels);
}
