import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken } from '../../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    api('/api/auth/me')
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
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
    return response.user;
  }

  async function register(payload) {
    const response = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    localStorage.setItem('token', response.token);
    setUser(response.user);
    return response.user;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
