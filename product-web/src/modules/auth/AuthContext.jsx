/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken } from '../../api';
import { subscriptionPlans } from '../subscription/plans';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  async function loadSubscription() {
    try {
      const response = await api('/api/subscription/me');
      setSubscription(response);
      return response;
    } catch {
      setSubscription(null);
      return null;
    }
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    api('/api/auth/me')
      .then(async (responseUser) => {
        setUser(responseUser);
        await loadSubscription();
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
    await loadSubscription();
    return response.user;
  }

  async function register(payload) {
    const response = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    localStorage.setItem('token', response.token);
    setUser(response.user);
    await loadSubscription();
    return response.user;
  }

  async function activateSubscription(payload) {
    const response = await api('/api/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setSubscription(response);
    return response;
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
        hasPremiumAccess: subscription ? subscription.status === 'ACTIVE' && subscription.tierId !== 'starter' : false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
