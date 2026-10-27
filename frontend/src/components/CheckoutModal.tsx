import { QRCodeSVG } from 'qrcode.react';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { PaymentMethod, TripPlan, UserProfile, Voucher } from '../api/types';
import { formatDateShort, formatNum, formatRub, nightsBetween, pluralize } from '../lib/format';
import { Icon } from './Icon';
import { Modal, Spinner } from './ui';

interface Props {
  plan: TripPlan;
  profile: UserProfile | null;
  onClose: () => void;
  onBooked: (voucher: Voucher) => void;
  onOpenTrips: () => void;
  /** Оплата доступна только после входа: бэкенд отвечает 401 гостю. */
  onNeedAuth: () => void;
}

export function CheckoutModal({ plan, profile, onClose, onBooked, onOpenTrips, onNeedAuth }: Props) {
  const { pricing } = plan;
  const nights = nightsBetween(plan.check_in, plan.check_out);
  const availablePoints = Math.min(profile?.loyalty_points ?? 0, pricing.total_price);

  const [usePoints, setUsePoints] = useState(availablePoints > 0);
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile ? '+7 999 123-45-67' : '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [voucher, setVoucher] = useState<Voucher | null>(null);

  const points = usePoints ? availablePoints : 0;
  const total = Math.max(0, pricing.total_price - points);

  const pay = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return onNeedAuth();
    if (!name.trim() || !phone.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Заполните имя, телефон и корректный email');
      return;
    }
    setError('');
    setPaying(true);
    try {
      const res = await api.book(
        plan.id,
        {
          use_loyalty_points: points,
          promo_code: '', // поле есть в спеке, промокоды не используем
          guest_name: name.trim(),
          guest_phone: phone.trim(),
          guest_email: email.trim(),
          payment_method: method,
        },
        profile?.id ?? null,
      );
      setVoucher(res.voucher);
      onBooked(res.voucher);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onNeedAuth();
      setError(err instanceof Error ? err.message : 'Не удалось провести оплату');
    } finally {
      setPaying(false);
    }
  };

  if (voucher) {
    return (
      <Modal kicker="Готово" title="Хорошей поездки!" onClose={onClose}>
        <div className="pass">
          <div className="pass__main">
            <div className="pass__brand">
              <span>
                О<em>!</em>дин запрос
              </span>
              <span className="kicker">ваучер бронирования</span>
            </div>
            <div className="pass__code mono">{voucher.booking_code}</div>
            <div className="pass__hotel">{voucher.hotel_name}</div>
            <div className="pass__grid">
              <div>
                <span className="kicker">Даты</span>
                <b className="mono">{voucher.dates}</b>
              </div>
              <div>
                <span className="kicker">Оплачено</span>
                <b className="mono">{formatRub(voucher.total_paid)}</b>
              </div>
              <div>
                <span className="kicker">Начислим</span>
                <b className="mono">+{formatNum(voucher.points_earned)}</b>
              </div>
            </div>
          </div>
          <div className="pass__stub">
            <QRCodeSVG value={voucher.qr_code_data} size={120} level="M" bgColor="transparent" fgColor="#16130f" />
            <span className="kicker">на ресепшене</span>
          </div>
        </div>
        <p className="fine">Копия ваучера отправлена на {email}. Покажите QR-код при заселении.</p>
        <div className="row-actions">
          <button className="btn btn--ghost" onClick={() => window.print()}>
            <Icon name="print" size={18} /> Распечатать
          </button>
          <button className="btn btn--ink" onClick={onOpenTrips}>
            Мои поездки <Icon name="arrowRight" size={18} />
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal kicker={`${plan.destination} · ${formatDateShort(plan.check_in)} — ${formatDateShort(plan.check_out)}`} title="Оформление" onClose={onClose}>
      <form className="checkout" onSubmit={pay}>
        <section className="receipt">
          <div className="receipt__row">
            <span>
              {plan.hotel.name}, {nights} {pluralize(nights, 'ночь', 'ночи', 'ночей')}
            </span>
            <i />
            <b>{formatRub(pricing.hotel_total)}</b>
          </div>
          {plan.transport && pricing.transport_total > 0 && (
            <div className="receipt__row">
              <span>
                {plan.transport.type === 'train' ? 'Поезд' : 'Перелёт'} × {plan.guests}
              </span>
              <i />
              <b>{formatRub(pricing.transport_total)}</b>
            </div>
          )}
          {plan.transfer && pricing.transfer_total > 0 && (
            <div className="receipt__row">
              <span>Трансфер, {plan.transfer.type.toLowerCase()}</span>
              <i />
              <b>{formatRub(pricing.transfer_total)}</b>
            </div>
          )}
          {points > 0 && (
            <div className="receipt__row receipt__row--minus">
              <span>Баллы «Банка снов»</span>
              <i />
              <b>−{formatRub(points)}</b>
            </div>
          )}
        </section>

        {availablePoints > 0 ? (
          <label className="switch">
            <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
            <span className="switch__track" />
            <span>
              Списать <b>{formatNum(availablePoints)}</b> баллов «Банка снов»
              <small>1 балл = 1 ₽</small>
            </span>
          </label>
        ) : (
          <p className="fine">
            <Icon name="moon" size={14} /> Войдите в профиль, чтобы копить и тратить баллы «Банка снов».
          </p>
        )}

        <fieldset className="fields">
          <legend className="kicker">Кто едет</legend>
          <label>
            <span>Имя и фамилия</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label>
            <span>Телефон</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </label>
          <label>
            <span>Email для ваучера</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
        </fieldset>

        <fieldset>
          <legend className="kicker">Оплата</legend>
          <div className="segmented">
          {(
            [
              ['card', 'Картой'],
              ['sbp', 'Через СБП'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={method === value ? 'is-active' : ''}>
              <input type="radio" name="pay" value={value} checked={method === value} onChange={() => setMethod(value)} />
              {label}
            </label>
          ))}
          </div>
        </fieldset>

        {error && <div className="field-error">{error}</div>}

        {!profile ? (
          <button type="button" className="btn btn--ink btn--block" onClick={onNeedAuth}>
            <Icon name="user" size={18} /> Войдите, чтобы оплатить
          </button>
        ) : (
        <button className="btn btn--ink btn--block" disabled={paying}>
          {paying ? (
            <>
              <Spinner small /> Проводим оплату…
            </>
          ) : (
            <>
              Оплатить {formatRub(total)}
              {total !== pricing.total_price && <s>{formatRub(pricing.total_price)}</s>}
            </>
          )}
        </button>
        )}
      </form>
    </Modal>
  );
}
