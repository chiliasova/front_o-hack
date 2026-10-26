// Мок-бэкенд: имитирует ответы из FRONTEND_API_SPEC.md, чтобы демо работало без сервера.
import { formatDateDots, nightsBetween } from '../lib/format';
import { DESTINATIONS, HOT_DEALS, PROFILES, SEED_TRIPS, type DestinationTemplate } from './mockData';
import type {
  ActionResponse,
  BookRequest,
  BookResponse,
  BookedTrip,
  ChatRequest,
  ChatResponse,
  HotDeal,
  Hotel,
  InquiryRequest,
  InquiryResponse,
  TripPlan,
  UserProfile,
} from './types';

const wait = (min: number, max: number) =>
  new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));

// ---------- Хранилище (localStorage, чтобы бронирования переживали перезагрузку) ----------

const STORE_KEY = 'odin-mock-store-v1';
interface Store {
  trips: Record<string, BookedTrip[]>;
  points: Record<string, number>;
  plans: Record<string, TripPlan>;
}

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    /* приватный режим и т.п. */
  }
  return { trips: structuredClone(SEED_TRIPS), points: {}, plans: {} };
}

const store = loadStore();
const persist = () => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
};

export function resetMockStore() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* ignore */
  }
}

const userKey = (userId: string | null) => userId ?? 'guest';

function getProfile(userId: string | null): UserProfile | null {
  if (!userId) return null;
  const base = PROFILES[userId];
  if (!base) return null;
  return { ...base, loyalty_points: store.points[userId] ?? base.loyalty_points };
}

// ---------- Сборка плана ----------

interface Session {
  destKey: string | null;
  tier: 'main' | 'budget';
  plan: TripPlan | null;
}
const sessions = new Map<string, Session>();

function planId() {
  return crypto.randomUUID?.() ?? `plan-${Date.now()}`;
}

function buildPlan(
  tpl: DestinationTemplate,
  hotel: Hotel,
  profile: UserProfile | null,
  overrides: Partial<Pick<TripPlan, 'check_in' | 'check_out' | 'guests'>> & {
    explain?: Partial<TripPlan['explainability']>;
    timeline?: TripPlan['timeline_validation'];
    priceOverride?: number;
  } = {},
): TripPlan {
  const check_in = overrides.check_in ?? tpl.checkIn;
  const check_out = overrides.check_out ?? tpl.checkOut;
  const guests = overrides.guests ?? tpl.guests;
  const nights = nightsBetween(check_in, check_out);

  let hotel_total = hotel.price_per_night * nights;
  const transport_total = tpl.transport ? tpl.transport.price * guests : 0;
  const transfer_total = tpl.transfer?.price ?? 0;
  if (overrides.priceOverride) {
    // Горящий тур: фиксированная цена пакета, остаток раскладываем на отель.
    hotel_total = Math.max(0, overrides.priceOverride - transport_total - transfer_total);
  }
  const total_price = hotel_total + transport_total + transfer_total;
  const cashbackPercent = profile ? profile.cashback_percent : 5;

  const plan: TripPlan = {
    id: planId(),
    status: 'assembled',
    destination: tpl.destination,
    check_in,
    check_out,
    guests,
    hotel,
    transport: tpl.transport,
    transfer: tpl.transfer,
    pricing: {
      hotel_total,
      transport_total,
      transfer_total,
      total_price,
      loyalty_points_available: profile?.loyalty_points ?? 0,
      cashback_will_earn: Math.round((total_price * Math.min(cashbackPercent, 5)) / 100),
    },
    timeline_validation: overrides.timeline ?? tpl.timeline,
    explainability: { ...tpl.explain, ...overrides.explain },
  };
  store.plans[plan.id] = plan;
  persist();
  return plan;
}

