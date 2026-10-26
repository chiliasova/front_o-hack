import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { HotDeal } from '../api/types';
import { formatDateShort, formatRub } from '../lib/format';
import { Icon } from './Icon';
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
      <header className="page__head">
        <div className="kicker">Обновляется каждый час</div>
        <h1 className="display">
          Горящие <em>сейчас</em>
        </h1>
        <p>Агент следит за падением цен и освободившимися номерами. Выберите предложение — он соберёт к нему дорогу и трансфер.</p>
      </header>

      {error && (
        <div className="notice notice--error">
          {error}
          <button className="text-btn" onClick={load}>
            <Icon name="refresh" size={16} /> Повторить
          </button>
        </div>
      )}
      {!deals && !error && (
        <div className="center">
          <Spinner />
        </div>
      )}

      <div className="deals">
        {deals?.map((d, i) => (
          <article key={d.id} className={`deal ${i === 0 ? 'deal--feature' : ''}`}>
            <div className="deal__photo">
              <SmartImg src={d.photo} alt={d.hotel_name} label={d.destination} />
              <span className="deal__stamp">
                <b>−{d.discount_percent}%</b>
                <small>до {formatDateShort(d.valid_until)}</small>
              </span>
            </div>
            <div className="deal__body">
              <div className="deal__place">
                <span className="kicker">{d.destination}</span>
                <Stars n={d.stars} />
              </div>
              <h3>{d.hotel_name}</h3>
              <p className="deal__reason">{d.reason}</p>
              <div className="deal__foot">
                <div className="deal__prices">
                  <s>{formatRub(d.original_price)}</s>
                  <b>{formatRub(d.hot_price)}</b>
                </div>
                <button className="btn btn--ink" onClick={() => onPick(d)}>
                  Собрать тур <Icon name="arrowRight" size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
