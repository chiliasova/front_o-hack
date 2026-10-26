import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, getDataSource, onDataSourceChange, type DataSource } from './api/client';
import type { HotDeal, UserProfile } from './api/types';
import { CheckoutModal } from './components/CheckoutModal';
import { Header, type View } from './components/Header';
import { HotDeals } from './components/HotDeals';
import { InquiryModal } from './components/InquiryModal';
import { MyTrips } from './components/MyTrips';
import { Planner, type Answer } from './components/Planner';
import { TripDetails } from './components/TripDetails';
import { Toast } from './components/ui';
import { uuid } from './lib/format';
import { DEMO_PROFILES, STARTER_CHIPS, type DemoProfile } from './lib/profiles';

const DEFAULT_HINTS = ['Найди дешевле', 'Что взять с собой?'];

export default function App() {
  const [view, setView] = useState<View>('planner');
  const [profileKey, setProfileKey] = useState<DemoProfile['key']>('alexey');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>(getDataSource());

  const [sessionId, setSessionId] = useState(uuid);
  // Текущая сессия для отбрасывания ответов, пришедших после смены профиля.
  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;

  // Запрос — одна фраза плюс уточнения к ней; ответ — текущий вариант поездки.
  const [request, setRequest] = useState('');
  const [refinements, setRefinements] = useState<string[]>([]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [variants, setVariants] = useState<Answer[]>([]);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [inquiry, setInquiry] = useState<{ hotelId: number; hotelName: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tripsRefresh, setTripsRefresh] = useState(0);

  const demo = DEMO_PROFILES.find((p) => p.key === profileKey)!;
  const plan = answer?.plan ?? null;

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

  const resetDialog = () => {
    setRequest('');
    setRefinements([]);
    setAnswer(null);
    setVariants([]);
    setSuggestions(null);
    setError(null);
  };

  // Смена профиля — новая сессия, чтобы жюри видело персонализацию с нуля.
  const switchProfile = (key: DemoProfile['key']) => {
    setProfileKey(key);
    const next = uuid();
    sessionRef.current = next;
    setSessionId(next);
    setLoading(false);
    resetDialog();
    setCheckoutOpen(false);
    setDetailsOpen(false);
    setView('planner');
    const p = DEMO_PROFILES.find((x) => x.key === key)!;
    setToast(`Вы вошли как: ${p.label}`);
  };

  const talk = useCallback(
    async (text: string) => {
      setView('planner');
      setError(null);
      setLastSent(text);
      setLoading(true);
      try {
        const res = await api.chat({ message: text, session_id: sessionId, user_id: demo.userId });
        if (sessionRef.current !== sessionId) return;
        if (res.session_id && res.session_id !== sessionId) setSessionId(res.session_id);
        const next: Answer = { id: uuid(), reply: res.reply, plan: res.trip_plan };
        setAnswer(next);
        if (next.plan) setVariants((v) => [...v, next].slice(-5));
        setSuggestions(res.suggestions ?? null);
      } catch (e) {
        if (sessionRef.current !== sessionId) return;
        setError(e instanceof Error ? e.message : 'Агент не ответил. Попробуйте ещё раз.');
      } finally {
        if (sessionRef.current === sessionId) setLoading(false);
      }
    },
    [sessionId, demo.userId],
  );

  const ask = (text: string) => {
    // Новая фраза — новые варианты: старые относились к другому запросу.
    setRequest(text);
    setRefinements([]);
    setVariants([]);
    talk(text);
  };

  const refine = (text: string) => {
    setRefinements((r) => [...r, text]);
    talk(text);
  };

  const pickDeal = (deal: HotDeal) => ask(`Хочу горящий тур: ${deal.hotel_name}, ${deal.destination}`);

  const greeting = useMemo(() => {
    if (!profile) return 'Расскажите одной фразой, как другу: куда, когда, с кем и на какой бюджет';
    const first = profile.name.split(' ')[0];
    const notes = [
      profile.preferences.family,
      profile.preferences.has_pets && profile.preferences.pet_details,
      profile.preferences.has_schengen_visa && 'есть шенген',
    ].filter(Boolean);
    return `${first}, помню: ${notes.join(', ').toLowerCase()}. Куда на этот раз?`;
  }, [profile]);

  const markBooked = () => {
    if (!answer?.plan) return;
    const booked: Answer = { ...answer, plan: { ...answer.plan, status: 'booked' } };
    setAnswer(booked);
    setVariants((v) => v.map((x) => (x.id === booked.id ? booked : x)));
  };

  return (
    <div className="app">
      <Header
        view={view}
        onView={setView}
        onNew={() => {
          if (loading) return;
          resetDialog();
          setView('planner');
        }}
        profileKey={profileKey}
        onProfile={switchProfile}
        profile={profile}
        dataSource={dataSource}
        hasRequest={!!request}
      />

      {view === 'planner' && (
        <Planner
          profile={profile}
          greeting={greeting}
          examples={STARTER_CHIPS[profileKey]}
          request={request}
          refinements={refinements}
          loading={loading}
          error={error}
          answer={answer}
          variants={variants}
          suggestions={suggestions ?? (plan ? DEFAULT_HINTS : [])}
          onAsk={ask}
          onRefine={refine}
          onRetry={() => lastSent && talk(lastSent)}
          onVariant={setAnswer}
          onDetails={() => setDetailsOpen(true)}
          onCheckout={() => setCheckoutOpen(true)}
          onInquire={() => plan && setInquiry({ hotelId: plan.hotel.id, hotelName: plan.hotel.name })}
          onOpenTrips={() => setView('trips')}
        />
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

      {detailsOpen && plan && (
        <TripDetails
          plan={plan}
          onClose={() => setDetailsOpen(false)}
          onInquire={() => {
            setDetailsOpen(false);
            setInquiry({ hotelId: plan.hotel.id, hotelName: plan.hotel.name });
          }}
          onCheckout={() => {
            setDetailsOpen(false);
            setCheckoutOpen(true);
          }}
        />
      )}

      {checkoutOpen && plan && (
        <CheckoutModal
          plan={plan}
          profile={profile}
          onClose={() => setCheckoutOpen(false)}
          onBooked={() => {
            markBooked();
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
