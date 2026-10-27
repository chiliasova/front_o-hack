// API-клиент. Режимы (VITE_API_MODE):
//  auto — ходим в бэкенд, если он недоступен (сеть/404/5xx) — отвечают моки; по умолчанию;
//  live — только бэкенд;
//  mock — только моки (удобно для демо без сервера).
import { ApiError } from './errors';
import * as mock from './mock';
import type {
  ActionResponse,
  AuthResponse,
  AuthUser,
  BookRequest,
  BookResponse,
  BookedTrip,
  ChatRequest,
  ChatResponse,
  HotDeal,
  InquiryRequest,
  InquiryResponse,
  LoginRequest,
  ProfileUpdate,
  RegisterRequest,
  UserProfile,
} from './types';
import { getToken } from '../lib/auth';

const MODE = import.meta.env.VITE_API_MODE ?? 'auto';
const BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

export type DataSource = 'live' | 'mock' | 'unknown';
let source: DataSource = MODE === 'mock' ? 'mock' : 'unknown';
const listeners = new Set<(s: DataSource) => void>();
const setSource = (s: DataSource) => {
  if (s === source) return;
  source = s;
  listeners.forEach((l) => l(s));
};
export const getDataSource = () => source;
export const onDataSourceChange = (fn: (s: DataSource) => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export { ApiError };

class FallbackSignal extends Error {}

async function http<T>(path: string, init: RequestInit = {}, userId?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) headers['X-User-ID'] = userId;
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers, ...(init.headers as object) } });
  } catch (e) {
    throw new FallbackSignal(String(e));
  }
  if (res.status === 404 || res.status >= 500) throw new FallbackSignal(`HTTP ${res.status}`);
  if (!res.ok) {
    let detail = `Ошибка сервера (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? detail;
    } catch {
      /* not json */
    }
    throw new ApiError(typeof detail === 'string' ? detail : JSON.stringify(detail), res.status);
  }
  // HTML вместо JSON — значит, ответил не бэкенд, а SPA-фолбэк сервера статики.
  if (!res.headers.get('content-type')?.includes('json')) throw new FallbackSignal('not json');
  return (await res.json()) as T;
}

async function call<T>(live: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (MODE === 'mock') return fallback();
  try {
    const result = await live();
    setSource('live');
    return result;
  } catch (e) {
    if (e instanceof FallbackSignal) {
      if (MODE === 'live') throw new ApiError('Бэкенд недоступен. Попробуйте позже.');
      console.warn(`[api] бэкенд недоступен (${e.message}), отвечают демо-моки`);
      setSource('mock');
      return fallback();
    }
    throw e;
  }
}

const json = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export const api = {
  auth: {
    login: (req: LoginRequest) =>
      call(
        () => http<AuthResponse>('/api/auth/login', json(req)),
        () => mock.mockLogin(req),
      ),
    register: (req: RegisterRequest) =>
      call(
        () => http<AuthResponse>('/api/auth/register', json(req)),
        () => mock.mockRegister(req),
      ),
    me: () =>
      call(
        () => http<AuthUser>('/api/auth/me'),
        () => mock.mockMe(getToken()),
      ),
    updateProfile: (upd: ProfileUpdate) =>
      call(
        () => http<AuthUser>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(upd) }),
        () => mock.mockUpdateProfile(getToken(), upd),
      ),
  },

  health: () =>
    call(
      () => http<{ status: string }>('/health'),
      async () => ({ status: 'mock' }),
    ),

  chat: (req: ChatRequest) =>
    call(
      () => http<ChatResponse>('/api/chat', json(req), req.user_id),
      () => mock.mockChat(req),
    ),

  hotDeals: () =>
    call(
      () => http<HotDeal[]>('/api/deals/hot'),
      () => mock.mockHotDeals(),
    ),

  profile: (userId: string) =>
    call(
      () => http<UserProfile>(`/api/user/profile?user_id=${encodeURIComponent(userId)}`, {}, userId),
      () => mock.mockProfile(userId),
    ),

  book: (tripId: string, req: BookRequest, userId: string | null) =>
    call(
      () => http<BookResponse>(`/api/trips/${tripId}/book`, json(req), userId),
      () => mock.mockBook(tripId, req, userId),
    ),

  // Нет в спеке — предложение бэкенду: GET /api/trips?user_id=...
  trips: (userId: string | null) =>
    call(
      () => http<BookedTrip[]>(`/api/trips${userId ? `?user_id=${encodeURIComponent(userId)}` : ''}`, {}, userId),
      () => mock.mockTrips(userId),
    ),

  earlyCheckin: (tripId: string, requested_time: string, userId: string | null) =>
    call(
      () => http<ActionResponse>(`/api/trips/${tripId}/early-checkin`, json({ requested_time }), userId),
      () => mock.mockEarlyCheckin(tripId, requested_time, userId),
    ),

  changeDates: (tripId: string, new_check_in: string, new_check_out: string, userId: string | null) =>
    call(
      () => http<ActionResponse>(`/api/trips/${tripId}/change-dates`, json({ new_check_in, new_check_out }), userId),
      () => mock.mockChangeDates(tripId, new_check_in, new_check_out),
    ),

  addTransfer: (tripId: string, vehicle_type: string, userId: string | null) =>
    call(
      () => http<ActionResponse>(`/api/trips/${tripId}/add-transfer`, json({ vehicle_type }), userId),
      () => mock.mockAddTransfer(tripId, vehicle_type),
    ),

  inquire: (hotelId: number, req: InquiryRequest) =>
    call(
      () => http<InquiryResponse>(`/api/hotels/${hotelId}/inquire`, json(req), req.user_id),
      () => mock.mockInquire(hotelId, req),
    ),
};

export { resetMockStore } from './mock';
