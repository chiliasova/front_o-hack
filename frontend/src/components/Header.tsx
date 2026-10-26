import type { UserProfile } from '../api/types';
import type { DataSource } from '../api/client';
import { formatNum } from '../lib/format';
import { DEMO_PROFILES, type DemoProfile } from '../lib/profiles';

export type View = 'planner' | 'deals' | 'trips';

interface Props {
  view: View;
  onView: (v: View) => void;
  profileKey: DemoProfile['key'];
  onProfile: (k: DemoProfile['key']) => void;
  profile: UserProfile | null;
  dataSource: DataSource;
}

export function Header({ view, onView, profileKey, onProfile, profile, dataSource }: Props) {
  return (
    <header className="header">
      <button className="logo" onClick={() => onView('planner')} aria-label="На главную">
        <span className="logo__mark">О!</span>
        <span className="logo__text">
          островок
          <small>О!дин запрос</small>
        </span>
      </button>

      <nav className="nav">
        <button className={`nav__item ${view === 'planner' ? 'is-active' : ''}`} onClick={() => onView('planner')}>
          ✨ Подбор
        </button>
        <button className={`nav__item nav__item--hot ${view === 'deals' ? 'is-active' : ''}`} onClick={() => onView('deals')}>
          🔥 Горящие туры
        </button>
        <button className={`nav__item ${view === 'trips' ? 'is-active' : ''}`} onClick={() => onView('trips')}>
          🧳 Мои поездки
        </button>
      </nav>

      <div className="header__right">
        {dataSource === 'mock' && (
          <span className="badge badge--muted" title="Бэкенд недоступен — показываем демо-ответы">
            демо-данные
          </span>
        )}
        {profile && (
          <span className="points" title={`Статус ${profile.loyalty_tier}, кешбэк ${profile.cashback_percent}%`}>
            🌙 <b>{formatNum(profile.loyalty_points)}</b>
            <span className="points__label">баллов «Банка снов»</span>
            <span className={`tier tier--${profile.loyalty_tier.toLowerCase()}`}>{profile.loyalty_tier}</span>
          </span>
        )}
        <label className="profile-select">
          <span className="profile-select__label">👤 Личный кабинет</span>
          <select value={profileKey} onChange={(e) => onProfile(e.target.value as DemoProfile['key'])}>
            {DEMO_PROFILES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
