import type { BookedTrip, HotDeal, Hotel, Transfer, Transport, UserProfile } from './types';

const img = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=80&auto=format&fit=crop`;

export const PHOTOS = {
  resortPool: img('photo-1566073771259-6a8506099945'),
  seaHotel: img('photo-1582719508461-905c673771fd'),
  tropical: img('photo-1520250497591-112f2f40a3f4'),
  poolDeck: img('photo-1571896349842-33c89424de2d'),
  lobby: img('photo-1551882547-ff40c63fe5fa'),
  facade: img('photo-1542314831-068cd1dbfeeb'),
  room: img('photo-1590490360182-c33d57733427'),
  roomLight: img('photo-1611892440504-42a792e24d32'),
  roomClassic: img('photo-1584132967334-10e028bd69f7'),
  boutique: img('photo-1445019980597-93fa8acb246c'),
  cityHotel: img('photo-1564501049412-61c2a3083791'),
  forest: img('photo-1448375240586-882707db888b'),
  rome: img('photo-1552832230-c0197dd311b5'),
  spb: img('photo-1556610961-2fecc5927173'),
};

export const PROFILES: Record<string, UserProfile> = {
  '7b1c4e90-1234-5678-9abc-def012345678': {
    id: '7b1c4e90-1234-5678-9abc-def012345678',
    name: 'Алексей Смирнов',
    email: 'alexey.smirnov@example.com',
    phone: '+7 (999) 000-00-01',
    loyalty_tier: 'Gold',
    loyalty_points: 4500,
    cashback_percent: 7.0,
    preferences: {
      family: '2 взрослых, ребёнок 7 лет',
      has_pets: true,
      pet_details: 'Собака (корги)',
      favorite_amenities: ['pool_heated', 'breakfast_included'],
      has_schengen_visa: false,
    },
  },
  'a3f2c9d1-5678-4abc-9def-0123456789ab': {
    id: 'a3f2c9d1-5678-4abc-9def-0123456789ab',
    name: 'Елена Васильева',
    email: 'elena.vasilyeva@example.com',
    phone: '+7 (999) 000-00-02',
    loyalty_tier: 'Platinum',
    loyalty_points: 18200,
    cashback_percent: 10.0,
    preferences: {
      family: '1 взрослый',
      has_pets: false,
      favorite_amenities: ['spa', 'city_center', 'rooftop'],
      has_schengen_visa: true,
    },
  },
  'd4e5f6a7-9012-4cde-8f01-23456789abcd': {
    id: 'd4e5f6a7-9012-4cde-8f01-23456789abcd',
    name: 'Дмитрий Петров',
    email: 'dmitry.petrov@example.com',
    phone: '+7 (999) 000-00-03',
    loyalty_tier: 'Silver',
    loyalty_points: 1200,
    cashback_percent: 5.0,
    preferences: {
      family: '1 взрослый, путешествует один',
      has_pets: false,
      favorite_amenities: ['wifi', 'city_center'],
      has_schengen_visa: false,
    },
  },
};


export { DEMO_PASSWORD } from '../lib/profiles';

export interface DestinationTemplate {
  destination: string;
  hotels: { main: Hotel; budget: Hotel };
  transport: Transport | null;
  transfer: Transfer | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  timeline: { is_valid: boolean; status_text: string };
  explain: { why_recommended: string; trade_offs: string; risks: string };
}

export const SOCHI_MAIN: Hotel = {
  id: 1,
  name: 'Radisson Collection Paradise Resort',
  stars: 5,
  rating: 9.4,
  address: 'ул. 65 лет Победы, 50',
  price_per_night: 9500,
  photos: [PHOTOS.resortPool, PHOTOS.poolDeck, PHOTOS.room, PHOTOS.lobby],
  amenities: ['wifi', 'pool_heated', 'spa', 'kids_club', 'breakfast_included'],
  cancellation_policy: 'Бесплатная отмена за 48 часов',
};

export const SOCHI_BUDGET: Hotel = {
  id: 2,
  name: 'Гранд Отель Жемчужина',
  stars: 4,
  rating: 8.7,
  address: 'Черноморская ул., 3',
  price_per_night: 6200,
  photos: [PHOTOS.seaHotel, PHOTOS.roomClassic, PHOTOS.poolDeck],
  amenities: ['wifi', 'pool', 'beach', 'breakfast_included', 'parking'],
  cancellation_policy: 'Бесплатная отмена за 24 часа',
};

export const DESTINATIONS: Record<string, DestinationTemplate> = {
  sochi: {
    destination: 'Сочи, Россия',
    hotels: { main: SOCHI_MAIN, budget: SOCHI_BUDGET },
    transport: {
      type: 'flight',
      carrier: 'Аэрофлот (SU-1124)',
      departure: '09:30',
      arrival: '13:15',
      price: 14000,
      baggage: true,
    },
    transfer: { type: 'Комфорт (Седан)', duration_min: 35, price: 1600 },
    checkIn: '2026-11-10',
    checkOut: '2026-11-15',
    guests: 2,
    timeline: {
      is_valid: true,
      status_text:
        'Стыковка идеальна: прилёт в 13:15 -> трансфер 35 мин -> заселение в 14:00 без ожидания',
    },
    explain: {
      why_recommended:
        'Семейный 5★ отель с подогреваемым бассейном в тихом районе, укладывается в бюджет.',
      trade_offs: 'Отель в 400 метрах от набережной, но цена на 25% ниже первой линии.',
      risks: 'В ноябре возможны кратковременные дожди, рекомендуем взять зонт.',
    },
  },
  sea: {
    destination: 'Хургада, Египет',
    hotels: {
      main: {
        id: 11,
        name: 'Sunrise Aqua Family Resort',
        stars: 5,
        rating: 9.1,
        address: 'Sahl Hasheesh Rd, Хургада',
        price_per_night: 11200,
        photos: [PHOTOS.tropical, PHOTOS.poolDeck, PHOTOS.roomLight],
        amenities: ['all_inclusive', 'aquapark', 'kids_club', 'beach', 'pool_heated', 'wifi'],
        cancellation_policy: 'Бесплатная отмена за 7 дней',
      },
      budget: {
        id: 12,
        name: 'Coral Beach Hotel',
        stars: 4,
        rating: 8.4,
        address: 'Village Road, Хургада',
        price_per_night: 7400,
        photos: [PHOTOS.seaHotel, PHOTOS.room],
        amenities: ['all_inclusive', 'beach', 'pool', 'kids_club'],
        cancellation_policy: 'Бесплатная отмена за 3 дня',
      },
    },
    transport: {
      type: 'flight',
      carrier: 'Аэрофлот (SU-2702)',
      departure: '08:05',
      arrival: '12:40',
      price: 24500,
      baggage: true,
    },
    transfer: { type: 'Минивэн (детское кресло)', duration_min: 25, price: 2400 },
    checkIn: '2026-11-08',
    checkOut: '2026-11-15',
    guests: 3,
    timeline: {
      is_valid: true,
      status_text:
        'Прилёт в 12:40 -> паспортный контроль ~40 мин -> трансфер 25 мин -> заселение в 14:00. Детское кресло в машине уже заказано',
    },
    explain: {
      why_recommended:
        'В ноябре в Хургаде +28 °C и море +26 °C. Отель с аквапарком и детским клубом с 4 лет, «всё включено» — не нужно думать о еде с ребёнком.',
      trade_offs: 'Перелёт 5,5 часа, но рейс прямой и утренний — ребёнок не устанет к вечеру.',
      risks: 'Нужен загранпаспорт со сроком действия от 6 месяцев. Виза оформляется по прилёту ($25).',
    },
  },
  piter: {
    destination: 'Санкт‑Петербург, Россия',
    hotels: {
      main: {
        id: 21,
        name: 'Отель «Невский Берег»',
        stars: 4,
        rating: 9.0,
        address: 'наб. реки Мойки, 22',
        price_per_night: 5400,
        photos: [PHOTOS.cityHotel, PHOTOS.roomClassic, PHOTOS.lobby],
        amenities: ['wifi', 'breakfast_included', 'city_center', 'restaurant'],
        cancellation_policy: 'Бесплатная отмена за 24 часа',
      },
      budget: {
        id: 22,
        name: 'Апарт-отель «Литейный 9»',
        stars: 3,
        rating: 8.6,
        address: 'Литейный пр., 9',
        price_per_night: 3600,
        photos: [PHOTOS.roomLight, PHOTOS.facade],
        amenities: ['wifi', 'city_center'],
        cancellation_policy: 'Бесплатная отмена за 24 часа',
      },
    },
    transport: {
      type: 'train',
      carrier: 'Сапсан №752А (вагон 5)',
      departure: '05:45',
      arrival: '09:40',
      price: 5200,
      baggage: true,
    },
    transfer: { type: 'Такси Эконом', duration_min: 15, price: 450 },
    checkIn: '2026-11-13',
    checkOut: '2026-11-16',
    guests: 2,
    timeline: {
      is_valid: false,
      status_text:
        'Прибытие в 09:40, а заселение с 14:00 — ожидание около 4 часов. Отель бесплатно примет багаж, а ранний заезд можно запросить после оплаты',
    },
    explain: {
      why_recommended:
        'Исторический центр в 5 минутах от Дворцовой площади, завтраки включены. Вся поездка заметно дешевле лимита в 40 000 ₽.',
      trade_offs: 'Утренний «Сапсан» — рано вставать, зато получаете полный первый день в городе.',
      risks: 'В ноябре в Петербурге темнеет около 16:30 — планируем музеи на вторую половину дня.',
    },
  },
  rome: {
    destination: 'Рим, Италия',
    hotels: {
      main: {
        id: 31,
        name: 'Palazzo Navona Boutique Hotel',
        stars: 5,
        rating: 9.6,
        address: 'Via della Posta Vecchia, 7, Рим',
        price_per_night: 32000,
        photos: [PHOTOS.boutique, PHOTOS.room, PHOTOS.rome],
        amenities: ['spa', 'rooftop', 'city_center', 'breakfast_included', 'wifi'],
        cancellation_policy: 'Бесплатная отмена за 72 часа',
      },
      budget: {
        id: 32,
        name: 'Trastevere Design Rooms',
        stars: 4,
        rating: 9.0,
        address: 'Via della Lungaretta, 41, Рим',
        price_per_night: 16500,
        photos: [PHOTOS.roomLight, PHOTOS.rome],
        amenities: ['wifi', 'breakfast_included', 'city_center'],
        cancellation_policy: 'Бесплатная отмена за 48 часов',
      },
    },
    transport: {
      type: 'flight',
      carrier: 'Air Serbia (JU-651) через Белград',
      departure: '07:40',
      arrival: '13:20',
      price: 41000,
      baggage: true,
    },
    transfer: { type: 'Бизнес (Mercedes E)', duration_min: 40, price: 7800 },
    checkIn: '2026-11-19',
    checkOut: '2026-11-23',
    guests: 1,
    timeline: {
      is_valid: true,
      status_text:
        'Пересадка в Белграде 1 ч 50 мин — достаточно. Прилёт в 13:20 -> трансфер 40 мин -> заселение в 14:00',
    },
    explain: {
      why_recommended:
        'Бутик-отель 5★ у площади Навона с SPA и террасой на крыше — под ваши любимые удобства. Шенгенская виза в профиле действует.',
      trade_offs: 'Прямых рейсов нет, но пересадка короткая и в одном терминале.',
      risks: 'Во второй половине ноября в Риме бывают дожди, а Ватиканские музеи лучше бронировать заранее — могу помочь.',
    },
  },
  karelia: {
    destination: 'Карелия, Россия',
    hotels: {
      main: {
        id: 41,
        name: 'Эко-курорт «Онего Парк»',
        stars: 4,
        rating: 9.3,
        address: 'Кондопожский р-н, пос. Гирвас',
        price_per_night: 8900,
        photos: [PHOTOS.forest, PHOTOS.roomLight, PHOTOS.facade],
        amenities: ['pet_friendly', 'breakfast_included', 'spa', 'parking', 'kids_club'],
        cancellation_policy: 'Бесплатная отмена за 5 дней',
      },
      budget: {
        id: 42,
        name: 'Гостевой дом «Лесная Губа»',
        stars: 3,
        rating: 8.9,
        address: 'пос. Кивач',
        price_per_night: 5200,
        photos: [PHOTOS.forest, PHOTOS.roomClassic],
        amenities: ['pet_friendly', 'parking', 'breakfast_included'],
        cancellation_policy: 'Бесплатная отмена за 3 дня',
      },
    },
    transport: {
      type: 'train',
      carrier: 'Поезд №18 «Карелия» (купе, питомец в купе)',
      departure: '21:40',
      arrival: '08:15',
      price: 7600,
      baggage: true,
    },
    transfer: { type: 'Минивэн (можно с собакой)', duration_min: 60, price: 3200 },
    checkIn: '2027-05-01',
    checkOut: '2027-05-05',
    guests: 3,
    timeline: {
      is_valid: true,
      status_text:
        'Ночной поезд прибывает в 08:15 -> трансфер 60 мин -> ранний заезд в 09:30 уже включён в тариф',
    },
    explain: {
      why_recommended:
        'Курорт официально pet-friendly: корги заселяется бесплатно, есть выгульная зона и лес вокруг. Для ребёнка — детский клуб, для вас — SPA.',
      trade_offs: 'Ночь в поезде, зато не нужен перелёт с собакой в багажном отсеке.',
      risks: 'В начале мая в Карелии ещё +8…+12 °C — берите тёплые вещи и средство от клещей для собаки.',
    },
  },
};

export const HOT_DEALS: HotDeal[] = [
  {
    id: 'deal-1',
    destination: 'Сочи',
    hotel_name: 'Гранд Отель Жемчужина',
    stars: 4,
    photo: PHOTOS.seaHotel,
    discount_percent: 35,
    original_price: 58000,
    hot_price: 37700,
    reason: 'Осталось 2 номера на ближайшие выходные',
    valid_until: '2026-10-28',
  },
  {
    id: 'deal-2',
    destination: 'Казань',
    hotel_name: 'Kazan Palace Boutique',
    stars: 5,
    photo: PHOTOS.boutique,
    discount_percent: 28,
    original_price: 46000,
    hot_price: 33100,
    reason: 'Отель снизил цену из-за отмены группы',
    valid_until: '2026-10-29',
  },
  {
    id: 'deal-3',
    destination: 'Калининград',
    hotel_name: 'Балтийская Корона',
    stars: 4,
    photo: PHOTOS.facade,
    discount_percent: 22,
    original_price: 39000,
    hot_price: 30400,
    reason: 'Низкий сезон: море, янтарь и пустые пляжи',
    valid_until: '2026-10-31',
  },
  {
    id: 'deal-4',
    destination: 'Хургада',
    hotel_name: 'Coral Beach Hotel',
    stars: 4,
    photo: PHOTOS.tropical,
    discount_percent: 31,
    original_price: 124000,
    hot_price: 85500,
    reason: 'Вылет через 3 дня, «всё включено»',
    valid_until: '2026-10-27',
  },
  {
    id: 'deal-5',
    destination: 'Санкт‑Петербург',
    hotel_name: 'Отель «Невский Берег»',
    stars: 4,
    photo: PHOTOS.cityHotel,
    discount_percent: 18,
    original_price: 32000,
    hot_price: 26200,
    reason: 'Ранее бронирование на ноябрьские',
    valid_until: '2026-11-01',
  },
  {
    id: 'deal-6',
    destination: 'Алтай',
    hotel_name: 'Эко-отель «Катунь Ривер»',
    stars: 4,
    photo: PHOTOS.forest,
    discount_percent: 25,
    original_price: 52000,
    hot_price: 39000,
    reason: 'Последний заезд сезона с видом на Катунь',
    valid_until: '2026-10-30',
  },
];

export const SEED_TRIPS: Record<string, BookedTrip[]> = {
  '7b1c4e90-1234-5678-9abc-def012345678': [
    {
      id: 'trip-seed-a1',
      booking_code: 'OST-512377',
      destination: 'Казань, Россия',
      hotel_name: 'Kazan Palace Boutique',
      hotel_id: 51,
      photo: PHOTOS.boutique,
      check_in: '2026-12-28',
      check_out: '2027-01-02',
      total_paid: 64300,
      status: 'upcoming',
      extras: [],
    },
    {
      id: 'trip-seed-a2',
      booking_code: 'OST-204918',
      destination: 'Анапа, Россия',
      hotel_name: 'Family Resort «Пионерский»',
      hotel_id: 52,
      photo: PHOTOS.resortPool,
      check_in: '2026-07-12',
      check_out: '2026-07-22',
      total_paid: 118000,
      status: 'completed',
      extras: ['Трансфер комфорт-класса'],
    },
  ],
  'a3f2c9d1-5678-4abc-9def-0123456789ab': [
    {
      id: 'trip-seed-e1',
      booking_code: 'OST-771045',
      destination: 'Стамбул, Турция',
      hotel_name: 'Bosphorus View Hotel',
      hotel_id: 61,
      photo: PHOTOS.boutique,
      check_in: '2026-09-04',
      check_out: '2026-09-08',
      total_paid: 96500,
      status: 'completed',
      extras: ['Ранний заезд с 10:00'],
    },
  ],
};
