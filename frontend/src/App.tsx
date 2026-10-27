import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, getDataSource, onDataSourceChange, type DataSource } from './api/client';
import type { AuthResponse, HotDeal, UserProfile } from './api/types';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { Header, type View } from './components/Header';
import { HotDeals } from './components/HotDeals';
import { HistorySidebar } from './components/HistorySidebar';
import { InquiryModal } from './components/InquiryModal';
import { MyTrips } from './components/MyTrips';
import { Planner, type Answer } from './components/Planner';
import { ProfileModal } from './components/ProfileModal';
import { TripDetails } from './components/TripDetails';
import { Toast } from './components/ui';
import { uuid } from './lib/format';
import { clearSession, getToken, saveSession, toProfile } from './lib/auth';
import { clearHistory, loadHistory, upsertHistory, type HistoryItem } from './lib/history';
import { accountKey, STARTER_CHIPS } from './lib/profiles';

const DEFAULT_HINTS = ['Найди дешевле', 'Что взять с собой?'];

export default function App() {
  const [view, setView] = useState<View>('planner');
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
  const [auth, setAuth] = useState<{ reason?: string; thenCheckout?: boolean } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);

  const plan = answer?.plan ?? null;
  const userId = profile?.id ?? null;

  // Для записи в историю после ответа агента нужны актуальные запрос и уточнения.
  const dialogRef = useRef({ request, refinements });
  dialogRef.current = { request, refinements };

  useEffect(() => onDataSourceChange(setDataSource), []);
  useEffect(() => {
    api.health().catch(() => undefined);
  }, []);

  // Профиль берём по сохранённому токену; если токен протух — выходим молча.
  const loadProfile = useCallback(() => {
    if (!getToken()) return;
    api.auth
      .me()
      .then((u) => setProfile(toProfile(u)))
      .catch(() => {
        clearSession();
        setProfile(null);
      });
  }, []);

  useEffect(loadProfile, [loadProfile]);

  const resetDialog = () => {
    setRequest('');
    setRefinements([]);
    setAnswer(null);
    setVariants([]);
    setSuggestions(null);
    setError(null);
  };

  const switchSession = (next: string) => {
    sessionRef.current = next;
    setSessionId(next);
    setLoading(false);
  };

  const newRequest = () => {
    if (loading) return;
    switchSession(uuid());
    resetDialog();
    setHistoryOpen(false);
    setView('planner');
  };

  // Вход не сбрасывает диалог: бэкенд переносит гостевую корзину по session_id.
  const onAuthed = (res: AuthResponse) => {
    saveSession(res.access_token, res.user.id);
    setProfile(toProfile(res.user));
    const thenCheckout = auth?.thenCheckout;
    setAuth(null);
    const first = res.user.name.split(' ')[0];
    if (res.welcome_bonus_applied) setToast(`${first}, добро пожаловать! Начислили приветственные баллы`);
    else if (res.cart_transferred) setToast(`Здравствуйте, ${first}! Поездка сохранилась в вашем профиле`);
    else setToast(`Здравствуйте, ${first}!`);
    if (thenCheckout && plan) setCheckoutOpen(true);
  };

  const logout = () => {
    clearSession();
    setProfile(null);
    setProfileOpen(false);
    setCheckoutOpen(false);
    setDetailsOpen(false);
    switchSession(uuid());
    resetDialog();
    setView('planner');
    setToast('Вы вышли из профиля');
  };

  const remember = (sid: string, next: Answer) =>
    setHistory(
      upsertHistory({
        sessionId: sid,
        requestText: dialogRef.current.request,
        refinements: dialogRef.current.refinements,
        answer: { reply: next.reply, plan: next.plan },
      }),
    );

  const pickHistory = (item: HistoryItem) => {
    if (loading) return;
    switchSession(item.sessionId);
    const restored: Answer = { id: uuid(), reply: item.answer.reply, plan: item.answer.plan };
    setRequest(item.requestText);
    setRefinements(item.refinements);
    setAnswer(restored);
    setVariants(restored.plan ? [restored] : []);
    setSuggestions(null);
    setError(null);
    setHistoryOpen(false);
    setView('planner');
  };

  const talk = useCallback(
    async (text: string, sid0: string = sessionId) => {
      setView('planner');
      setError(null);
      setLastSent(text);
      setLoading(true);
      try {
        const res = await api.chat({ message: text, session_id: sid0, user_id: userId });
        if (sessionRef.current !== sid0) return;
        const sid = res.session_id || sid0;
        if (sid !== sid0) switchSession(sid);
        const next: Answer = { id: uuid(), reply: res.reply, plan: res.trip_plan };
        setAnswer(next);
        remember(sid, next);
        if (next.plan) setVariants((v) => [...v, next].slice(-5));
        setSuggestions(res.suggestions ?? null);
      } catch (e) {
        if (sessionRef.current !== sid0) return;
        setError(e instanceof Error ? e.message : 'Агент не ответил. Попробуйте ещё раз.');
      } finally {
        if (sessionRef.current === sid0) setLoading(false);
      }
    },
    [sessionId, userId],
  );

  const ask = (text: string) => {
    // Новая фраза — новая сессия и новые варианты: старые слоты агента относились к другому запросу.
    const next = uuid();
    switchSession(next);
    setRequest(text);
    setRefinements([]);
    dialogRef.current = { request: text, refinements: [] };
    setVariants([]);
    talk(text, next);
  };

  const refine = (text: string) => {
    setRefinements((r) => [...r, text]);
    dialogRef.current = { ...dialogRef.current, refinements: [...dialogRef.current.refinements, text] };
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
    if (!notes.length) return `${first}, куда на этот раз? Расскажите одной фразой`;
    return `${first}, помню: ${notes.join(', ').toLowerCase()}. Куда на этот раз?`;
  }, [profile]);

  const markBooked = () => {
    if (!answer?.plan) return;
    const booked: Answer = { ...answer, plan: { ...answer.plan, status: 'booked' } };
    setAnswer(booked);
    setVariants((v) => v.map((x) => (x.id === booked.id ? booked : x)));
    remember(sessionId, booked);
  };

  return (
    <div className="app">
      <Header
        view={view}
        onView={setView}
        onNew={newRequest}
        onHistory={() => setHistoryOpen(true)}
        onLogin={() => setAuth({})}
        onProfile={() => setProfileOpen(true)}
        profile={profile}
        dataSource={dataSource}
        hasRequest={!!request}
      />

      {view === 'planner' && (
        <Planner
          profile={profile}
          greeting={greeting}
          examples={STARTER_CHIPS[accountKey(profile)]}
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
          onNeedAuth={() => {
            setCheckoutOpen(false);
            setAuth({ reason: 'Чтобы оплатить поездку', thenCheckout: true });
          }}
        />
      )}

      {auth && <AuthModal sessionId={sessionId} reason={auth.reason} onClose={() => setAuth(null)} onAuthed={onAuthed} />}

      {profileOpen && profile && (
        <ProfileModal
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onSaved={setProfile}
          onOpenTrips={() => {
            setProfileOpen(false);
            setView('trips');
          }}
          onLogout={logout}
        />
      )}

      {historyOpen && (
        <HistorySidebar
          items={history}
          activeSessionId={sessionId}
          onPick={pickHistory}
          onNew={newRequest}
          onClear={() => {
            clearHistory();
            setHistory([]);
          }}
          onClose={() => setHistoryOpen(false)}
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
