// Токен и id пользователя в localStorage (ключи из спецификации бэкенда).
import type { AuthUser, UserProfile } from '../api/types';

const TOKEN_KEY = 'ostrovok_token';
const USER_KEY = 'ostrovok_user_id';

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const getToken = () => read(TOKEN_KEY);
export const getStoredUserId = () => read(USER_KEY);

export function saveSession(token: string, userId: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, userId);
  } catch {
    /* приватный режим */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

const CASHBACK: Record<string, number> = { Standard: 3, Silver: 5, Gold: 7, Platinum: 10 };

/** Пользователь из /api/auth/* → профиль, с которым работает остальное приложение. */
export function toProfile(u: AuthUser): UserProfile {
  const tier = u.status || 'Standard';
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? undefined,
    loyalty_tier: tier,
    loyalty_points: u.dream_bank_balance ?? 0,
    cashback_percent: CASHBACK[tier] ?? 3,
    preferences: {
      family: '',
      has_pets: u.has_pets,
      pet_details: u.pet_details ?? undefined,
      favorite_amenities: u.preferred_amenities ?? [],
      has_schengen_visa: u.has_schengen,
    },
  };
}
