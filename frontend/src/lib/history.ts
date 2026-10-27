// История запросов в localStorage: одна запись на сессию диалога, последние 25.
import type { TripPlan } from '../api/types';
import { formatDateShort } from './format';

export interface HistoryItem {
  sessionId: string;
  timestamp: number;
  requestText: string;
  refinements: string[];
  destination?: string;
  hotelName?: string;
  totalPrice?: number;
  dates?: string;
  answer: { reply: string; plan: TripPlan | null };
}

const KEY = 'ostrovok_query_history';
const LIMIT = 25;

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const items = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function save(items: HistoryItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, LIMIT)));
  } catch {
    /* переполнение или приватный режим — история просто не сохранится */
  }
}

export function upsertHistory(entry: Omit<HistoryItem, 'timestamp' | 'destination' | 'hotelName' | 'totalPrice' | 'dates'>) {
  const plan = entry.answer.plan;
  const item: HistoryItem = {
    ...entry,
    timestamp: Date.now(),
    destination: plan?.destination.split(',')[0].trim(),
    hotelName: plan?.hotel.name,
    totalPrice: plan?.pricing.total_price,
    dates: plan ? `${formatDateShort(plan.check_in)} — ${formatDateShort(plan.check_out)}` : undefined,
  };
  const items = [item, ...loadHistory().filter((x) => x.sessionId !== entry.sessionId)];
  save(items);
  return items.slice(0, LIMIT);
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
