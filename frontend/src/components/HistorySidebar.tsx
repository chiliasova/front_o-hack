import { useEffect } from 'react';
import type { HistoryItem } from '../lib/history';
import { formatRub } from '../lib/format';
import { Painted } from './Ask';
import { Icon } from './Icon';

interface Props {
  items: HistoryItem[];
  activeSessionId: string;
  onPick: (item: HistoryItem) => void;
  onNew: () => void;
  onClear: () => void;
  onClose: () => void;
}

const isToday = (ts: number) => new Date(ts).toDateString() === new Date().toDateString();

/** Выдвижная панель слева: прошлые запросы, к любому можно вернуться и продолжить. */
export function HistorySidebar({ items, activeSessionId, onPick, onNew, onClear, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const today = items.filter((x) => isToday(x.timestamp));
  const earlier = items.filter((x) => !isToday(x.timestamp));

  const group = (title: string, list: HistoryItem[]) =>
    list.length > 0 && (
      <section className="hist__group">
        <div className="label label--plain">{title}</div>
        {list.map((x) => (
          <button
            key={x.sessionId}
            className={`hist__item ${x.sessionId === activeSessionId ? 'is-on' : ''}`}
            onClick={() => onPick(x)}
          >
            <span className="hist__req">
              <Painted text={x.requestText} />
              {x.refinements.length > 0 && <span className="hist__more"> + {x.refinements.join(', ')}</span>}
            </span>
            {x.hotelName ? (
              <span className="hist__meta">
                {x.hotelName}
                {x.dates ? ` · ${x.dates}` : ''}
                {x.totalPrice ? <b>{formatRub(x.totalPrice)}</b> : null}
                {x.answer.plan?.status === 'booked' && <span className="stamp stamp--paid">оплачено</span>}
              </span>
            ) : (
              <span className="hist__meta">без готовой поездки</span>
            )}
          </button>
        ))}
      </section>
    );

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="История запросов">
        <header className="drawer__head">
          <h2>
            <Icon name="history" size={20} /> История запросов
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <Icon name="close" />
          </button>
        </header>
        <button className="btn btn--light btn--sm btn--block" onClick={onNew}>
          <Icon name="plus" size={16} /> Новый запрос
        </button>
        <div className="drawer__body">
          {items.length === 0 ? (
            <p className="hist__empty">
              Здесь появятся ваши запросы. Вернуться к любому можно в один клик — агент продолжит с того же места.
            </p>
          ) : (
            <>
              {group('Сегодня', today)}
              {group('Ранее', earlier)}
            </>
          )}
        </div>
        {items.length > 0 && (
          <button className="link-btn link-btn--dim drawer__clear" onClick={onClear}>
            <Icon name="trash" size={14} /> Очистить историю
          </button>
        )}
      </aside>
    </div>
  );
}
