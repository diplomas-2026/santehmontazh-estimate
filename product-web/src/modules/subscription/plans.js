export const subscriptionPlans = [
  {
    id: 'starter',
    name: 'Start',
    label: 'Для одного сметчика',
    description: 'Быстрый расчет сметы, каталог материалов и базовый контроль закупок.',
    accent: 'Старт без перегруза',
    features: [
      'До 3 активных объектов',
      'Сметы и позиции затрат',
      'Каталог материалов',
      'История по объектам за 30 дней',
    ],
    periods: [
      { id: 'month', label: '1 месяц', months: 1, price: '2 900 ₽' },
      { id: 'quarter', label: '3 месяца', months: 3, price: '7 500 ₽' },
      { id: 'year', label: '12 месяцев', months: 12, price: '27 900 ₽' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    label: 'Для команды объекта',
    description: 'Аналитика, согласование закупок, контроль отклонений и совместная работа.',
    accent: 'Самый популярный',
    highlight: true,
    features: [
      'Неограниченные объекты',
      'План / факт и отклонения',
      'Согласование закупок',
      'Поставщики и сравнение предложений',
      'Роли и разграничение доступа',
    ],
    periods: [
      { id: 'month', label: '1 месяц', months: 1, price: '6 900 ₽' },
      { id: 'quarter', label: '3 месяца', months: 3, price: '17 900 ₽' },
      { id: 'year', label: '12 месяцев', months: 12, price: '64 900 ₽' },
    ],
  },
  {
    id: 'enterprise',
    name: 'Scale',
    label: 'Для нескольких площадок',
    description: 'Полная управленческая витрина для крупных подрядчиков и снабжения.',
    accent: 'Для роста и контроля',
    features: [
      'Мультиобъектный контроль',
      'Премиальная аналитика и рекомендации',
      'Приоритетная поддержка',
      'Расширенная история действий',
      'White-label презентация для заказчика',
    ],
    periods: [
      { id: 'month', label: '1 месяц', months: 1, price: '12 900 ₽' },
      { id: 'quarter', label: '3 месяца', months: 3, price: '33 900 ₽' },
      { id: 'year', label: '12 месяцев', months: 12, price: '124 900 ₽' },
    ],
  },
];

export function getPlanById(planId) {
  return subscriptionPlans.find((plan) => plan.id === planId) ?? subscriptionPlans[1];
}

export function getPeriodById(plan, periodId) {
  return plan.periods.find((period) => period.id === periodId) ?? plan.periods[0];
}
