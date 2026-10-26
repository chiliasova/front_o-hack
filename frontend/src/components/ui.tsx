import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

export function Modal({
  title,
  kicker,
  onClose,
  children,
  wide,
}: {
  title: ReactNode;
  kicker?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal--wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal__head">
          <div>
            {kicker && <div className="kicker">{kicker}</div>}
            <h2>{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

/** Фото с запасным вариантом-«открыткой», если картинка не загрузилась. */
export function SmartImg({ src, alt, className, label }: { src?: string; alt: string; className?: string; label?: string }) {
  const [failed, setFailed] = useState(!src);
  useEffect(() => setFailed(!src), [src]);
  if (failed) {
    const letter = (label ?? alt).replace(/[^A-Za-zА-Яа-яЁё]/g, '').charAt(0) || 'О';
    return (
      <div className={`postcard ${className ?? ''}`} role="img" aria-label={alt}>
        <svg className="postcard__waves" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M0 ${20 + i * 12} C 40 ${10 + i * 12}, 60 ${32 + i * 12}, 100 ${20 + i * 12} S 160 ${8 + i * 12}, 200 ${22 + i * 12}`}
            />
          ))}
        </svg>
        <span className="postcard__letter">{letter}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} звёзд`}>
      {Array.from({ length: n }, (_, i) => (
        <Icon key={i} name="star" size={12} />
      ))}
    </span>
  );
}

export function Spinner({ small }: { small?: boolean }) {
  return <span className={`spinner ${small ? 'spinner--sm' : ''}`} aria-hidden />;
}

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [text, onDone]);
  return <div className="toast">{text}</div>;
}
