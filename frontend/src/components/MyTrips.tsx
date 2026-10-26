import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { BookedTrip, UserProfile } from '../api/types';
import { formatDateDots, formatRub, nightsBetween, pluralize } from '../lib/format';
import { Icon } from './Icon';
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
      <header className="page__head">
        <div className="kicker">Личный кабинет</div>
        <h1 className="display">
          Мои <em>поездки</em>
        </h1>
        {profile ? (
          <p>
            {profile.name} · статус {profile.loyalty_tier} · кешбэк {profile.cashback_percent}%
            {profile.preferences.family ? ` · ${profile.preferences.family}` : ''}
          </p>
        ) : (
          <p>Вы вошли как гость — здесь только поездки, оформленные в этой сессии.</p>
        )}
      </header>

      {error && <div className="notice notice--error">{error}</div>}
      {!trips && !error && (
        <div className="center">
          <Spinner />
        </div>
      )}
      {trips && trips.length === 0 && (
        <div className="blank">
          <Icon name="compass" size={40} />
          <h2>Пока ни одной поездки</h2>
          <p>Опишите путешествие агенту — после оформления оно появится здесь.</p>
        </div>
      )}

      {upcoming.length > 0 && <h2 className="section-title">Впереди</h2>}
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

      {past.length > 0 && <h2 className="section-title">Уже были</h2>}
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
      <SmartImg src={trip.photo} alt={trip.hotel_name} label={trip.destination} className="trip__photo" />
      <div className="trip__body">
        <div className="trip__top">
          <div>
            <span className="kicker">{trip.destination}</span>
            <h3>{trip.hotel_name}</h3>
            <div className="trip__dates mono">
              {formatDateDots(trip.check_in)} — {formatDateDots(trip.check_out)} · {nights}{' '}
              {pluralize(nights, 'ночь', 'ночи', 'ночей')}
            </div>
          </div>
          <div className="trip__stub">
            <span className={`stamp ${past ? '' : 'stamp--paid'}`}>{past ? 'Завершена' : 'Оплачена'}</span>
            <span className="mono">{trip.booking_code}</span>
            <b className="mono">{formatRub(trip.total_paid)}</b>
          </div>
        </div>

        {trip.extras.length > 0 && (
          <ul className="extras">
            {trip.extras.map((x) => (
              <li key={x}>
                <Icon name="check" size={14} /> {x}
              </li>
            ))}
          </ul>
        )}

        {!past && (
          <>
            <div className="trip__actions">
              <button className={action === 'early' ? 'is-active' : ''} onClick={() => setAction(action === 'early' ? null : 'early')}>
                <Icon name="clock" size={16} /> Ранний заезд
              </button>
              <button className={action === 'dates' ? 'is-active' : ''} onClick={() => setAction(action === 'dates' ? null : 'dates')}>
                <Icon name="calendar" size={16} /> Изменить даты
              </button>
              <button className={action === 'transfer' ? 'is-active' : ''} onClick={() => setAction(action === 'transfer' ? null : 'transfer')}>
                <Icon name="car" size={16} /> Добавить трансфер
              </button>
              <button onClick={onInquire}>
                <Icon name="chat" size={16} /> Спросить у отеля
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
                <button className="btn btn--ink" onClick={run} disabled={busy}>
                  {busy ? <Spinner small /> : 'Отправить запрос'}
                </button>
              </div>
            )}
          </>
        )}

        {result && <div className={`notice ${result.ok ? 'notice--ok' : 'notice--error'}`}>{result.text}</div>}
      </div>
    </article>
  );
}
