import { useState } from 'react';
import { api } from '../api/client';
import type { UserProfile } from '../api/types';
import { toProfile } from '../lib/auth';
import { amenity, formatNum } from '../lib/format';
import { Icon } from './Icon';
import { Modal, Spinner } from './ui';

// Удобства, которые агент учитывает при подборе (ключи — как у бэкенда в preferred_amenities).
const AMENITY_CHOICES = ['pool', 'spa', 'beach', 'kids_club', 'breakfast_included', 'pet_friendly', 'city_center', 'gym'];

interface Props {
  profile: UserProfile;
  onClose: () => void;
  onSaved: (p: UserProfile) => void;
  onOpenTrips: () => void;
  onLogout: () => void;
}

export function ProfileModal({ profile, onClose, onSaved, onOpenTrips, onLogout }: Props) {
  const pref = profile.preferences;
  const [hasPets, setHasPets] = useState(pref.has_pets);
  const [petDetails, setPetDetails] = useState(pref.pet_details ?? '');
  const [schengen, setSchengen] = useState(pref.has_schengen_visa);
  const [amenities, setAmenities] = useState<string[]>(pref.favorite_amenities);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
  const choices = [...new Set([...AMENITY_CHOICES, ...pref.favorite_amenities])];

  const toggle = (a: string) => setAmenities((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]));

  const save = async () => {
    setBusy(true);
    setResult(null);
    try {
      await api.auth.updateProfile({
        name: profile.name,
        phone: profile.phone,
        has_pets: hasPets,
        pet_details: hasPets ? petDetails.trim() : '',
        has_schengen: schengen,
        preferred_amenities: amenities,
      });
      // Ответ PUT в спецификации не описан — берём свежий профиль из /api/auth/me.
      const fresh = toProfile(await api.auth.me());
      onSaved({ ...fresh, preferences: { ...fresh.preferences, family: pref.family } });
      setResult({ ok: true, text: 'Сохранено. Агент учтёт это в следующих подборках.' });
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : 'Не удалось сохранить' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal kicker="Личный кабинет" title={profile.name} onClose={onClose}>
      <div className="me">
        <span className="profile__avatar profile__avatar--lg">{initials}</span>
        <div className="me__info">
          <span>
            {profile.email}
            {profile.phone ? ` · ${profile.phone}` : ''}
          </span>
          <span className="me__row">
            <span className={`tier tier--${profile.loyalty_tier.toLowerCase()}`}>{profile.loyalty_tier}</span>
            кешбэк {profile.cashback_percent}%
          </span>
        </div>
        <div className="me__points">
          <b className="mono">{formatNum(profile.loyalty_points)}</b>
          <span>снов в «Банке снов»</span>
          <small>1 сон = 1 ₽</small>
        </div>
      </div>

      <div className="prefs">
        <div className="label label--plain">Что агенту знать о вас</div>
        <label className="switch">
          <input type="checkbox" checked={hasPets} onChange={(e) => setHasPets(e.target.checked)} />
          <span className="switch__track" />
          <span>Путешествую с питомцем</span>
        </label>
        {hasPets && (
          <label className="fields prefs__pet">
            <span>Кто и какого размера</span>
            <input value={petDetails} onChange={(e) => setPetDetails(e.target.value)} placeholder="Например: собака (корги), 11 кг" />
          </label>
        )}
        <label className="switch">
          <input type="checkbox" checked={schengen} onChange={(e) => setSchengen(e.target.checked)} />
          <span className="switch__track" />
          <span>Есть действующая шенгенская виза</span>
        </label>

        <div className="label label--plain">Любимые удобства</div>
        <div className="tabs">
          {choices.map((a) => {
            const { icon, label } = amenity(a);
            return (
              <button key={a} type="button" className={amenities.includes(a) ? 'is-active' : ''} onClick={() => toggle(a)}>
                <Icon name={icon} size={15} /> {label}
              </button>
            );
          })}
        </div>

        {result && <div className={`notice ${result.ok ? 'notice--ok' : 'notice--error'}`}>{result.text}</div>}
        <button className="btn btn--light btn--sm" onClick={save} disabled={busy}>
          {busy ? <Spinner small /> : 'Сохранить настройки'}
        </button>
      </div>

      <div className="me__actions">
        <button className="link-btn" onClick={onOpenTrips}>
          <Icon name="suitcase" size={16} /> Мои поездки
        </button>
        <button className="link-btn link-btn--dim" onClick={onLogout}>
          <Icon name="logout" size={16} /> Выйти из аккаунта
        </button>
      </div>
    </Modal>
  );
}
