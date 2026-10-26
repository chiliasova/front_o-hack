import type { UserProfile } from '../api/types';
import type { DataSource } from '../api/client';
import { formatNum } from '../lib/format';
import { DEMO_PROFILES, type DemoProfile } from '../lib/profiles';
import { Icon } from './Icon';

export type View = 'planner' | 'deals' | 'trips';

interface Props {
  view: View;
  onView: (v: View) => void;
  profileKey: DemoProfile['key'];
  onProfile: (k: DemoProfile['key']) => void;
  profile: UserProfile | null;
  dataSource: DataSource;
}

const NAV: { key: View; label: string }[] = [
  { key: 'planner', label: 'Подбор' },
  { key: 'deals', label: 'Горящие' },
  { key: 'trips', label: 'Мои поездки' },
];

export function Header({ view, onView, profileKey, onProfile, profile, dataSource }: Props) {
  const initials = profile
    ? profile.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
    : '—';

  return (
    <header className="header">
      <button className="logo" onClick={() => onView('planner')} aria-label="На главную">
        <span className="logo__mark">
          О<em>!</em>
        </span>
        <span className="logo__text">
          <b>
            О<em>!</em>дин запрос
          </b>
          <small>агент путешествий Островка</small>
        </span>
      </button>

      <nav className="nav">
        {NAV.map((n) => (
          <button key={n.key} className={`nav__item ${view === n.key ? 'is-active' : ''}`} onClick={() => onView(n.key)}>
            {n.key === 'deals' && <Icon name="flame" size={16} />}
            {n.label}
          </button>
        ))}
      </nav>

      <div className="header__right">
        {dataSource === 'mock' && (
          <span className="demo-flag" title="Бэкенд недоступен — показываем демо-ответы">
            демо
          </span>
        )}
        {profile && (
          <span className="points" title={`Баллы «Банка снов», кешбэк ${profile.cashback_percent}%`}>
            <Icon name="moon" size={16} />
            <b>{formatNum(profile.loyalty_points)}</b>
            <span className="points__label">снов</span>
            <span className="points__tier">{profile.loyalty_tier}</span>
          </span>
        )}
        <label className="profile">
          <span className="profile__avatar">{initials}</span>
          <select value={profileKey} onChange={(e) => onProfile(e.target.value as DemoProfile['key'])} aria-label="Демо-профиль">
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