// Персонализация под профиль (собака, виза, статус).
function personalize(key: string, hotel: Hotel, profile: UserProfile | null) {
  const extra: Partial<TripPlan['explainability']> = {};
  let h = hotel;
  if (profile?.preferences.has_pets && key === 'sochi') {
    h = { ...hotel, amenities: [...new Set([...hotel.amenities, 'pet_friendly'])] };
    extra.why_recommended = `${DESTINATIONS.sochi.explain.why_recommended} Отель принимает собак до 15 кг — ваш корги заселится бесплатно.`;
  }
  if (profile?.preferences.has_pets && key === 'sea') {
    extra.risks = `${DESTINATIONS.sea.explain.risks} Для собаки в Египте нужен ветпаспорт и чип; если корги остаётся дома — подскажу проверенные зоогостиницы.`;
  }
  return { hotel: h, extra };
}

function detectDestination(text: string, prev: string | null): string | null {
  const t = text.toLowerCase();
  if (/сочи|адлер|красн\w* полян/.test(t)) return 'sochi';
  if (/питер|петербург|спб|санкт/.test(t)) return 'piter';
  if (/рим|итал|европ|париж|франц|испан|барселон/.test(t)) return 'rome';
  if (/собак|питом|пёс|пес\b|корги|карел/.test(t)) return 'karelia';
  if (/мор|тепл|тёпл|египет|хургад|турци|пляж/.test(t)) return 'sea';
  return prev;
}

function parseBudget(text: string): number | null {
  const m = text.toLowerCase().match(/до\s*(\d[\d\s]*)\s*(к|k|тыс|000|₽|руб)?/);
  if (!m) return null;
  let n = Number(m[1].replace(/\s/g, ''));
  if (!n) return null;
  if (m[2] === 'к' || m[2] === 'k' || m[2] === 'тыс') n *= 1000;
  if (n < 1000) n *= 1000;
  return n;
}

function weekendDates() {
  const d = new Date();
  const toFriday = (5 - d.getDay() + 7) % 7 || 7;
  const fri = new Date(d.getFullYear(), d.getMonth(), d.getDate() + toFriday);
  const sun = new Date(fri.getFullYear(), fri.getMonth(), fri.getDate() + 2);
  const iso = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  return { check_in: iso(fri), check_out: iso(sun) };
}

const REPLIES: Record<string, string> = {
  sochi:
    'Я подобрал для вас отличный тур в Сочи! Пятизвёздочный отель с подогреваемым бассейном и удобным прямым рейсом.',
  sea: 'Нашёл тёплое море для семьи: Хургада, +28 °C в воздухе и +26 °C в воде. Отель с аквапарком и детским клубом, прямой утренний рейс.',
  piter:
    'Собрал поездку в Петербург: «Сапсан» туда-обратно и уютный отель на Мойке в самом центре. Обратите внимание на время заселения — я подсветил это на холсте.',
  rome: 'Рим готов: бутик-отель 5★ у площади Навона, SPA и терраса с видом на купола. Перелёт с короткой пересадкой в Белграде.',
  karelia:
    'Для путешествия с собакой предлагаю Карелию: pet-friendly эко-курорт в лесу и ночной поезд, где корги поедет с вами в купе.',
};

