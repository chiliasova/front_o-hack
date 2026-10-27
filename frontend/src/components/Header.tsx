import type { UserProfile } from '../api/types';
import type { DataSource } from '../api/client';
import { formatNum } from '../lib/format';
import { Icon } from './Icon';

export type View = 'planner' | 'deals' | 'trips';

interface Props {
  view: View;
  onView: (v: View) => void;
  onNew: () => void;
  onHistory: () => void;
  onLogin: () => void;
  onProfile: () => void;
  hasRequest: boolean;
  profile: UserProfile | null;
  dataSource: DataSource;
}

const NAV: { key: View; label: string }[] = [
  { key: 'planner', label: 'Запрос' },
  { key: 'deals', label: 'Горящие' },
  { key: 'trips', label: 'Мои поездки' },
];

export function Header({ view, onView, onNew, onHistory, onLogin, onProfile, hasRequest, profile, dataSource }: Props) {
  const initials = profile
    ? profile.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
    : '';

  return (
    <header className="header">
      <div className="header__left">
        <button className="history-toggle" onClick={onHistory} title="История запросов" aria-label="История запросов">
          <Icon name="history" size={20} />
        </button>
        <button className="brand" onClick={onNew} aria-label="Новый запрос">
          <i>О!</i>
          <b>дин запрос</b>
        </button>
      </div>

      <nav className="nav">
        {NAV.map((n) => (
          <button key={n.key} className={`nav__item ${view === n.key ? 'is-on' : ''}`} onClick={() => onView(n.key)}>
            {n.label}
          </button>
        ))}
        {hasRequest && (
          <button className="nav__new" onClick={onNew} title="Начать новый запрос">
            <Icon name="plus" size={14} /> новый
          </button>
        )}
      </nav>

      <div className="header__right">
        {dataSource === 'mock' && (
          <span className="demo-flag" title="Бэкенд недоступен — показываем демо-ответы">
            демо-данные
          </span>
        )}
        {profile ? (
          <>
            <span className="points" title="Баланс «Банка снов»">
              {formatNum(profile.loyalty_points)} снов
            </span>
            <button className="profile-btn" onClick={onProfile} title="Личный кабинет">
              <span className="profile__avatar">{initials}</span>
              <span className="profile-btn__info">
                <b>{profile.name.split(' ')[0]}</b>
                <span className={`tier-text tier-text--${profile.loyalty_tier.toLowerCase()}`}>{profile.loyalty_tier}</span>
              </span>
              <Icon name="chevronDown" size={14} />
            </button>
          </>
        ) : (
          <button className="btn btn--ghost btn--xs" onClick={onLogin} aria-label="Войти">
            <Icon name="user" size={16} /> <span className="login-text">Войти</span>
          </button>
        )}
      </div>
    </header>
  );
}
