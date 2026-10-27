import { useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { AuthResponse } from '../api/types';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../lib/profiles';
import { Modal, Spinner } from './ui';

interface Props {
  sessionId: string;
  /** Почему открыли окно — например, гость нажал «Оплатить». */
  reason?: string;
  onClose: () => void;
  onAuthed: (res: AuthResponse) => void;
}

type Tab = 'login' | 'register';

export function AuthModal({ sessionId, reason, onClose, onAuthed }: Props) {
  const [tab, setTab] = useState<Tab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const run = async (key: string, fn: () => Promise<AuthResponse>) => {
    setBusy(key);
    setError('');
    try {
      onAuthed(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось войти');
      setBusy(null);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Введите корректный email');
    if (tab === 'register') {
      if (!name.trim()) return setError('Как вас зовут?');
      if (phone.replace(/\D/g, '').length < 6) return setError('Укажите телефон');
      if (password.length < 6) return setError('Пароль — минимум 6 символов');
      run('form', () =>
        api.auth.register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password, session_id: sessionId }),
      );
    } else {
      if (!password) return setError('Введите пароль');
      run('form', () => api.auth.login({ email: email.trim(), password, session_id: sessionId }));
    }
  };

  return (
    <Modal kicker={reason ?? 'Личный кабинет'} title={tab === 'login' ? 'Вход в профиль' : 'Регистрация'} onClose={onClose}>
      <div className="segmented segmented--tabs" role="tablist">
        {(
          [
            ['login', 'Вход'],
            ['register', 'Регистрация'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'is-active' : ''}
            onClick={() => {
              setTab(key);
              setError('');
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <form className="checkout" onSubmit={submit}>
        <fieldset className="fields">
          {tab === 'register' && (
            <label>
              <span>Имя и фамилия</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
          )}
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          {tab === 'register' && (
            <label>
              <span>Телефон</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </label>
          )}
          <label>
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
        </fieldset>
        {tab === 'register' && <p className="fine">После регистрации начислим 1 000 баллов «Банка снов».</p>}
        {error && <div className="field-error">{error}</div>}
        <button className="btn btn--light btn--block" disabled={!!busy}>
          {busy === 'form' ? <Spinner small /> : tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="quick">
        <div className="label label--plain quick__title">или быстрый вход для жюри</div>
        {DEMO_ACCOUNTS.map((a) => (
          <button
            key={a.key}
            className="quick__item"
            disabled={!!busy}
            onClick={() => run(a.key, () => api.auth.login({ email: a.email, password: DEMO_PASSWORD, session_id: sessionId }))}
          >
            <span className="profile__avatar">
              {a.name
                .split(' ')
                .map((w) => w[0])
                .join('')}
            </span>
            <span className="quick__who">
              <b>{a.name}</b>
              <span>
                {a.badges.map((b) => (
                  <i key={b}>{b}</i>
                ))}
              </span>
            </span>
            {busy === a.key ? <Spinner small /> : <span className={`tier tier--${a.tier.toLowerCase()}`}>{a.tier}</span>}
          </button>
        ))}
      </div>
    </Modal>
  );
}
