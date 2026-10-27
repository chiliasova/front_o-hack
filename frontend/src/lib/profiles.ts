// Тестовые аккаунты для быстрого входа жюри (заведены на бэкенде, пароль общий).
import type { UserProfile } from '../api/types';

export const DEMO_PASSWORD = 'Ostrovok2026!';

export type AccountKey = 'guest' | 'alexey' | 'elena' | 'dmitry';

export interface DemoAccount {
  key: Exclude<AccountKey, 'guest'>;
  name: string;
  email: string;
  tier: string;
  badges: string[];
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { key: 'alexey', name: 'Алексей Смирнов', email: 'alexey.smirnov@example.com', tier: 'Gold', badges: ['Семья', 'корги'] },
  { key: 'elena', name: 'Елена Васильева', email: 'elena.vasilyeva@example.com', tier: 'Platinum', badges: ['Премиум 5★', 'Шенген'] },
  { key: 'dmitry', name: 'Дмитрий Петров', email: 'dmitry.petrov@example.com', tier: 'Silver', badges: ['Соло'] },
];

export const accountKey = (profile: UserProfile | null): AccountKey =>
  DEMO_ACCOUNTS.find((a) => a.email === profile?.email?.toLowerCase())?.key ?? 'guest';

// Стартовые фразы зависят от профиля, чтобы жюри сразу увидело персонализацию.
export const STARTER_CHIPS: Record<AccountKey, string[]> = {
  guest: ['В Сочи на выходные', 'К тёплому морю в ноябре с ребёнком', 'Питер до 40 000 ₽'],
  alexey: ['В Сочи на выходные', 'К тёплому морю в ноябре с ребёнком', 'Куда поехать с собакой на майские?'],
  elena: ['В Сочи на выходные', 'Рим на 4 дня, хочу красиво', 'Питер до 40 000 ₽'],
  dmitry: ['Питер до 40 000 ₽ один', 'В Сочи на выходные', 'Рим на 4 дня, хочу красиво'],
};