export async function mockChat(req: ChatRequest): Promise<ChatResponse> {
  await wait(1600, 2600);
  const profile = getProfile(req.user_id);
  const s: Session = sessions.get(req.session_id) ?? { destKey: null, tier: 'main', plan: null };
  const text = req.message.toLowerCase();

  // Горящий тур из витрины
  const deal = HOT_DEALS.find((d) => text.includes(d.hotel_name.toLowerCase()));
  if (deal) return dealReply(req, s, deal, profile);

  const prevKey = s.destKey;
  const key = detectDestination(text, prevKey);

  if (!key) {
    sessions.set(req.session_id, s);
    return {
      session_id: req.session_id,
      reply:
        'Расскажите чуть подробнее, и я соберу поездку целиком: куда хочется (море, город, природа), когда, сколько вас и какой бюджет. Например: «К тёплому морю в ноябре с ребёнком до 150 000 ₽».',
      trip_plan: null,
      suggestions: ['В Сочи на выходные', 'К тёплому морю в ноябре с ребёнком', 'Питер до 40 000 ₽'],
    };
  }

  // Виза: Европа без шенгена — честно говорим и предлагаем альтернативу
  if (key === 'rome' && !profile?.preferences.has_schengen_visa) {
    sessions.set(req.session_id, s);
    return {
      session_id: req.session_id,
      reply: profile
        ? `${profile.name.split(' ')[0]}, в вашем профиле нет действующей шенгенской визы, а оформление сейчас занимает 3–6 недель. Могу собрать безвизовую альтернативу с похожей атмосферой — например, Петербург или Казань. Или подобрать поездку на даты после получения визы?`
        : 'Для поездки в Италию нужна шенгенская виза. Если она у вас есть — войдите в профиль, и я учту это. Или могу предложить безвизовую альтернативу с похожей атмосферой.',
      trip_plan: null,
      suggestions: ['Покажи Петербург', 'В Сочи на выходные'],
    };
  }

  const tpl = DESTINATIONS[key];
  let tier: Session['tier'] = key === prevKey ? s.tier : 'main';
  let lead = REPLIES[key];

  if (key === prevKey && /дешев|бюджет|эконом|подешевле/.test(text)) {
    tier = 'budget';
    lead = `Нашёл вариант дешевле: ${tpl.hotels.budget.name}. Перелёт и трансфер оставил прежними.`;
  } else if (key === prevKey && /дорож|премиум|лучше|люкс|5\s*звезд|5★/.test(text)) {
    tier = 'main';
    lead = `Вернул более премиальный вариант: ${tpl.hotels.main.name}.`;
  }

  const overrides: Parameters<typeof buildPlan>[3] = {};
  // Уточнение в том же направлении — сохраняем даты и состав из прошлого плана.
  if (key === prevKey && s.plan) {
    overrides.check_in = s.plan.check_in;
    overrides.check_out = s.plan.check_out;
    overrides.guests = s.plan.guests;
  }
  if (/реб[её]н|дет/.test(profile?.preferences.family ?? '') && tpl.guests < 3) overrides.guests = 3;
  if (/выходн/.test(text)) {
    Object.assign(overrides, weekendDates());
    if (key === 'sochi') {
      overrides.explain = {
        trade_offs: 'Короткая поездка на 2 ночи: вылет в пятницу утром, обратно в воскресенье вечером.',
      };
    }
  }
  if (/реб[её]н|дет/.test(text) && tpl.guests < 3) overrides.guests = 3;

  const budget = parseBudget(text);
  let { hotel, extra } = personalize(key, tpl.hotels[tier], profile);
  overrides.explain = { ...overrides.explain, ...extra };
  let plan = buildPlan(tpl, hotel, profile, overrides);

  if (budget && plan.pricing.total_price > budget && tier === 'main') {
    tier = 'budget';
    ({ hotel, extra } = personalize(key, tpl.hotels.budget, profile));
    overrides.explain = { ...overrides.explain, ...extra };
    plan = buildPlan(tpl, hotel, profile, overrides);
    lead += ` Чтобы уложиться в ${budget.toLocaleString('ru-RU')} ₽, выбрал ${hotel.name}.`;
  }
  if (budget && plan.pricing.total_price > budget) {
    lead += ` Даже самый выгодный вариант выходит на ${(plan.pricing.total_price - budget).toLocaleString('ru-RU')} ₽ дороже бюджета — могу сократить поездку на ночь.`;
  }

  sessions.set(req.session_id, { destKey: key, tier, plan });
  return {
    session_id: req.session_id,
    reply: lead,
    trip_plan: plan,
    suggestions:
      tier === 'main'
        ? ['Найди дешевле', 'Можно с собакой?', 'Что взять с собой?']
        : ['Покажи премиальный вариант', 'Что взять с собой?'],
  };
}

