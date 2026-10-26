import { useState } from 'react';
import type { TripPlan } from '../api/types';
import { amenity, formatDateShort, formatNum, formatRub, nightsBetween, pluralize } from '../lib/format';
import { Icon } from './Icon';
import { Modal, SmartImg, Stars } from './ui';

interface Props {
  plan: TripPlan;
  onClose: () => void;
  onInquire: () => void;
  onCheckout: () => void;
}

const city = (destination: string) => destination.split(',')[0].trim();

/** Всё, что не поместилось во фразу: фото, удобства, билеты и из чего складывается цена. */
export function TripDetails({ plan, onClose, onInquire, onCheckout }: Props) {
  const { hotel, transport, transfer, pricing, timeline_validation: tv } = plan;
  const [photo, setPhoto] = useState(0);
  const photos = hotel.photos.length ? hotel.photos : [''];
  const nights = nightsBetween(plan.check_in, plan.check_out);
  const isTrain = transport?.type === 'train';
  const booked = plan.status === 'booked';

  return (
    <Modal kicker={`${plan.destination} · ${formatDateShort(plan.check_in)} — ${formatDateShort(plan.check_out)}`} title={hotel.name} onClose={onClose} wide>
      <div className="details">
        <div className="details__gallery">
          <SmartImg src={photos[photo]} alt={hotel.name} label={city(plan.destination)} className="details__img" />
          {photos.length > 1 && (
            <div className="details__thumbs">
              {photos.map((p, i) => (
                <button key={p + i} className={i === photo ? 'is-active' : ''} onClick={() => setPhoto(i)} aria-label={`Фото ${i + 1}`} />
              ))}
            </div>
          )}
        </div>

        <div className="details__info">
          <div className="details__meta">
            <span className="score">{hotel.rating.toFixed(1)}</span>
            <Stars n={hotel.stars} />
            <span className="dim">
              <Icon name="pin" size={14} /> {hotel.address}
            </span>
          </div>
          <ul className="tags">
            {hotel.amenities.map((a) => {
              const { icon, label } = amenity(a);
              return (
                <li key={a} className={a === 'pet_friendly' ? 'is-accent' : ''}>
                  <Icon name={icon} size={15} /> {label}
                </li>
              );
            })}
          </ul>
          <p className="dim small">
            <Icon name="shield" size={14} /> {hotel.cancellation_policy} · {formatRub(hotel.price_per_night)} за ночь
          </p>
          <button className="link-btn" onClick={onInquire}>
            <Icon name="chat" size={16} /> Спросить у отеля
          </button>
        </div>
      </div>

      {transport && (
        <div className="leg">
          <span className="label">{isTrain ? 'Поезд' : 'Перелёт'}</span>
          <div className="leg__row">
            <b className="mono">{transport.departure}</b>
            <span className="leg__line">
              <Icon name={isTrain ? 'train' : 'plane'} size={16} />
            </span>
            <b className="mono">{transport.arrival}</b>
            <span className="leg__what">
              {transport.carrier}
              <small>
                {transport.baggage ? 'багаж включён' : 'только ручная кладь'} · {formatRub(transport.price)} за человека
              </small>
            </span>
          </div>
          {transfer && (
            <div className="leg__row">
              <b className="mono">{transport.arrival}</b>
              <span className="leg__line">
                <Icon name="car" size={16} />
              </span>
              <b className="mono">+{transfer.duration_min} мин</b>
              <span className="leg__what">
                {transfer.type}
                <small>{formatRub(transfer.price)} за машину</small>
              </span>
            </div>
          )}
          <p className={`leg__check ${tv.is_valid ? 'is-ok' : 'is-warn'}`}>
            <Icon name={tv.is_valid ? 'check' : 'alert'} size={15} /> {tv.status_text.replace(/->/g, '→')}
          </p>
        </div>
      )}

      <div className="bill">
        <div className="bill__row">
          <span>
            Отель, {nights} {pluralize(nights, 'ночь', 'ночи', 'ночей')}
          </span>
          <i />
          <b>{formatRub(pricing.hotel_total)}</b>
        </div>
        {pricing.transport_total > 0 && (
          <div className="bill__row">
            <span>
              {isTrain ? 'Поезд' : 'Перелёт'} × {plan.guests}
            </span>
            <i />
            <b>{formatRub(pricing.transport_total)}</b>
          </div>
        )}
        {pricing.transfer_total > 0 && (
          <div className="bill__row">
            <span>Трансфер</span>
            <i />
            <b>{formatRub(pricing.transfer_total)}</b>
          </div>
        )}
        <div className="bill__row bill__row--total">
          <span>Всё вместе</span>
          <i />
          <b>{formatRub(pricing.total_price)}</b>
        </div>
        {pricing.cashback_will_earn > 0 && (
          <p className="dim small">
            <Icon name="moon" size={14} /> После поездки начислим {formatNum(pricing.cashback_will_earn)} баллов «Банка снов»
          </p>
        )}
      </div>

      {!booked && (
        <button className="btn btn--light btn--block" onClick={onCheckout}>
          Поехали · {formatRub(pricing.total_price)} <Icon name="arrowRight" size={18} />
        </button>
      )}
    </Modal>
  );
}
