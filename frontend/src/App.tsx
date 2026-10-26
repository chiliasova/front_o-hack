import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, getDataSource, onDataSourceChange, type DataSource } from './api/client';
import type { HotDeal, TripPlan, UserProfile } from './api/types';
import { ChatPanel, type ChatMessage } from './components/ChatPanel';
import { CheckoutModal } from './components/CheckoutModal';
import { Header, type View } from './components/Header';
import { HotDeals } from './components/HotDeals';
import { InquiryModal } from './components/InquiryModal';
import { MyTrips } from './components/MyTrips';
import { TripCanvas } from './components/TripCanvas';
import { Toast } from './components/ui';
import { uuid } from './lib/format';
import { DEMO_PROFILES, STARTER_CHIPS, type DemoProfile } from './lib/profiles';

export default function App() {
  const [view, setView] = useState<View>('planner');
  const [profileKey, setProfileKey] = useState<DemoProfile['key']>('alexey');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>(getDataSource());

  const [sessionId, setSessionId] = useState(uuid);
  // Текущая сессия для отбрасывания ответов, пришедших после смены профиля.
  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<'chat' | 'canvas'>('chat');

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [inquiry, setInquiry] = useState<{ hotelId: number; hotelName: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tripsRefresh, setTripsRefresh] = useState(0);

  const demo = DEMO_PROFILES.find((p) => p.key === profileKey)!;

  useEffect(() => onDataSourceChange(setDataSource), []);
  useEffect(() => {
    api.health().catch(() => undefined);
  }, []);

  const loadProfile = useCallback(() => {
    if (!demo.userId) {
      setProfile(null);
      return;
    }
    api
      .profile(demo.userId)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [demo.userId]);

  useEffect(loadProfile, [loadProfile]);

  // Смена профиля — новая сессия диалога, чтобы жюри видело персонализацию с нуля.
  const switchProfile = (key: DemoProfile['key']) => {
    setProfileKey(key);
    const next = uuid();
    sessionRef.current = next;
    setSessionId(next);
    setLoading(false);
    setMessages([]);
    setPlan(null);
    setSuggestions(null);
    setCheckoutOpen(false);
    setMobilePane('chat');
    const p = DEMO_PROFILES.find((x) => x.key === key)!;
    setToast(`Вы вошли как: ${p.label}`);
  };

  const send = useCallback(
    async (text: string) => {
      setView('planner');
      setLastFailed(null);
      setMessages((m) => [...m.filter((x) => x.role !== 'error'), { id: uuid(), role: 'user', text }]);
      setLoading(true);
      try {
        const res = await api.chat({ message: text, session_id: sessionId, user_id: demo.userId });
        if (sessionRef.current !== sessionId) return;
        if (res.session_id && res.session_id !== sessionId) setSessionId(res.session_id);
        setMessages((m) => [...m, { id: uuid(), role: 'agent', text: res.reply, plan: res.trip_plan }]);
        setSuggestions(res.suggestions ?? null);
        if (res.trip_plan) {
          setPlan(res.trip_plan);
          setMobilePane('canvas');
        }
      } catch (e) {
        if (sessionRef.current !== sessionId) return;
        setLastFailed(text);
        setMessages((m) => [
          ...m,
          { id: uuid(), role: 'error', text: e instanceof Error ? e.message : 'Агент не ответил. Попробуйте ещё раз.' },
        ]);
      } finally {
        if (sessionRef.current === sessionId) setLoading(false);
      }
    },
    [sessionId, demo.userId],
  );

  const pickDeal = (deal: HotDeal) => send(`Хочу горящий тур: ${deal.hotel_name}, ${deal.destination}`);

  const greeting = useMemo(() => {
    if (!profile) return 'Привет! Я агент «О!дин запрос». Опишите поездку одной фразой — подберу отель, билеты и трансфер и проверю все стыковки.';
    const first = profile.name.split(' ')[0];
    const notes = [
      profile.preferences.family,
      profile.preferences.has_pets && profile.preferences.pet_details,
      profile.preferences.has_schengen_visa && 'есть шенгенская виза',
    ].filter(Boolean);
    return `Здравствуйте, ${first}! Помню ваши предпочтения: ${notes.join(', ')}. Куда отправимся?`;
  }, [profile]);

  const chips = messages.length === 0 ? STARTER_CHIPS[profileKey] : (suggestions ?? []);

  return (
    <div className="app">
      <Header
        view={view}
        onView={setView}
        profileKey={profileKey}
        onProfile={switchProfile}
        profile={profile}
        dataSource={dataSource}
      />

      {view === 'planner' && (
        <main className={`split split--${mobilePane}`}>
          <div className="mobile-switch">
            <button className={mobilePane === 'chat' ? 'is-active' : ''} onClick={() => setMobilePane('chat')}>
              💬 Чат
            </button>
            <button className={mobilePane === 'canvas' ? 'is-active' : ''} onClick={() => setMobilePane('canvas')}>
              🗺️ Поездка{plan ? ' •' : ''}
            </button>
          </div>
          <ChatPanel
            messages={messages}
            loading={loading}
            chips={chips}
            activePlanId={plan?.id ?? null}
            greeting={greeting}
            onSend={send}
            onRetry={() => lastFailed && send(lastFailed)}
            onOpenPlan={(p) => {
              setPlan(p);
              setMobilePane('canvas');
            }}
          />
          <TripCanvas
            plan={plan}
            loading={loading}
            onCheckout={() => setCheckoutOpen(true)}
            onInquire={() => plan && setInquiry({ hotelId: plan.hotel.id, hotelName: plan.hotel.name })}
            onOpenTrips={() => setView('trips')}
            onExample={send}
          />
        </main>
      )}

      {view === 'deals' && <HotDeals onPick={pickDeal} />}

      {view === 'trips' && (
        <MyTrips
          profile={profile}
          refreshKey={tripsRefresh}
          onInquire={(hotelId, hotelName) => setInquiry({ hotelId, hotelName })}
          onPointsChanged={loadProfile}
        />
      )}

      {checkoutOpen && plan && (
        <CheckoutModal
          plan={plan}
          profile={profile}
          onClose={() => setCheckoutOpen(false)}
          onBooked={() => {
            const booked = { ...plan, status: 'booked' };
            setPlan(booked);
            setMessages((m) => m.map((x) => (x.plan?.id === plan.id ? { ...x, plan: booked } : x)));
            setTripsRefresh((n) => n + 1);
            loadProfile();
          }}
          onOpenTrips={() => {
            setCheckoutOpen(false);
            setView('trips');
          }}
        />
      )}

      {inquiry && (
        <InquiryModal
          hotelId={inquiry.hotelId}
          hotelName={inquiry.hotelName}
          profile={profile}
          onClose={() => setInquiry(null)}
        />
      )}

      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
