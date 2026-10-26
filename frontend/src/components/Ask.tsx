import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  KIND_ADD,
  KIND_LABEL,
  OPTIONS,
  appendToken,
  missingKinds,
  replaceSegment,
  tokenize,
  type Segment,
  type TokenKind,
} from '../lib/phrase';
import { Icon } from './Icon';

/** Запрос, раскрашенный по смыслу. Только для показа (примеры, история). */
export function Painted({ text }: { text: string }) {
  return (
    <>
      {tokenize(text).map((s) =>
        s.kind ? (
          <span key={s.start} className={`tok tok--${s.kind} tok--static`}>
            {s.text}
          </span>
        ) : (
          <span key={s.start}>{s.text}</span>
        ),
      )}
    </>
  );
}

/** Большое поле ввода, которое выглядит как сам запрос. */
export function AskInput({
  initial = '',
  placeholder,
  disabled,
  autoFocus,
  onSubmit,
  onCancel,
}: {
  initial?: string;
  placeholder: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmit: (text: string) => void;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    if (!autoFocus) return;
    const el = ref.current;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  }, [autoFocus]);

  const submit = () => {
    const v = value.trim();
    if (v && !disabled) onSubmit(v);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape') onCancel?.();
  };

  return (
    <div className="ask-input">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        aria-label="Ваш запрос"
      />
      <div className="ask-input__bar">
        <span className="ask-input__hint">
          <kbd>Enter</kbd> — собрать поездку{onCancel ? ', Esc — отмена' : ''}
        </span>
        <div className="ask-input__actions">
          {onCancel && (
            <button type="button" className="link-btn" onClick={onCancel}>
              Отмена
            </button>
          )}
          <button type="button" className="round-btn" disabled={!value.trim() || disabled} onClick={submit} aria-label="Собрать поездку">
            <Icon name="arrowRight" size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

type Open = { seg: Segment } | { add: TokenKind } | null;

/** Запрос-конструктор: смысловые слова кликабельны, остальной текст правится целиком. */
export function AskSentence({
  text,
  refinements,
  disabled,
  onChange,
  onEdit,
}: {
  text: string;
  refinements: string[];
  disabled?: boolean;
  onChange: (next: string) => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState<Open>(null);
  const rootRef = useRef<HTMLHeadingElement>(null);
  const segments = tokenize(text);
  const missing = missingKinds(segments);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const esc = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  useEffect(() => setOpen(null), [text]);

  const pick = (value: string | null) => {
    if (!open) return;
    const next = 'seg' in open ? replaceSegment(text, open.seg, value) : value ? appendToken(text, value) : text;
    setOpen(null);
    if (next && next !== text) onChange(next);
  };

  const popover = (kind: TokenKind, current?: string) => (
    <span className="pop" role="listbox" onMouseDown={(e) => e.stopPropagation()}>
      <span className="pop__head">{KIND_LABEL[kind]}</span>
      {OPTIONS[kind].map((o) => {
        const sel = current?.toLowerCase() === o.text.toLowerCase();
        return (
          <button type="button" key={o.text} className={`pop__row ${sel ? 'is-sel' : ''}`} onClick={() => pick(o.text)}>
            <span>
              {o.text}
              {o.hint && <small> · {o.hint}</small>}
            </span>
            <span className="pop__chk">{sel ? <Icon name="check" size={12} /> : null}</span>
          </button>
        );
      })}
      {current && kind !== 'place' && (
        <button type="button" className="pop__row pop__row--remove" onClick={() => pick(null)}>
          <span>Убрать из запроса</span>
        </button>
      )}
    </span>
  );

  return (
    <h1 className={`ask ${disabled ? 'is-busy' : ''}`} ref={rootRef}>
      {segments.map((s) =>
        s.kind ? (
          <span key={s.start} className="tok-wrap">
            <button
              type="button"
              className={`tok tok--${s.kind} ${open && 'seg' in open && open.seg.start === s.start ? 'is-open' : ''}`}
              disabled={disabled}
              onClick={() => setOpen(open && 'seg' in open && open.seg.start === s.start ? null : { seg: s })}
              title={`${KIND_LABEL[s.kind]}: изменить`}
            >
              {s.text}
            </button>
            {open && 'seg' in open && open.seg.start === s.start && popover(s.kind, s.text)}
          </span>
        ) : (
          <span key={s.start} className="ask__plain" onClick={() => !disabled && onEdit()}>
            {s.text}
          </span>
        ),
      )}
      {refinements.map((r, i) => (
        <span key={i} className="ask__more">
          <span className="ask__plus">+</span>
          {r}
        </span>
      ))}
      {missing.map((k) => (
        <span key={k} className="tok-wrap">
          <button
            type="button"
            className={`tok tok--add tok--${k} ${open && 'add' in open && open.add === k ? 'is-open' : ''}`}
            disabled={disabled}
            onClick={() => setOpen(open && 'add' in open && open.add === k ? null : { add: k })}
          >
            + {KIND_ADD[k]}
          </button>
          {open && 'add' in open && open.add === k && popover(k)}
        </span>
      ))}
    </h1>
  );
}
