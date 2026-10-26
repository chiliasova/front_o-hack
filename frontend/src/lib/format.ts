const rub = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export const formatRub = (value: number) => `${rub.format(Math.round(value))} ₽`;
export const formatNum = (value: number) => rub.format(Math.round(value));

/** "2026-11-10" -> "10 нояб." */
export function formatDateShort(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/** "2026-11-10" -> "10.11.2026" */
export function formatDateDots(iso: string) {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}.${m}.${y}` : iso;
}

export function nightsBetween(checkIn: string, checkOut: string) {
  const ms = new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

export function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function uuid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// icon — имя из components/Icon.tsx
export const AMENITY_LABELS: Record<string, { icon: string; label: string }> = {
  wifi: { icon: 'wifi', label: 'Wi‑Fi' },
  pool: { icon: 'pool', label: 'Бассейн' },
  pool_heated: { icon: 'pool', label: 'Подогреваемый бассейн' },
  spa: { icon: 'spa', label: 'SPA' },
  kids_club: { icon: 'kid', label: 'Детский клуб' },
  breakfast_included: { icon: 'coffee', label: 'Завтрак включён' },
  all_inclusive: { icon: 'fork', label: 'Всё включено' },
  pet_friendly: { icon: 'paw', label: 'Можно с питомцем' },
  beach: { icon: 'beach', label: 'Свой пляж' },
  parking: { icon: 'parking', label: 'Парковка' },
  gym: { icon: 'gym', label: 'Фитнес' },
  aquapark: { icon: 'wave', label: 'Аквапарк' },
  city_center: { icon: 'building', label: 'Центр города' },
  restaurant: { icon: 'fork', label: 'Ресторан' },
  rooftop: { icon: 'sunset', label: 'Терраса на крыше' },
};

export const amenity = (key: string) => AMENITY_LABELS[key] ?? { icon: 'check', label: key };
