import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { BookedTrip, UserProfile } from '../api/types';
import { formatDateDots, formatRub, nightsBetween, pluralize } from '../lib/format';
import { SmartImg, Spinner } from './ui';

type Action = 'early' | 'dates' | 'transfer';

interface Props {
  profile: UserProfile | null;
  refreshKey: number;
  onInquire: (hotelId: number, hotelName: string) => void;
  onPointsChanged: () => void;
}

export function MyTrips({ profile, refreshKey, onInquire, onPointsChanged }: Props) {
  const [trips, setTrips] = useState<BookedTrip[] | null>(null);
  const [error, setError] = useState('');
  const userId = profile?.id ?? null;

  const load = useCallback(() => {
    setError('');
    api
      .trips(userId)
      .then(setTrips)
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить поездки'));
  }, [userId]);

  useEffect(() => {
    setTrips(null);
    load();
  }, [load, refreshKey]);

  const upcoming = trips?.filter((t) => t.status === 'upcoming') ?? [];
  const past = trips?.filter((t) => t.status !== 'upcoming') ?? [];

  return (
    <section className="page">
      <div className="page__head">
        <h1>🧳 Мои поездки</h1>
        {profile ? (
          <p className="muted">
            {profile.name} · статус {profile.loyalty_tier} · кешбэк {profile.cashback_percent}%
            {profile.preferences.family ? ` · ${profile.preferences.family}` : ''}
          </p>
        ) : (
          <p className="muted">Вы вошли как гость — здесь только поездки, оформленные в этой сессии.</p>
        )}
      </div>

      {error && <div className="hint hint--error">{error}</div>}
      {!trips && !error && (
        <div className="center">
          <Spinner />
        </div>
      )}
      {trips && trips.length === 0 && (
        <div className="empty empty--small">
          <div className="empty__art">🧭</div>
          <h2>Пока нет поездок</h2>
          <p>Опишите путешествие агенту — после оформления оно появится здесь.</p>
        </div>
      )}

      {upcoming.length > 0 && <h2 className="section-title">Активные</h2>}
      <div className="trips">
        {upcoming.map((t) => (
          <TripCard
            key={t.id}
            trip={t}
            userId={userId}
            onUpdated={() => {
              load();
              onPointsChanged();
            }}
            onInquire={() => onInquire(t.hotel_id, t.hotel_name)}
          />
        ))}
      </div>

      {past.length > 0 && <h2 className="section-title">Прошедшие</h2>}
      <div className="trips">
        {past.map((t) => (
          <TripCard key={t.id} trip={t} userId={userId} past />
        ))}
      </div>
    </section>
  );
}

function TripCard({
  trip,
  userId,
  past,
  onUpdated,
  onInquire,
}: {
  trip: BookedTrip;
  userId: string | null;
  past?: boolean;
  onUpdated?: () => void;
  onInquire?: () => void;
}) {
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [time, setTime] = useState('10:00');
  const [checkIn, setCheckIn] = useState(trip.check_in);
  const [checkOut, setCheckOut] = useState(trip.check_out);
  const [vehicle, setVehicle] = useState('comfort');
  const nights = nightsBetween(trip.check_in, trip.check_out);

  const run = async () => {
    if (!action) return;
    if (action === 'dates' && checkOut <= checkIn) {
      setResult({ ok: false, text: 'Дата выезда должна быть позже даты заезда' });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res =
        action === 'early'
          ? await api.earlyCheckin(trip.id, time, userId)
          : action === 'dates'
            ? await api.changeDates(trip.id, checkIn, checkOut, userId)
            : await api.addTransfer(trip.id, vehicle, userId);
      setResult({ ok: res.status === 'confirmed', text: res.message });
      setAction(null);
      onUpdated?.();
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : 'Не удалось выполнить запрос' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`trip ${past ? 'trip--past' : ''}`}>
      <SmartImg src={trip.photo} alt={trip.hotel_name} className="trip__photo" />
      <div className="trip__body">
        <div className="trip__top">
          <div>
            <div className="muted">📍 {trip.destination}</div>
            <h3>{trip.hotel_name}</h3>
            <div className="muted">
              📅 {formatDateDots(trip.check_in)} — {formatDateDots(trip.check_out)} · {nights}{' '}
              {pluralize(nights, 'ночь', 'ночи', 'ночей')}
            </div>
          </div>
          <div className="trip__right">
            <span className={`badge ${past ? 'badge--muted' : 'badge--success'}`}>{past ? 'Завершена' : 'Оплачена'}</span>
            <code>{trip.booking_code}</code>
            <b>{formatRub(trip.total_paid)}</b>
          </div>
        </div>

        {trip.extras.length > 0 && (
          <div className="amenities">
            {trip.extras.map((x) => (
              <span key={x} className="amenity">
                ✓ {x}
              </span>
            ))}
          </div>
        )}

        {!past && (
          <>
            <div className="trip__actions">
              <button className={`chip ${action === 'early' ? 'chip--active' : ''}`} onClick={() => setAction(action === 'early' ? null : 'early')}>
                🕙 Запросить ранний заезд
              </button>
              <button className={`chip ${action === 'dates' ? 'chip--active' : ''}`} onClick={() => setAction(action === 'dates' ? null : 'dates')}>
                📅 Изменить даты
              </button>
              <button
                className={`chip ${action === 'transfer' ? 'chip--active' : ''}`}
                onClick={() => setAction(action === 'transfer' ? null : 'transfer')}
              >
                🚕 Добавить трансфер
              </button>
              <button className="chip" onClick={onInquire}>
                💬 Вопрос отельеру
              </button>
            </div>

            {action && (
              <div className="trip__form">
                {action === 'early' && (
                  <label>
                    Время заезда
                    <select value={time} onChange={(e) => setTime(e.target.value)}>
                      {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                )}
                {action === 'dates' && (
                  <>
                    <label>
                      Заезд
                      <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                    </label>
                    <label>
                      Выезд
                      <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                    </label>
                  </>
                )}
                {action === 'transfer' && (
                  <label>
                    Класс авто
                    <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
                      <option value="economy">Эконом</option>
                      <option value="comfort">Комфорт</option>
                      <option value="business">Бизнес</option>
                      <option value="minivan">Минивэн</option>
                    </select>
                  </label>
                )}
                <button className="btn btn--primary" onClick={run} disabled={busy}>
                  {busy ? <Spinner small /> : 'Отправить запрос'}
                </button>
              </div>
            )}
          </>
        )}

        {result && <div className={`hint ${result.ok ? 'hint--success' : 'hint--error'}`}>{result.text}</div>}
      </div>
    </article>
  );
}
