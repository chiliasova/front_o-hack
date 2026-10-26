import { QRCodeSVG } from 'qrcode.react';
import { useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { PaymentMethod, TripPlan, UserProfile, Voucher } from '../api/types';
import { formatDateShort, formatNum, formatRub, nightsBetween, pluralize } from '../lib/format';
import { Modal, Spinner } from './ui';

interface Props {
  plan: TripPlan;
  profile: UserProfile | null;
  onClose: () => void;
  onBooked: (voucher: Voucher) => void;
  onOpenTrips: () => void;
}

export function CheckoutModal({ plan, profile, onClose, onBooked, onOpenTrips }: Props) {
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
      setError(err instanceof Error ? err.message : 'Не удалось провести оплату');
    } finally {
      setPaying(false);
    }
  };

  if (voucher) {
    return (
      <Modal title="Поездка оформлена 🎉" onClose={onClose}>
        <div className="voucher">
          <div className="voucher__top">
            <div>
              <div className="eyebrow">Ваучер бронирования</div>
              <div className="voucher__code">{voucher.booking_code}</div>
              <div className="voucher__hotel">{voucher.hotel_name}</div>
              <div className="muted">{voucher.dates}</div>
            </div>
            <div className="voucher__qr">
              <QRCodeSVG value={voucher.qr_code_data} size={132} level="M" />
            </div>
          </div>
          <div className="voucher__rows">
            <div>
              <span>Оплачено</span>
              <b>{formatRub(voucher.total_paid)}</b>
            </div>
            <div>
              <span>Начислим баллов «Банка снов»</span>
              <b className="text-success">+{formatNum(voucher.points_earned)}</b>
            </div>
          </div>
          <p className="muted small">Покажите QR-код на ресепшене. Копия ваучера отправлена на {email}.</p>
          <div className="row-actions">
            <button className="btn btn--ghost" onClick={() => window.print()}>
              🖨️ Распечатать
            </button>
            <button className="btn btn--primary" onClick={onOpenTrips}>
              Перейти в «Мои поездки»
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Оформление поездки" onClose={onClose}>
      <form className="checkout" onSubmit={pay}>
        <div className="estimate">
          <div className="estimate__title">
            Смета · {plan.destination}, {formatDateShort(plan.check_in)} – {formatDateShort(plan.check_out)}
          </div>
          <div className="estimate__row">
            <span>
              🏨 {plan.hotel.name}, {nights} {pluralize(nights, 'ночь', 'ночи', 'ночей')}
            </span>
            <span>{formatRub(pricing.hotel_total)}</span>
          </div>
          {plan.transport && pricing.transport_total > 0 && (
            <div className="estimate__row">
              <span>
                {plan.transport.type === 'train' ? '🚆' : '✈️'} {plan.transport.carrier} × {plan.guests}
              </span>
              <span>{formatRub(pricing.transport_total)}</span>
            </div>
          )}
          {plan.transfer && pricing.transfer_total > 0 && (
            <div className="estimate__row">
              <span>🚕 Трансфер «{plan.transfer.type}»</span>
              <span>{formatRub(pricing.transfer_total)}</span>
            </div>
          )}
          {points > 0 && (
            <div className="estimate__row text-success">
              <span>🌙 Баллы «Банка снов»</span>
              <span>−{formatRub(points)}</span>
            </div>
          )}
        </div>

        {availablePoints > 0 ? (
          <label className="toggle">
            <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
            <span className="toggle__track" />
            <span>
              Списать {formatNum(availablePoints)} баллов «Банка снов» (−{formatRub(availablePoints)})
            </span>
          </label>
        ) : (
          <div className="hint">🌙 Войдите в профиль, чтобы копить и списывать баллы «Банка снов»</div>
        )}


        <div className="fields">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя и фамилия" aria-label="Имя" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" aria-label="Телефон" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" />
        </div>

        <div className="pay-methods">
          {(
            [
              ['card', '💳 Картой'],
              ['sbp', '⚡ СБП'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={`pay-method ${method === value ? 'is-active' : ''}`}>
              <input type="radio" name="pay" value={value} checked={method === value} onChange={() => setMethod(value)} />
              {label}
            </label>
          ))}
        </div>

        {error && <div className="field-error">{error}</div>}

        <div className="checkout__total">
          <div>
            <small className="muted">К оплате</small>
            <div className="checkout__sum">
              {total !== pricing.total_price && <s>{formatRub(pricing.total_price)}</s>} <b>{formatRub(total)}</b>
            </div>
          </div>
          <button className="btn btn--primary btn--lg" disabled={paying}>
            {paying ? (
              <>
                <Spinner small /> Проводим оплату…
              </>
            ) : (
              `Оплатить ${method === 'sbp' ? 'через СБП' : 'картой'}`
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
