// Демо-профили для жюри (селектор в хедере).
export interface DemoProfile {
  key: 'guest' | 'alexey' | 'elena';
  label: string;
  short: string;
  userId: string | null;
}

export const DEMO_PROFILES: DemoProfile[] = [
  { key: 'guest', label: 'Гость (без авторизации)', short: 'Гость', userId: null },
  {
    key: 'alexey',
    label: 'Алексей (Семья + собака)',
    short: 'Алексей',
    userId: '7b1c4e90-1234-5678-9abc-def012345678',
  },
  {
    key: 'elena',
    label: 'Елена (Премиум + Шенген)',
    short: 'Елена',
    userId: 'a3f2c9d1-5678-4abc-9def-0123456789ab',
  },
];

// Стартовые чипсы зависят от профиля, чтобы жюри сразу увидело персонализацию.
export const STARTER_CHIPS: Record<DemoProfile['key'], string[]> = {
  guest: ['В Сочи на выходные', 'К тёплому морю в ноябре с ребёнком', 'Питер до 40 000 ₽'],
  alexey: [
    'В Сочи на выходные',
    'К тёплому морю в ноябре с ребёнком',
    'Куда поехать с собакой на майские?',
  ],
  elena: ['В Сочи на выходные', 'Рим на 4 дня, хочу красиво', 'Питер до 40 000 ₽'],
};
