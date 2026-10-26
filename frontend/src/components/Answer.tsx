import { useEffect, useState, type ReactNode } from 'react';
import type { TripPlan, UserProfile } from '../api/types';
import { formatDateShort, formatRub, nightsBetween, pluralize } from '../lib/format';
import { Icon } from './Icon';

export const THINK_STEPS = ['разбираю запрос', 'подбираю отели', 'сверяю рейсы и поезда', 'проверяю стыковки', 'считаю итог'];

export function useThinking(loading: boolean) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, THINK_STEPS.length - 1)), 520);
    return () => clearInterval(t);
  }, [loading]);
  return THINK_STEPS[step];
}

const addMinutes = (hhmm: string, min: number) => {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const total = h * 60 + m + min;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const city = (destination: string) => destination.split(',')[0].trim();

function Chip({ children, kind, onClick, title }: { children: ReactNode; kind?: string; onClick?: () => void; title?: string }) {
  return (
    <button type="button" className={`chip ${kind ? `chip--${kind}` : ''}`} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

function Sup({ n, onHover }: { n: number; onHover: (n: number | null) => void }) {
  return (
    <sup onMouseEnter={() => onHover(n)} onMouseLeave={() => onHover(null)}>
      {n}
    </sup>
  );
}

/** Вся поездка одной фразой: рейс, трансфер, отель, заселение, даты и цена — кликабельные вставки. */
export function TripSentence({
  plan,
  profile,
  onDetails,
  onHover,
}: {
  plan: TripPlan;
  profile: UserProfile | null;
  onDetails: () => void;
  onHover: (n: number | null) => void;
}) {
  const { transport, transfer, hotel, pricing, timeline_validation: tv } = plan;
  const isTrain = transport?.type === 'train';
  const nights = nightsBetween(plan.check_in, plan.check_out);
  const atHotel = transport && transfer ? addMinutes(transport.arrival, transfer.duration_min) : null;
  const petName = profile?.preferences.has_pets ? profile.preferences.pet_details?.match(/\((.+)\)/)?.[1] ?? 'питомец' : null;
  const petOk = petName && hotel.amenities.includes('pet_friendly');
  const booked = plan.status === 'booked';

  const hotelChip = (
    <Chip onClick={onDetails} title="Подробнее об отеле">
      {hotel.name} <span className="chip__dim">★ {hotel.rating.toFixed(1)}</span>
    </Chip>
  );

  return (
    <p className="sentence">
      {transport ? (
        <>
          {isTrain ? 'Едете ' : 'Летите '}
          <Chip onClick={onDetails} title="Подробнее о дороге">
            <Icon name={isTrain ? 'train' : 'plane'} size={16} /> {transport.carrier} · {transport.departure}
          </Chip>
          , в {transport.arrival} вы {isTrain ? 'на вокзале' : 'в аэропорту'}
          {transfer ? (
            <>
              , через{' '}
              <Chip onClick={onDetails} title={transfer.type}>
                <Icon name="car" size={16} /> {transfer.duration_min} мин
              </Chip>{' '}
              — уже в {hotelChip}
            </>
          ) : (
            <>, дальше — {hotelChip}</>
          )}
          <Sup n={1} onHover={onHover} />.{' '}
        </>
      ) : (
        <>
          Живёте в {hotelChip}
          <Sup n={1} onHover={onHover} />, {city(plan.destination)}.{' '}
        </>
      )}
      {atHotel ? <>В отеле в {atHotel}, заселение </> : <>Заселение </>}
      <Chip kind={tv.is_valid ? 'ok' : 'warn'}>
        <Icon name={tv.is_valid ? 'check' : 'alert'} size={15} /> {tv.is_valid ? 'без ожидания' : 'есть нюанс'}
      </Chip>
      <Sup n={2} onHover={onHover} />
      {petOk ? <>, {petName} едет с вами</> : null}.{' '}
      <Chip>
        <Icon name="calendar" size={15} /> {formatDateShort(plan.check_in)} — {formatDateShort(plan.check_out)}
      </Chip>
      , {nights} {pluralize(nights, 'ночь', 'ночи', 'ночей')}, {plan.guests} {pluralize(plan.guests, 'гость', 'гостя', 'гостей')}
      <Sup n={3} onHover={onHover} />. Всё вместе{' '}
      <Chip kind={booked ? 'paid' : 'price'} onClick={onDetails} title="Из чего складывается цена">
        {formatRub(pricing.total_price)}
        {booked && <span className="chip__dim"> · оплачено</span>}
      </Chip>
      <Sup n={4} onHover={onHover} />
    </p>
  );
}

export function Notes({ plan, hot }: { plan: TripPlan; hot: number | null }) {
  const { explainability: ex, timeline_validation: tv } = plan;
  const notes = [
    { n: 1, title: 'Почему он', text: ex.why_recommended },
    { n: 2, title: tv.is_valid ? 'Стыковки проверены' : 'Стыковка', text: tv.status_text.replace(/->/g, '→'), cls: tv.is_valid ? 'ok' : 'warn' },
    { n: 3, title: 'Компромисс', text: ex.trade_offs },
    { n: 4, title: 'Что учесть', text: ex.risks, cls: 'risk' },
  ].filter((x) => x.text);

  return (
    <aside className="notes" aria-label="Пояснения агента">
      {notes.map((x) => (
        <div key={x.n} className={`note ${x.cls ? `note--${x.cls}` : ''} ${hot === x.n ? 'is-hot' : ''}`}>
          <b>
            <span className="note__n">{x.n}</span> {x.title}
          </b>
          <p>{x.text}</p>
        </div>
      ))}
    </aside>
  );
}
