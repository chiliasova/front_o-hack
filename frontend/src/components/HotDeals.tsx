import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { HotDeal } from '../api/types';
import { formatDateShort, formatRub } from '../lib/format';
import { SmartImg, Spinner, Stars } from './ui';

export function HotDeals({ onPick }: { onPick: (deal: HotDeal) => void }) {
  const [deals, setDeals] = useState<HotDeal[] | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    setDeals(null);
    api
      .hotDeals()
      .then(setDeals)
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить предложения'));
  };
  useEffect(load, []);

  return (
    <section className="page">
      <div className="page__head">
        <h1>🔥 Горящие туры</h1>
        <p className="muted">Агент каждый час ищет падение цен и свободные номера. Нажмите на тур — он соберёт поездку целиком.</p>
      </div>

      {error && (
        <div className="hint hint--error">
          {error}{' '}
          <button className="link-btn" onClick={load}>
            Повторить
          </button>
        </div>
      )}
      {!deals && !error && (
        <div className="center">
          <Spinner />
        </div>
      )}

      <div className="deals">
        {deals?.map((d) => (
          <article key={d.id} className="deal">
            <div className="deal__photo">
              <SmartImg src={d.photo} alt={d.hotel_name} />
              <span className="deal__discount">−{d.discount_percent}%</span>
              <span className="deal__until">до {formatDateShort(d.valid_until)}</span>
            </div>
            <div className="deal__body">
              <div className="muted">📍 {d.destination}</div>
              <h3>{d.hotel_name}</h3>
              <Stars n={d.stars} />
              <p className="deal__reason">⏳ {d.reason}</p>
              <div className="deal__foot">
                <div>
                  <s className="muted">{formatRub(d.original_price)}</s>
                  <b className="deal__price">{formatRub(d.hot_price)}</b>
                </div>
                <button className="btn btn--hot" onClick={() => onPick(d)}>
                  Собрать тур
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
