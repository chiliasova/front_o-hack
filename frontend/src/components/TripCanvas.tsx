import { useEffect, useState } from 'react';
import type { TripPlan } from '../api/types';
import { amenity, formatDateShort, formatNum, formatRub, nightsBetween, pluralize } from '../lib/format';
import { Icon } from './Icon';
import { SmartImg, Stars } from './ui';

interface Props {
  plan: TripPlan | null;
  loading: boolean;
  onCheckout: () => void;
  onInquire: () => void;
  onOpenTrips: () => void;
  onExample: (text: string) => void;
}

const EXAMPLES = ['Хочу в Сочи в ноябре с ребёнком до 100к', 'Рим на 4 дня, хочу красиво', 'Куда поехать с собакой на майские?'];

const addMinutes = (hhmm: string, min: number) => {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + min;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const city = (destination: string) => destination.split(',')[0];

export function TripCanvas({ plan, loading, onCheckout, onInquire, onOpenTrips, onExample }: Props) {
  const [photo, setPhoto] = useState(0);
  useEffect(() => setPhoto(0), [plan?.id]);

  if (!plan) {
    return (
      <section className={`canvas canvas--empty ${loading ? 'is-loading' : ''}`}>
        <svg className="empty__route" viewBox="0 0 600 400" aria-hidden>
          <path d="M40 330 C 160 250, 180 120, 320 140 S 520 60, 560 50" />
          <circle cx="40" cy="330" r="6" />
          <circle cx="560" cy="50" r="6" />
        </svg>
        <div className="empty">
          <div className="kicker">Холст поездки</div>
          <h1 className="display">
            Куда <em>поедем</em>?
          </h1>
          <p className="empty__lead">
            Одна фраза — и агент соберёт отель, билеты и трансфер, проверит стыковки по минутам и честно скажет, в чём
            подвох.
          </p>
          <ol className="empty__examples">
            {EXAMPLES.map((e, i) => (
              <li key={e}>
                <button onClick={() => onExample(e)} disabled={loading}>
                  <span className="num">0{i + 1}</span>
                  <span>«{e}»</span>
                  <Icon name="arrowRight" size={16} />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  const { hotel, transport, transfer, pricing, timeline_validation: tv, explainability: ex } = plan;
  const nights = nightsBetween(plan.check_in, plan.check_out);
  const booked = plan.status === 'booked';
  const photos = hotel.photos.length ? hotel.photos : [''];
  const isTrain = transport?.type === 'train';
  const readyAt = transport && transfer ? addMinutes(transport.arrival, transfer.duration_min) : null;
  const routeNo = plan.id.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase();

  return (
    <section className={`canvas ${loading ? 'is-loading' : ''}`} key={plan.id}>
      <div className="canvas__scroll">
        <header className="trip-head">
          <div className="trip-head__meta">
            <span className="kicker">Маршрут № {routeNo}</span>
            <span className={`stamp ${booked ? 'stamp--paid' : ''}`}>{booked ? 'Оплачено' : 'Собрано агентом'}</span>
          </div>
          <h1 className="display">{plan.destination}</h1>
          <div className="trip-head__facts">
            <span>
              <Icon name="calendar" size={16} /> {formatDateShort(plan.check_in)} — {formatDateShort(plan.check_out)}
            </span>
            <span>
              <Icon name="bed" size={16} /> {nights} {pluralize(nights, 'ночь', 'ночи', 'ночей')}
            </span>
            <span>
              <Icon name="users" size={16} /> {plan.guests} {pluralize(plan.guests, 'гость', 'гостя', 'гостей')}
            </span>
          </div>
        </header>

        {/* Отель — обложка */}
        <article className="hotel">
          <div className="hotel__cover">
            <SmartImg src={photos[photo]} alt={hotel.name} label={city(plan.destination)} className="hotel__img" />
            <div className="hotel__overlay">
              <div className="hotel__rating">
                <b>{hotel.rating.toFixed(1)}</b>
                <span>рейтинг гостей</span>
              </div>
              <Stars n={hotel.stars} />
              <h2>{hotel.name}</h2>
              <span className="hotel__addr">
                <Icon name="pin" size={14} /> {hotel.address}
              </span>
            </div>
            {photos.length > 1 && (
              <div className="hotel__thumbs">
                {photos.map((p, i) => (
                  <button
                    key={p + i}
                    className={i === photo ? 'is-active' : ''}
                    onClick={() => setPhoto(i)}
                    aria-label={`Фото ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="hotel__info">
            <ul className="amenities">
              {hotel.amenities.map((a) => {
                const { icon, label } = amenity(a);
                return (
                  <li key={a} className={a === 'pet_friendly' ? 'is-accent' : ''}>
                    <Icon name={icon} size={16} /> {label}
                  </li>
                );
              })}
            </ul>
            <div className="hotel__row">
              <span className="hotel__policy">
                <Icon name="shield" size={16} /> {hotel.cancellation_policy}
              </span>
              <span className="hotel__price">
                <b>{formatRub(hotel.price_per_night)}</b> за ночь
              </span>
            </div>
            <button className="text-btn" onClick={onInquire}>
              <Icon name="chat" size={16} /> Спросить у отеля
            </button>
          </div>
        </article>

        {/* Дорога — посадочный талон */}
        {transport && (
          <article className="ticket">
            <div className="ticket__main">
              <div className="ticket__top">
                <span className="kicker">
                  <Icon name={isTrain ? 'train' : 'plane'} size={14} /> {isTrain ? 'Поезд' : 'Перелёт'}
                </span>
                <span className="ticket__carrier">{transport.carrier}</span>
              </div>
              <div className="ticket__route">
                <div>
                  <b className="mono">{transport.departure}</b>
                  <span>отправление</span>
                </div>
                <div className="ticket__line">
                  <Icon name={isTrain ? 'train' : 'plane'} size={18} />
                </div>
                <div>
                  <b className="mono">{transport.arrival}</b>
                  <span>{city(plan.destination)}</span>
                </div>
              </div>
              <div className="ticket__foot">
                <span>
                  <Icon name="bag" size={14} /> {transport.baggage ? 'Багаж включён' : 'Только ручная кладь'}
                </span>
                {transfer && (
                  <span>
                    <Icon name="car" size={14} /> {transfer.type}, {transfer.duration_min} мин · {formatRub(transfer.price)}
                  </span>
                )}
              </div>
            </div>
            <div className="ticket__stub">
              <span className="kicker">за человека</span>
              <b className="mono">{formatNum(transport.price)} ₽</b>
              <span className="ticket__barcode" aria-hidden />
            </div>
          </article>
        )}

        {/* Стыковки */}
        {transport && (
          <section className={`connect ${tv.is_valid ? 'connect--ok' : 'connect--warn'}`}>
            <div className="connect__head">
              <span className="connect__badge">
                <Icon name={tv.is_valid ? 'check' : 'alert'} size={16} />
              </span>
              <div>
                <b>{tv.is_valid ? 'Все стыковки проверены' : 'Есть нюанс со стыковкой'}</b>
                <p>{tv.status_text.replace(/->/g, '→')}</p>
              </div>
            </div>
            <ol className="connect__line">
              <li>
                <span className="mono">{transport.departure}</span>
                <small>{isTrain ? 'поезд' : 'вылет'}</small>
              </li>
              <li>
                <span className="mono">{transport.arrival}</span>
                <small>прибытие</small>
              </li>
              {transfer && (
                <li>
                  <span className="mono">{readyAt}</span>
                  <small>в отеле</small>
                </li>
              )}
              <li className="is-final">
                <span className="mono">14:00</span>
                <small>заселение</small>
              </li>
            </ol>
          </section>
        )}

        {/* Объяснения агента */}
        <section className="notes">
          <div className="kicker">Заметки агента</div>
          <div className="notes__grid">
            <div className="note">
              <span className="note__num">01</span>
              <h3>Почему это вам</h3>
              <p>{ex.why_recommended}</p>
            </div>
            <div className="note">
              <span className="note__num">02</span>
              <h3>Компромисс</h3>
              <p>{ex.trade_offs}</p>
            </div>
            <div className="note note--risk">
              <span className="note__num">03</span>
              <h3>Что учесть</h3>
              <p>{ex.risks}</p>
            </div>
          </div>
        </section>
      </div>

      <footer className="summary">
        <div className="summary__breakdown">
          <span>
            Отель <b>{formatRub(pricing.hotel_total)}</b>
          </span>
          {pricing.transport_total > 0 && (
            <span>
              Билеты <b>{formatRub(pricing.transport_total)}</b>
            </span>
          )}
          {pricing.transfer_total > 0 && (
            <span>
              Трансфер <b>{formatRub(pricing.transfer_total)}</b>
            </span>
          )}
        </div>
        <div className="summary__total">
          <div>
            <span className="summary__label">Всё вместе</span>
            <b className="summary__sum">{formatRub(pricing.total_price)}</b>
          </div>
          {booked ? (
            <button className="btn btn--light" onClick={onOpenTrips}>
              В мои поездки <Icon name="arrowRight" size={18} />
            </button>
          ) : (
            <button className="btn btn--accent" onClick={onCheckout}>
              Оформить поездку <Icon name="arrowRight" size={18} />
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}
