import type { UserProfile } from '../api/types';
import type { DataSource } from '../api/client';
import { formatNum } from '../lib/format';
import { DEMO_PROFILES, type DemoProfile } from '../lib/profiles';
import { Icon } from './Icon';

export type View = 'planner' | 'deals' | 'trips';

interface Props {
  view: View;
  onView: (v: View) => void;
  onNew: () => void;
  hasRequest: boolean;
  profileKey: DemoProfile['key'];
  onProfile: (k: DemoProfile['key']) => void;
  profile: UserProfile | null;
  dataSource: DataSource;
}

const NAV: { key: View; label: string }[] = [
  { key: 'planner', label: 'Запрос' },
  { key: 'deals', label: 'Горящие' },
  { key: 'trips', label: 'Мои поездки' },
];

export function Header({ view, onView, onNew, hasRequest, profileKey, onProfile, profile, dataSource }: Props) {
  const initials = profile
    ? profile.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
    : '—';

  return (
    <header className="header">
      <button className="brand" onClick={onNew} aria-label="Новый запрос">
        <i>О!</i>
        <b>дин запрос</b>
      </button>

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
        {profile && (
          <span className="points" title={`Баллы «Банка снов» · статус ${profile.loyalty_tier} · кешбэк ${profile.cashback_percent}%`}>
            {formatNum(profile.loyalty_points)} снов
          </span>
        )}
        <label className="profile" title="Демо-профиль">
          <span className="profile__avatar">{initials}</span>
          <span className="profile__name">{DEMO_PROFILES.find((p) => p.key === profileKey)?.short}</span>
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
