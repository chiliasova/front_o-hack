import { useEffect, useState, type FormEvent } from 'react';
import type { TripPlan, UserProfile } from '../api/types';
import { formatRub } from '../lib/format';
import { TripSentence, Notes, useThinking } from './Answer';
import { AskInput, AskSentence, Painted } from './Ask';
import { Icon } from './Icon';
import { Markdown } from './Markdown';

export interface Answer {
  id: string;
  reply: string;
  plan: TripPlan | null;
}

interface Props {
  profile: UserProfile | null;
  greeting: string;
  examples: string[];
  request: string;
  refinements: string[];
  loading: boolean;
  error: string | null;
  answer: Answer | null;
  variants: Answer[];
  suggestions: string[];
  onAsk: (text: string) => void;
  onRefine: (text: string) => void;
  onRetry: () => void;
  onVariant: (a: Answer) => void;
  onDetails: () => void;
  onCheckout: () => void;
  onInquire: () => void;
  onOpenTrips: () => void;
}

const LETTERS = 'АБВГДЕЖ';

// Длинный структурированный ответ (списки, несколько абзацев) набираем мельче, чем короткую фразу.
const isLong = (text: string) => text.length > 280 || /\n\s*([-*•]|\d+[.)])\s/.test(text);

export function Planner(p: Props) {
  const [editing, setEditing] = useState(false);
  const [hot, setHot] = useState<number | null>(null);
  const [more, setMore] = useState('');
  // Правки смысловых слов копятся в черновике; агент получает фразу только по кнопке.
  const [draft, setDraft] = useState<string | null>(null);
  useEffect(() => setDraft(null), [p.request]);
  const shown = draft ?? p.request;
  const dirty = draft !== null && draft !== p.request;
  const thinking = useThinking(p.loading);
  const plan = p.answer?.plan ?? null;
  const booked = plan?.status === 'booked';

  const refine = (e: FormEvent) => {
    e.preventDefault();
    const v = more.trim();
    if (!v || p.loading) return;
    p.onRefine(v);
    setMore('');
  };

  if (!p.request) {
    return (
      <main className="desk desk--empty">
        <section className="ask-zone">
          <div className="label">{p.greeting}</div>
          <AskInput placeholder="Хочу в Сочи на выходные с ребёнком до 70 000 ₽" autoFocus onSubmit={p.onAsk} />
          <div className="examples">
            <span className="label label--plain">или начните с одной из фраз</span>
            {p.examples.map((e) => (
              <button key={e} className="example" onClick={() => p.onAsk(e)}>
                <span>
                  <Painted text={e} />
                </span>
                <Icon name="arrowRight" size={20} />
              </button>
            ))}
          </div>
          <ol className="legend">
            <li className="tok--place">куда</li>
            <li className="tok--time">когда</li>
            <li className="tok--who">с кем</li>
            <li className="tok--money">бюджет</li>
            <li className="legend__note">агент поймёт и без них, но с ними точнее</li>
          </ol>
        </section>
      </main>
    );
  }

  return (
    <main className={`desk ${p.loading ? 'is-loading' : ''} ${dirty ? 'is-stale' : ''} ${plan ? 'has-plan' : ''}`}>
      <section className="ask-zone">
        <div className="label-row">
          <span className="label">Ваш запрос — цветные слова можно поменять</span>
          <span className={`pulse ${p.loading ? 'is-on' : ''}`}>
            {(p.loading || plan) && <i className={plan && !plan.timeline_validation.is_valid && !p.loading ? 'is-warn' : ''} />}
            {p.loading
              ? `агент ${thinking}…`
              : dirty
                ? 'ждёт пересборки'
                : booked
                ? 'поездка оплачена'
                : plan
                  ? plan.timeline_validation.is_valid
                    ? 'всё сходится'
                    : 'есть нюанс со стыковкой'
                  : ''}
          </span>
        </div>
        {editing ? (
          <AskInput
            initial={shown}
            placeholder="Куда, когда, с кем и на какой бюджет?"
            autoFocus
            disabled={p.loading}
            onSubmit={(t) => {
              setEditing(false);
              p.onAsk(t);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <AskSentence
              text={shown}
              refinements={dirty ? [] : p.refinements}
              disabled={p.loading}
              onChange={setDraft}
              onEdit={() => setEditing(true)}
            />
            {dirty ? (
              <div className="draft-bar">
                <span>Запрос изменён. Поправьте всё, что нужно, и пересоберите поездку.</span>
                <div className="draft-bar__actions">
                  <button className="link-btn link-btn--dim" onClick={() => setDraft(null)}>
                    Вернуть как было
                  </button>
                  <button className="btn btn--light btn--sm" onClick={() => p.onAsk(draft!)}>
                    Пересобрать поездку <Icon name="arrowRight" size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <button className="link-btn link-btn--dim" onClick={() => setEditing(true)} disabled={p.loading}>
                <Icon name="pencil" size={14} /> переписать запрос целиком
              </button>
            )}
          </>
        )}
      </section>

      <section className="answer-zone">
        <div className="answer-main">
          <div className="label label--green">{plan ? 'Ответ агента — вся поездка одной фразой' : 'Ответ агента'}</div>

          {p.error ? (
            <div className="sentence sentence--error">
              <p>{p.error}</p>
              <button className="link-btn" onClick={p.onRetry}>
                <Icon name="refresh" size={16} /> Повторить
              </button>
            </div>
          ) : !p.answer ? (
            <p className="sentence sentence--ghost" aria-busy="true">
              <span />
              <span />
              <span />
            </p>
          ) : (
            <>
              {plan && p.answer.reply && <Markdown text={p.answer.reply} className="lead" />}
              {plan ? (
                <TripSentence plan={plan} profile={p.profile} onDetails={p.onDetails} onHover={setHot} />
              ) : (
                <Markdown text={p.answer.reply} className={`sentence ${isLong(p.answer.reply) ? 'sentence--long' : ''}`} />
              )}
            </>
          )}

          <form className="refine" onSubmit={refine}>
            <span className="refine__plus">+</span>
            <input
              value={more}
              onChange={(e) => setMore(e.target.value)}
              placeholder={plan ? 'уточнить: «найди дешевле», «хочу завтрак», «можно с собакой?»' : 'ответить агенту'}
              aria-label="Уточнить запрос"
              disabled={p.loading}
            />
            <button className="round-btn round-btn--sm" disabled={!more.trim() || p.loading} aria-label="Отправить уточнение">
              <Icon name="arrowRight" size={18} />
            </button>
          </form>
        </div>

        {plan && <Notes plan={plan} hot={hot} />}
      </section>

      <footer className="dock">
        <div className="dock__left">
          {p.variants.length > 0 && (
            <div className="variants" aria-label="Варианты">
              {p.variants.map((v, i) => (
                <button
                  key={v.id}
                  className={`variant ${v.id === p.answer?.id ? 'is-on' : ''}`}
                  onClick={() => p.onVariant(v)}
                  disabled={p.loading}
                  title={v.plan ? `${v.plan.hotel.name} · ${formatRub(v.plan.pricing.total_price)}` : ''}
                >
                  {LETTERS[i] ?? i + 1}
                </button>
              ))}
            </div>
          )}
          <div className="hints">
            {p.suggestions.map((s) => (
              <button key={s} className="hint" onClick={() => p.onRefine(s)} disabled={p.loading}>
                {s}
              </button>
            ))}
          </div>
        </div>
        {plan && (
          <div className="dock__right">
            <button className="link-btn link-btn--dim hide-sm" onClick={p.onDetails}>
              Подробнее
            </button>
            <button className="link-btn link-btn--dim hide-sm" onClick={p.onInquire}>
              Спросить у отеля
            </button>
            {booked ? (
              <button className="btn btn--light" onClick={p.onOpenTrips}>
                В мои поездки <Icon name="arrowRight" size={18} />
              </button>
            ) : (
              <button className="btn btn--light" onClick={p.onCheckout} disabled={p.loading || dirty}>
                Поехали <span className="btn__sum">{formatRub(plan.pricing.total_price)}</span>
                <Icon name="arrowRight" size={18} />
              </button>
            )}
          </div>
        )}
      </footer>
    </main>
  );
}
