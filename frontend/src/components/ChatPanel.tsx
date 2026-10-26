import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { TripPlan } from '../api/types';
import { formatDateShort, formatRub } from '../lib/format';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'error';
  text: string;
  plan?: TripPlan | null;
}

const THINKING = [
  'Агент анализирует запрос…',
  'Подбирает отели под ваши предпочтения…',
  'Сверяет рейсы и поезда…',
  'Проверяет стыковки и трансфер…',
  'Считает итоговую стоимость…',
];

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
    const t = setInterval(() => setStep((s) => Math.min(s + 1, THINKING.length - 1)), 650);
    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || loading) return;
    onSend(value);
    setText('');
  };

  return (
    <section className="chat">
      <div className="chat__list" ref={listRef}>
        <div className="msg msg--agent">
          <div className="msg__avatar">О!</div>
          <div className="msg__bubble">{greeting}</div>
        </div>

        {messages.map((m) => (
          <div key={m.id} className={`msg msg--${m.role}`}>
            {m.role !== 'user' && <div className="msg__avatar">{m.role === 'error' ? '!' : 'О!'}</div>}
            <div className="msg__bubble">
              {m.text}
              {m.plan && (
                <button
                  className={`plan-pill ${m.plan.id === activePlanId ? 'is-active' : ''}`}
                  onClick={() => onOpenPlan(m.plan!)}
                >
                  <span>📍 {m.plan.destination}</span>
                  <span>
                    {formatDateShort(m.plan.check_in)} – {formatDateShort(m.plan.check_out)}
                  </span>
                  <b>{formatRub(m.plan.pricing.total_price)}</b>
                  <span className="plan-pill__cta">{m.plan.id === activePlanId ? 'на холсте' : 'показать →'}</span>
                </button>
              )}
              {m.role === 'error' && (
                <button className="link-btn" onClick={onRetry}>
                  Повторить
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg msg--agent">
            <div className="msg__avatar msg__avatar--pulse">О!</div>
            <div className="msg__bubble msg__bubble--thinking">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
              <span key={step} className="thinking-text">
                {THINKING[step]}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="chat__bottom">
        {chips.length > 0 && (
          <div className="chips">
            {chips.map((c) => (
              <button key={c} className="chip" disabled={loading} onClick={() => onSend(c)}>
                {c}
              </button>
            ))}
          </div>
        )}
        <form className="composer" onSubmit={submit}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Опишите поездку одним запросом…"
            aria-label="Сообщение агенту"
          />
          <button className="btn btn--primary composer__send" disabled={!text.trim() || loading} aria-label="Отправить">
            ➤
          </button>
        </form>
      </div>
    </section>
  );
}
