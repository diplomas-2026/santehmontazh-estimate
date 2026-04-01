import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../modules/auth/AuthContext';

export function AuthPage({ mode }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isRegister = mode === 'register';

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form);
      }
      navigate('/dashboard');
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <div className="auth-promo">
          <p className="eyebrow">Современный продукт для подрядчика</p>
          <h1>Смета и закупка в одном потоке, а не в десятке таблиц.</h1>
          <p className="hero-text">
            Платформа помогает команде считать сметы, закупать материалы и продавать руководству прозрачную картину по бюджету.
          </p>
          <div className="tag-row">
            <span className="tag">Версии смет</span>
            <span className="tag">Premium-аналитика</span>
            <span className="tag">Согласование закупок</span>
          </div>
          <div className="hero-actions">
            <Link className="ghost-button hero-button" to="/">О продукте</Link>
            <Link className="primary-button hero-button" to="/pricing">Тарифы</Link>
          </div>
        </div>

        <div className="auth-card">
          <p className="eyebrow">Производственная платформа</p>
          <h1>{isRegister ? 'Регистрация сметчика' : 'Вход в систему'}</h1>
          <p className="muted">
            {isRegister
              ? 'Новый пользователь создается с ролью ESTIMATOR и может сразу подключить платный тариф.'
              : 'Авторизуйтесь, чтобы работать со сметами, закупками и premium-аналитикой по объектам.'}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister ? (
              <label>
                ФИО
                <input
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  placeholder="Иван Петров"
                />
              </label>
            ) : null}

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="user@santehmontazh.local"
              />
            </label>

            <label>
              Пароль
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Минимум 8 символов"
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </label>

            {error ? <div className="error-box">{error}</div> : null}

            <button type="submit" className="primary-button" disabled={busy}>
              {busy ? 'Подождите...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>

          <div className="auth-footer">
            {isRegister ? (
              <Link to="/login">Уже есть аккаунт? Войти</Link>
            ) : (
              <Link to="/register">Нет аккаунта? Зарегистрироваться</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
