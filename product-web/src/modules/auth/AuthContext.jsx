import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken } from '../../api';
import { getPeriodById, getPlanById, subscriptionPlans } from '../subscription/plans';

const AuthContext = createContext(null);
const SUBSCRIPTION_STORAGE_KEY = 'subscriptions-v1';

function normalizeEmail(email) {
  return email?.trim().toLowerCase() ?? '';
}

function readStoredSubscriptions() {
  try {
    return JSON.parse(localStorage.getItem(SUBSCRIPTION_STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveStoredSubscriptions(subscriptions) {
  localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscriptions));
}

function getSubscriptionForEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }
  return readStoredSubscriptions()[normalizedEmail] ?? null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    api('/api/auth/me')
      .then((responseUser) => {
        setUser(responseUser);
        setSubscription(getSubscriptionForEmail(responseUser.email));
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
        setSubscription(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(payload) {
    const response = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    localStorage.setItem('token', response.token);
    setUser(response.user);
    setSubscription(getSubscriptionForEmail(response.user.email));
    return response.user;
  }

  async function register(payload) {
    const response = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    localStorage.setItem('token', response.token);
    setUser(response.user);
    setSubscription(getSubscriptionForEmail(response.user.email));
    return response.user;
  }

  function activateSubscription({ email, tierId, periodId, companyName, cardHolder }) {
    const normalizedEmail = normalizeEmail(email ?? user?.email);
    const plan = getPlanById(tierId);
    const period = getPeriodById(plan, periodId);
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + period.months);

    const nextSubscription = {
      tierId: plan.id,
      tierName: plan.name,
      periodId: period.id,
      periodLabel: period.label,
      price: period.price,
      status: 'ACTIVE',
      companyName: companyName?.trim() || 'Без названия компании',
      cardHolder: cardHolder?.trim() || 'Не указано',
      activatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const subscriptions = readStoredSubscriptions();
    subscriptions[normalizedEmail] = nextSubscription;
    saveStoredSubscriptions(subscriptions);

    if (user && normalizeEmail(user.email) === normalizedEmail) {
      setSubscription(nextSubscription);
    }

    return nextSubscription;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    setSubscription(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        subscription,
        plans: subscriptionPlans,
        activateSubscription,
        hasPremiumAccess: subscription ? subscription.tierId !== 'starter' : false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
