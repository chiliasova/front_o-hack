import { useEffect, useState } from 'react';
import type { TripPlan } from '../api/types';
import { amenity, formatDateShort, formatRub, nightsBetween, pluralize } from '../lib/format';
import { SmartImg, Stars } from './ui';

interface Props {
  plan: TripPlan | null;
  loading: boolean;
  onCheckout: () => void;
  onInquire: () => void;
  onOpenTrips: () => void;
  onExample: (text: string) => void;
}

const addMinutes = (hhmm: string, min: number) => {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + min;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export function TripCanvas({ plan, loading, onCheckout, onInquire, onOpenTrips, onExample }: Props) {
  const [photo, setPhoto] = useState(0);
  useEffect(() => setPhoto(0), [plan?.id]);

  if (!plan) {
    return (
      <section className={`canvas canvas--empty ${loading ? 'is-loading' : ''}`}>
        <div className="empty">
          <div className="empty__art">🗺️</div>
          <h2>Здесь появится ваша поездка</h2>
          <p>
            Опишите путешествие одной фразой — агент подберёт отель, билеты и трансфер, проверит стыковки и объяснит,
            почему этот вариант подходит именно вам.
          </p>
          <div className="empty__examples">
            {['Хочу в Сочи в ноябре с ребёнком до 100к', 'Рим на 4 дня, хочу красиво', 'Куда поехать с собакой на майские?'].map(
              (e) => (
                <button key={e} className="chip chip--ghost" onClick={() => onExample(e)} disabled={loading}>
                  «{e}»
                </button>
              ),
            )}
          </div>
        </div>
      </section>
    );
  }

  const { hotel, transport, transfer, pricing, timeline_validation: tv, explainability: ex } = plan;
  const nights = nightsBetween(plan.check_in, plan.check_out);
  const booked = plan.status === 'booked';
  const photos = hotel.photos.length ? hotel.photos : [''];
  const transportIcon = transport?.type === 'train' ? '🚆' : '✈️';
  const readyAt = transport && transfer ? addMinutes(transport.arrival, transfer.duration_min) : null;

  return (
    <section className={`canvas ${loading ? 'is-loading' : ''}`} key={plan.id}>
      <div className="canvas__scroll">
        <div className="trip-head">
          <div>
            <div className="eyebrow">Холст поездки</div>
            <h1>{plan.destination}</h1>
            <div className="trip-head__meta">
              📅 {formatDateShort(plan.check_in)} – {formatDateShort(plan.check_out)} · {nights}{' '}
              {pluralize(nights, 'ночь', 'ночи', 'ночей')} · 👥 {plan.guests}{' '}
              {pluralize(plan.guests, 'гость', 'гостя', 'гостей')}
            </div>
          </div>
          {booked ? <span className="badge badge--success">✓ Оформлено</span> : <span className="badge">Собрано агентом</span>}
        </div>

        <div className={`check-badge ${tv.is_valid ? 'check-badge--ok' : 'check-badge--warn'}`}>
          <span className="check-badge__icon">{tv.is_valid ? '✓' : '!'}</span>
          <div>
            <b>{tv.is_valid ? 'Все стыковки проверены' : 'Агент нашёл нюанс в стыковке'}</b>
            <p>{tv.status_text.replace(/->/g, '→')}</p>
          </div>
        </div>

        {/* Отель */}
        <article className="card hotel">
          <div className="gallery">
            <SmartImg src={photos[photo]} alt={hotel.name} className="gallery__main" />
            {photos.length > 1 && (
              <div className="gallery__thumbs">
                {photos.map((p, i) => (
                  <button key={p + i} className={i === photo ? 'is-active' : ''} onClick={() => setPhoto(i)}>
                    <SmartImg src={p} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="hotel__body">
            <div className="card__kicker">🏨 Отель</div>
            <div className="hotel__title">
              <h3>{hotel.name}</h3>
              <span className="rating">{hotel.rating.toFixed(1)}</span>
            </div>
            <div className="muted">
              <Stars n={hotel.stars} /> · {hotel.address}
            </div>
            <div className="amenities">
              {hotel.amenities.map((a) => {
                const { icon, label } = amenity(a);
                return (
                  <span key={a} className={`amenity ${a === 'pet_friendly' ? 'amenity--accent' : ''}`}>
                    {icon} {label}
                  </span>
                );
              })}
            </div>
            <div className="hotel__foot">
              <span className="muted">🛡️ {hotel.cancellation_policy}</span>
              <span>
                <b>{formatRub(hotel.price_per_night)}</b> <span className="muted">/ ночь</span>
              </span>
            </div>
            <button className="btn btn--ghost" onClick={onInquire}>
              💬 Задать вопрос отельеру
            </button>
          </div>
        </article>

        <div className="grid-2">
          {transport && (
            <article className="card">
              <div className="card__kicker">
                {transportIcon} {transport.type === 'train' ? 'Поезд' : 'Перелёт'}
              </div>
              <h3>{transport.carrier}</h3>
              <div className="route">
                <div>
                  <b>{transport.departure}</b>
                  <span>отправление</span>
                </div>
                <div className="route__line">
                  <span>{transportIcon}</span>
                </div>
                <div>
                  <b>{transport.arrival}</b>
                  <span>прибытие</span>
                </div>
              </div>
              <div className="card__foot">
                <span className="muted">{transport.baggage ? '🧳 Багаж включён' : '🎒 Только ручная кладь'}</span>
                <span>
                  {formatRub(transport.price)} <span className="muted">/ чел.</span>
                </span>
              </div>
            </article>
          )}
          {transfer && (
            <article className="card">
              <div className="card__kicker">🚕 Трансфер</div>
              <h3>{transfer.type}</h3>
              <p className="muted">
                Встреча с табличкой, {transfer.duration_min} мин до отеля
                {readyAt ? `. В отеле около ${readyAt}` : ''}
              </p>
              <div className="card__foot">
                <span className="muted">Бесплатное ожидание 60 мин</span>
                <span>{formatRub(transfer.price)}</span>
              </div>
            </article>
          )}
        </div>

        {transport && (
          <div className="timeline">
            <div className="timeline__step">
              <span>{transportIcon}</span>
              <b>{transport.departure}</b>
              <small>отправление</small>
            </div>
            <div className="timeline__step">
              <span>📍</span>
              <b>{transport.arrival}</b>
              <small>прибытие</small>
            </div>
            {transfer && (
              <div className="timeline__step">
                <span>🚕</span>
                <b>{transfer.duration_min} мин</b>
                <small>трансфер</small>
              </div>
            )}
            <div className={`timeline__step ${tv.is_valid ? 'is-ok' : 'is-warn'}`}>
              <span>🛏️</span>
              <b>14:00</b>
              <small>заселение</small>
            </div>
          </div>
        )}

        <div className="explain">
          <div className="explain__item explain__item--why">
            <div className="explain__title">✅ Почему подходит</div>
            <p>{ex.why_recommended}</p>
          </div>
          <div className="explain__item explain__item--trade">
            <div className="explain__title">⚖️ Компромиссы</div>
            <p>{ex.trade_offs}</p>
          </div>
          <div className="explain__item explain__item--risk">
            <div className="explain__title">⚠️ Риски</div>
            <p>{ex.risks}</p>
          </div>
        </div>
      </div>

      <footer className="summary">
        <div className="summary__lines">
          <span>
            Отель {formatRub(pricing.hotel_total)}
            {pricing.transport_total > 0 && ` · Билеты ${formatRub(pricing.transport_total)}`}
            {pricing.transfer_total > 0 && ` · Трансфер ${formatRub(pricing.transfer_total)}`}
          </span>
          <span className="summary__cashback">+{formatRub(pricing.cashback_will_earn).replace(' ₽', '')} баллов кешбэком</span>
        </div>
        <div className="summary__total">
          <div>
            <small>Итого за всё</small>
            <b>{formatRub(pricing.total_price)}</b>
          </div>
          {booked ? (
            <button className="btn btn--success btn--lg" onClick={onOpenTrips}>
              Открыть в «Моих поездках»
            </button>
          ) : (
            <button className="btn btn--primary btn--lg" onClick={onCheckout}>
              Оформить поездку
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}
