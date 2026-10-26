// Стиль интерфейса на выбор: journal (по умолчанию), night, poster.
export const THEMES = [
  { key: 'journal', label: 'Журнал' },
  { key: 'night', label: 'Ночной рейс' },
  { key: 'poster', label: 'Постер' },
] as const;
export type ThemeKey = (typeof THEMES)[number]['key'];

const STORAGE_KEY = 'odin-theme';
const isTheme = (v: unknown): v is ThemeKey => THEMES.some((t) => t.key === v);

export function initialTheme(): ThemeKey {
  const fromUrl = new URLSearchParams(location.search).get('theme');
  if (isTheme(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isTheme(saved)) return saved;
  } catch {
    /* ignore */
  }
  return 'journal';
}

export function applyTheme(theme: ThemeKey) {
  if (theme === 'journal') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}
