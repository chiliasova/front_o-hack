// Разбор запроса на «смысловые слова»: куда, когда, с кем, бюджет.
// Найденные куски подсвечиваются в предложении, и каждый можно заменить из списка.

export type TokenKind = 'place' | 'time' | 'who' | 'money';

export interface Segment {
  text: string;
  kind?: TokenKind;
  start: number;
  end: number;
}

const L = '(?<![а-яёa-z])'; // начало слова для кириллицы (\b с ней не работает)
const R = '(?![а-яёa-z])';

const PLACES =
  'сочи|адлер[а-яё]*|красн[а-яё]* полян[а-яё]*|питер[а-яё]*|петербург[а-яё]*|санкт[‑-]петербург[а-яё]*|спб|рим[а-яё]*|итали[а-яё]*|карели[а-яё]*|хургад[а-яё]*|египет|казан[а-яё]*|калининград[а-яё]*|алта[а-яё]*|европ[а-яё]*|турци[а-яё]*|москв[а-яё]*';

const RULES: { kind: TokenKind; re: string }[] = [
  {
    kind: 'place',
    re: `(?:(?:в|во|на|к)\\s+)?(?:${PLACES})|к\\s+т[её]пл[а-яё]*\\s+мор[а-яё]*|на\\s+мор[а-яё]*`,
  },
  {
    kind: 'time',
    re: 'на\\s+(?:выходн[а-яё]*|майск[а-яё]*|новогодн[а-яё]*|недел[а-яё]*|\\d+\\s+(?:дн[а-яё]*|дня|ноч[а-яё]*|недел[а-яё]*))|в\\s+(?:январ|феврал|март|апрел|ма|июн|июл|август|сентябр|октябр|ноябр|декабр)е|летом|зимой|осенью|весной|завтра|сегодня',
  },
  {
    kind: 'who',
    re: 'с\\s+(?:реб[её]нк[а-яё]*|дет[а-яё]*|собак[а-яё]*|питомц[а-яё]*|корги|семь[её][а-яё]*|женой|мужем|друзьями|подругой|родителями)(?:\\s+и\\s+(?:собак[а-яё]*|корги|реб[её]нк[а-яё]*|дет[а-яё]*|питомц[а-яё]*))?|вдво[её]м|втро[её]м|одн[аой][а-яё]*',
  },
  {
    kind: 'money',
    re: '(?:до|за)\\s+\\d[\\d\\s]*(?:к|k|тыс\\.?|000)?(?:\\s*(?:₽|руб[а-яё]*|р\\.))?',
  },
];

const RE = new RegExp(RULES.map((r) => `${L}(${r.re})${R}`).join('|'), 'giu');

export function tokenize(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(RE)) {
    const groupIdx = m.slice(1).findIndex((g) => g !== undefined);
    if (groupIdx < 0 || m.index === undefined) continue;
    const raw = m[0];
    const trimmed = raw.replace(/\s+$/, '');
    const start = m.index;
    const end = start + trimmed.length;
    if (start > last) out.push({ text: text.slice(last, start), start: last, end: start });
    out.push({ text: trimmed, kind: RULES[groupIdx].kind, start, end });
    last = end;
  }
  if (last < text.length) out.push({ text: text.slice(last), start: last, end: text.length });
  return out;
}

export const KIND_LABEL: Record<TokenKind, string> = {
  place: 'Куда',
  time: 'Когда',
  who: 'С кем',
  money: 'Бюджет',
};

/** Что дописать, если в запросе этого нет. */
export const KIND_ADD: Record<TokenKind, string> = {
  place: 'куда',
  time: 'когда',
  who: 'с кем',
  money: 'бюджет',
};

export const OPTIONS: Record<TokenKind, { text: string; hint?: string }[]> = {
  place: [
    { text: 'в Сочи', hint: 'море и горы, без визы' },
    { text: 'к тёплому морю', hint: 'Египет, +28 °C' },
    { text: 'в Петербург', hint: 'музеи и белые ночи' },
    { text: 'в Рим', hint: 'нужен шенген' },
    { text: 'в Карелию', hint: 'лес, озёра, можно с собакой' },
  ],
  time: [
    { text: 'на выходные', hint: 'пт — вс' },
    { text: 'на неделю' },
    { text: 'в ноябре' },
    { text: 'на майские' },
  ],
  who: [
    { text: 'вдвоём' },
    { text: 'с ребёнком' },
    { text: 'с собакой' },
    { text: 'с ребёнком и собакой' },
  ],
  money: [
    { text: 'до 40 000 ₽' },
    { text: 'до 70 000 ₽' },
    { text: 'до 100 000 ₽' },
    { text: 'до 150 000 ₽' },
  ],
};

const tidy = (s: string) =>
  s
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim();

export function replaceSegment(text: string, seg: Segment, next: string | null) {
  return tidy(`${text.slice(0, seg.start)}${next ?? ''}${text.slice(seg.end)}`);
}

export function appendToken(text: string, value: string) {
  const base = text.replace(/[.!?\s]+$/, '');
  return tidy(`${base} ${value}`);
}

export function missingKinds(segments: Segment[]): TokenKind[] {
  const have = new Set(segments.map((s) => s.kind).filter(Boolean));
  return (['place', 'time', 'who', 'money'] as TokenKind[]).filter((k) => !have.has(k));
}
