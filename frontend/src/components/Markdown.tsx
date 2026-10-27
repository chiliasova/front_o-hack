import { Fragment, type ReactNode } from 'react';

// Небольшой разбор markdown из ответов агента: абзацы, заголовки, списки, **жирный**, *курсив*, `код`.
// Без dangerouslySetInnerHTML — текст агента никогда не попадает в DOM как HTML.

const INLINE = /(\*\*|__)(.+?)\1|\*(?!\s)(.+?)(?<!\s)\*|`([^`]+)`/g;

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const k = `${key}-${i++}`;
    if (m[2] !== undefined) out.push(<strong key={k}>{inline(m[2], k)}</strong>);
    else if (m[3] !== undefined) out.push(<em key={k}>{inline(m[3], k)}</em>);
    else out.push(<code key={k}>{m[4]}</code>);
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  // одиночные звёздочки, которые не сложились в разметку, не показываем
  return out.map((n) => (typeof n === 'string' ? n.replace(/\*{1,3}/g, '') : n));
}

type Block =
  | { type: 'p'; lines: string[] }
  | { type: 'h'; text: string }
  | { type: 'ul' | 'ol'; items: string[] };

const BULLET = /^\s*(?:[-*•–]|\d+[.)])\s+/;

function parse(text: string): Block[] {
  const blocks: Block[] = [];
  const push = (b: Block) => blocks.push(b);
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    const last = blocks[blocks.length - 1];
    if (!line.trim()) {
      blocks.push({ type: 'p', lines: [] });
      continue;
    }
    const h = line.match(/^\s*#{1,6}\s+(.*)$/);
    if (h) {
      push({ type: 'h', text: h[1] });
      continue;
    }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) continue; // горизонтальная линия
    if (BULLET.test(line)) {
      const type = /^\s*\d/.test(line) ? 'ol' : 'ul';
      const item = line.replace(BULLET, '');
      if (last && last.type === type) last.items.push(item);
      else push({ type, items: [item] });
      continue;
    }
    if (last && last.type === 'p') last.lines.push(line.trim());
    else push({ type: 'p', lines: [line.trim()] });
  }
  return blocks.filter((b) => b.type !== 'p' || b.lines.length > 0);
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = parse(text);
  return (
    <div className={`md ${className ?? ''}`}>
      {blocks.map((b, i) => {
        const k = String(i);
        if (b.type === 'h') return <h4 key={k}>{inline(b.text, k)}</h4>;
        if (b.type !== 'p') {
          const items = b.items.map((it, j) => <li key={j}>{inline(it, `${k}-${j}`)}</li>);
          return b.type === 'ol' ? <ol key={k}>{items}</ol> : <ul key={k}>{items}</ul>;
        }
        return (
          <p key={k}>
            {b.lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l, `${k}-${j}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** Текст без разметки — для коротких подписей (история, заголовки). */
export const plainText = (text: string) =>
  text
    .replace(/[*`#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
