import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { TripPlan } from '../api/types';
import { formatDateShort, formatRub } from '../lib/format';
import { Icon } from './Icon';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'error';
  text: string;
  plan?: TripPlan | null;
}

const STEPS = ['Разбираю запрос', 'Подбираю отели', 'Сверяю рейсы и поезда', 'Проверяю стыковки', 'Считаю итог'];

interface Props {
  messages: ChatMessage[];
  loading: boolean;
  chips: string[];
  activePlanId: string | null;
  greeting: string;
  onSend: (text: string) => void;
  onRetry: () => void;
  onOpenPlan: (plan: TripPlan) => void;
}

export function ChatPanel({ messages, loading, chips, activePlanId, greeting, onSend, onRetry, onOpenPlan }: Props) {
  const [text, setText] = useState('');
  const [step, setStep] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 520);
    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, step]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || loading) return;
    onSend(value);
    setText('');
  };

  return (
    <section className="chat">
      <div className="chat__status">
        <span className="live-dot" />
        Агент на связи
        <span className="chat__status-hint">ответ за ~3 секунды</span>
      </div>

      <div className="chat__list" ref={listRef}>
        <div className="msg msg--agent">
          <div className="msg__who">Агент</div>
          <p className="msg__text msg__text--lead">{greeting}</p>
        </div>

        {messages.map((m) => (
          <div key={m.id} className={`msg msg--${m.role}`}>
            {m.role !== 'user' && <div className="msg__who">{m.role === 'error' ? 'Ошибка' : 'Агент'}</div>}
            <p className="msg__text">{m.text}</p>
            {m.plan && (
              <button
                className={`plan-ticket ${m.plan.id === activePlanId ? 'is-active' : ''}`}
                onClick={() => onOpenPlan(m.plan!)}
              >
                <span className="plan-ticket__main">
                  <b>{m.plan.destination}</b>
                  <span>
                    {formatDateShort(m.plan.check_in)} — {formatDateShort(m.plan.check_out)} · {m.plan.hotel.name}
                  </span>
                </span>
                <span className="plan-ticket__stub">
                  <b>{formatRub(m.plan.pricing.total_price)}</b>
                  <span>{m.plan.id === activePlanId ? 'на холсте' : 'открыть'}</span>
                </span>
              </button>
            )}
            {m.role === 'error' && (
              <button className="text-btn" onClick={onRetry}>
                <Icon name="refresh" size={16} /> Повторить
              </button>
            )}
          </div>
        ))}

        {loading && (
          <div className="msg msg--agent">
            <div className="msg__who">Агент работает</div>
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s} className={i < step ? 'is-done' : i === step ? 'is-current' : ''}>
                  <span className="steps__mark">{i < step ? <Icon name="check" size={12} /> : null}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="chat__bottom">
        {chips.length > 0 && (
          <div className="suggest">
            {chips.map((c) => (
              <button key={c} className="suggest__item" disabled={loading} onClick={() => onSend(c)}>
                {c}
                <Icon name="arrowUpRight" size={14} />
              </button>
            ))}
          </div>
        )}
        <form className="composer" onSubmit={submit}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Куда, когда, с кем и на какой бюджет?"
            aria-label="Сообщение агенту"
          />
          <button className="composer__send" disabled={!text.trim() || loading} aria-label="Отправить">
            <Icon name="arrowUp" size={20} />
          </button>
        </form>
      </div>
    </section>
  );
}