function dealReply(req: ChatRequest, s: Session, deal: HotDeal, profile: UserProfile | null): ChatResponse {
  const key = detectDestination(deal.destination.toLowerCase(), null);
  // Для направлений без своего шаблона берём сочинский и меняем рейс.
  const tpl: DestinationTemplate = key
    ? DESTINATIONS[key]
    : {
        ...DESTINATIONS.sochi,
        transport: { ...DESTINATIONS.sochi.transport!, carrier: 'Аэрофлот (SU-1520)', price: 9800 },
        timeline: {
          is_valid: true,
          status_text: 'Прилёт в 13:15 -> трансфер 35 мин -> заселение в 14:00 без ожидания',
        },
      };
  const hotel: Hotel = {
    id: 100 + Number(deal.id.replace(/\D/g, '') || 0),
    name: deal.hotel_name,
    stars: deal.stars,
    rating: 8.8,
    address: deal.destination,
    price_per_night: Math.round(deal.hot_price / 4),
    photos: [deal.photo, ...tpl.hotels.main.photos.slice(1)],
    amenities: tpl.hotels.main.amenities,
    cancellation_policy: 'Невозвратный тариф горящего предложения',
  };
  const plan = buildPlan({ ...tpl, destination: deal.destination }, hotel, profile, {
    ...weekendDates(),
    priceOverride: deal.hot_price,
    explain: {
      why_recommended: `Горящее предложение −${deal.discount_percent}%: ${deal.reason.toLowerCase()}.`,
      trade_offs: `Невозвратный тариф, но экономия ${(deal.original_price - deal.hot_price).toLocaleString('ru-RU')} ₽.`,
      risks: `Цена действует до ${formatDateDots(deal.valid_until)} — рекомендую не откладывать.`,
    },
  });
  sessions.set(req.session_id, { ...s, destKey: key, plan });
  return {
    session_id: req.session_id,
    reply: `Отличный выбор! Собрал горящий тур в ${deal.destination}: ${deal.hotel_name}, скидка ${deal.discount_percent}%. Проверил стыковки — всё сходится.`,
    trip_plan: plan,
    suggestions: ['Что взять с собой?', 'Можно с собакой?'],
  };
}

export async function mockHotDeals(): Promise<HotDeal[]> {
  await wait(300, 600);
  return HOT_DEALS;
}

export async function mockProfile(userId: string): Promise<UserProfile> {
  await wait(200, 400);
  const p = getProfile(userId);
  if (!p) throw new Error('Профиль не найден');
  return p;
}

export async function mockBook(tripId: string, req: BookRequest, userId: string | null): Promise<BookResponse> {
  await wait(1200, 1800);
  const plan = store.plans[tripId];
  if (!plan) throw new Error('План поездки не найден — попросите агента собрать его заново');

  const afterPoints = plan.pricing.total_price - req.use_loyalty_points;
  const promo = req.promo_code.trim().toUpperCase() === 'OSTROVOK' ? Math.round(afterPoints * 0.05) : 0;
  const total_paid = Math.max(0, afterPoints - promo);
  const profile = getProfile(userId);
  const points_earned = Math.round((total_paid * (profile?.cashback_percent ?? 5)) / 100 / 2);
  const code = `OST-${String(Math.floor(100000 + Math.random() * 900000))}`;

  if (userId && profile) {
    store.points[userId] = profile.loyalty_points - req.use_loyalty_points + points_earned;
  }
  const key = userKey(userId);
  store.trips[key] = [
    {
      id: plan.id,
      booking_code: code,
      destination: plan.destination,
      hotel_name: plan.hotel.name,
      hotel_id: plan.hotel.id,
      photo: plan.hotel.photos[0] ?? '',
      check_in: plan.check_in,
      check_out: plan.check_out,
      total_paid,
      status: 'upcoming',
      extras: plan.transfer ? [`Трансфер: ${plan.transfer.type}`] : [],
    },
    ...(store.trips[key] ?? []),
  ];
  store.plans[tripId] = { ...plan, status: 'booked' };
  persist();

  return {
    status: 'booked',
    booking_code: code,
    message: 'Бронирование успешно подтверждено!',
    voucher: {
      booking_code: code,
      hotel_name: plan.hotel.name,
      dates: `${formatDateDots(plan.check_in)} — ${formatDateDots(plan.check_out)}`,
      total_paid,
      points_earned,
      qr_code_data: `${code}-CONFIRMED`,
    },
  };
}

