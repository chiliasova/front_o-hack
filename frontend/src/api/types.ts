// Типы строго по FRONTEND_API_SPEC.md. Поля, которых нет в спецификации, помечены как optional.

export interface Hotel {
  id: number;
  name: string;
  stars: number;
  rating: number;
  address: string;
  price_per_night: number;
  photos: string[];
  amenities: string[];
  cancellation_policy: string;
}

export interface Transport {
  type: 'flight' | 'train' | string;
  carrier: string;
  departure: string;
  arrival: string;
  price: number;
  baggage: boolean;
}

export interface Transfer {
  type: string;
  duration_min: number;
  price: number;
}

export interface Pricing {
  hotel_total: number;
  transport_total: number;
  transfer_total: number;
  total_price: number;
  loyalty_points_available: number;
  cashback_will_earn: number;
}

export interface TimelineValidation {
  is_valid: boolean;
  status_text: string;
}

export interface Explainability {
  why_recommended: string;
  trade_offs: string;
  risks: string;
}

export interface TripPlan {
  id: string;
  status: 'assembled' | 'booked' | string;
  destination: string;
  check_in: string;
  check_out: string;
  guests: number;
  hotel: Hotel;
  transport: Transport | null;
  transfer: Transfer | null;
  pricing: Pricing;
  timeline_validation: TimelineValidation;
  explainability: Explainability;
}

export interface ChatRequest {
  message: string;
  session_id: string;
  user_id: string | null;
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  trip_plan: TripPlan | null;
  /** Не в спеке: подсказки для следующего шага. Если бэкенд не пришлёт — покажем дефолтные. */
  suggestions?: string[];
}

export interface HotDeal {
  id: string;
  destination: string;
  hotel_name: string;
  stars: number;
  photo: string;
  discount_percent: number;
  original_price: number;
  hot_price: number;
  reason: string;
  valid_until: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  loyalty_tier: string;
  loyalty_points: number;
  cashback_percent: number;
  preferences: {
    family: string;
    has_pets: boolean;
    pet_details?: string;
    favorite_amenities: string[];
    has_schengen_visa: boolean;
  };
}

export type PaymentMethod = 'card' | 'sbp';

export interface BookRequest {
  use_loyalty_points: number;
  promo_code: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  payment_method: PaymentMethod;
}

export interface Voucher {
  booking_code: string;
  hotel_name: string;
  dates: string;
  total_paid: number;
  points_earned: number;
  qr_code_data: string;
}

export interface BookResponse {
  status: 'booked' | string;
  booking_code: string;
  message: string;
  voucher: Voucher;
}

export interface ActionResponse {
  status: 'confirmed' | 'rejected' | string;
  message: string;
  price_diff?: number;
  added_price?: number;
}

export interface InquiryRequest {
  user_id: string | null;
  category: string;
  question: string;
}

export interface InquiryResponse {
  status: 'answered' | 'pending' | string;
  answer: string;
}

/** Не в спеке: бронирование для вкладки «Мои поездки». Предлагаем бэкенду GET /api/trips?user_id=... */
export interface BookedTrip {
  id: string;
  booking_code: string;
  destination: string;
  hotel_name: string;
  hotel_id: number;
  photo: string;
  check_in: string;
  check_out: string;
  total_paid: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  extras: string[];
}
