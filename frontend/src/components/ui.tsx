import { useEffect, useState, type ReactNode } from 'react';

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: ReactNode;
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
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

/** Картинка с запасным градиентом, если фото не загрузилось. */
export function SmartImg({ src, alt, className, fallback = '🏨' }: { src?: string; alt: string; className?: string; fallback?: string }) {
  const [failed, setFailed] = useState(!src);
  useEffect(() => setFailed(!src), [src]);
  if (failed) {
    return (
      <div className={`img-fallback ${className ?? ''}`} aria-label={alt}>
        <span>{fallback}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} звёзд`}>
      {'★'.repeat(n)}
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