export async function mockTrips(userId: string | null): Promise<BookedTrip[]> {
  await wait(200, 400);
  return store.trips[userKey(userId)] ?? [];
}

function updateTrip(tripId: string, fn: (t: BookedTrip) => BookedTrip) {
  for (const key of Object.keys(store.trips)) {
    store.trips[key] = store.trips[key].map((t) => (t.id === tripId ? fn(t) : t));
  }
  persist();
}

export async function mockEarlyCheckin(tripId: string, time: string, userId: string | null): Promise<ActionResponse> {
  await wait(700, 1200);
  const tier = getProfile(userId)?.loyalty_tier;
  updateTrip(tripId, (t) => ({ ...t, extras: [...t.extras, `Ранний заезд с ${time}`] }));
  return {
    status: 'confirmed',
    message: tier
      ? `Ранний заезд с ${time} подтверждён отелем бесплатно (привилегия статуса ${tier})`
      : `Ранний заезд с ${time} подтверждён отелем. Доплата 2 000 ₽ при заселении`,
  };
}

export async function mockChangeDates(tripId: string, checkIn: string, checkOut: string): Promise<ActionResponse> {
  await wait(700, 1200);
  let diff = 0;
  updateTrip(tripId, (t) => {
    const oldN = nightsBetween(t.check_in, t.check_out);
    const newN = nightsBetween(checkIn, checkOut);
    diff = Math.round(((newN - oldN) * t.total_paid) / oldN / 3);
    return { ...t, check_in: checkIn, check_out: checkOut, total_paid: t.total_paid + Math.max(0, diff) };
  });
  return {
    status: 'confirmed',
    price_diff: Math.max(0, diff),
    message:
      diff > 0
        ? `Даты изменены, доплата ${diff.toLocaleString('ru-RU')} ₽ за дополнительные ночи`
        : 'Даты поездки успешно изменены без доплаты',
  };
}

const VEHICLES: Record<string, { label: string; price: number }> = {
  economy: { label: 'эконом-класса', price: 1100 },
  comfort: { label: 'комфорт-класса', price: 1600 },
  business: { label: 'бизнес-класса', price: 3900 },
  minivan: { label: 'минивэн', price: 2400 },
};

export async function mockAddTransfer(tripId: string, vehicle: string): Promise<ActionResponse> {
  await wait(600, 1000);
  const v = VEHICLES[vehicle] ?? VEHICLES.comfort;
  updateTrip(tripId, (t) => ({
    ...t,
    total_paid: t.total_paid + v.price,
    extras: [...t.extras, `Трансфер ${v.label}`],
  }));
  return {
    status: 'confirmed',
    added_price: v.price,
    message: `Трансфер ${v.label} добавлен к бронированию`,
  };
}

export async function mockInquire(_hotelId: number, req: InquiryRequest): Promise<InquiryResponse> {
  await wait(1500, 2400);
  const q = req.question.toLowerCase();
  let answer: string;
  if (req.category === 'pets' || /собак|кошк|питом|корги/.test(q)) {
    answer =
      'Да, мы с радостью принимаем гостей с собаками до 15 кг! При заселении предоставим миску и коврик в номер.';
  } else if (req.category === 'early_checkin' || /ранн|заезд|заселен/.test(q)) {
    answer =
      'Ранний заезд возможен с 10:00 при наличии свободных номеров. Для вашей брони мы уже отметили номер как приоритетный к уборке.';
  } else if (req.category === 'kids' || /дет|реб|кроват|коляск/.test(q)) {
    answer =
      'Детскую кроватку и стульчик в ресторане предоставим бесплатно. Детский клуб работает с 9:00 до 21:00 для детей от 4 лет.';
  } else if (req.category === 'parking' || /парков|машин/.test(q)) {
    answer = 'Парковка на территории есть, 500 ₽ в сутки. Место можно закрепить заранее — отметим в брони.';
  } else {
    answer = 'Спасибо за вопрос! Передали его менеджеру отеля, а пока: ресепшн работает круглосуточно, все детали уточним до заезда.';
  }
  return { status: 'answered', answer: `Отельер ответил: ${answer}` };
}
