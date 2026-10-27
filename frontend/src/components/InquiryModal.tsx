import { useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { UserProfile } from '../api/types';
import { Icon } from './Icon';
import { Markdown } from './Markdown';
import { Modal, Spinner } from './ui';

const CATEGORIES = [
  { key: 'pets', label: 'Питомцы', icon: 'paw' },
  { key: 'early_checkin', label: 'Ранний заезд', icon: 'clock' },
  { key: 'kids', label: 'Дети', icon: 'kid' },
  { key: 'parking', label: 'Парковка', icon: 'parking' },
  { key: 'other', label: 'Другое', icon: 'chat' },
];

function template(category: string, profile: UserProfile | null) {
  switch (category) {
    case 'pets':
      return profile?.preferences.pet_details
        ? `Можно ли заселиться с собакой породы ${profile.preferences.pet_details.match(/\((.+)\)/)?.[1] ?? 'корги'} весом 11 кг?`
        : 'Можно ли заселиться с небольшой собакой?';
    case 'early_checkin':
      return 'Прилетаем утром — можно ли заселиться пораньше, около 10:00?';
    case 'kids':
      return 'Будет ли в номере детская кроватка? С какого возраста принимают в детский клуб?';
    case 'parking':
      return 'Есть ли у отеля парковка и сколько она стоит?';
    default:
      return '';
  }
}

interface Props {
  hotelId: number;
  hotelName: string;
  profile: UserProfile | null;
  onClose: () => void;
}

export function InquiryModal({ hotelId, hotelName, profile, onClose }: Props) {
  const initialCategory = profile?.preferences.has_pets ? 'pets' : 'early_checkin';
  const [category, setCategory] = useState(initialCategory);
  const [question, setQuestion] = useState(template(initialCategory, profile));
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const [error, setError] = useState('');

  const pick = (c: string) => {
    setCategory(c);
    setQuestion(template(c, profile));
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.inquire(hotelId, { user_id: profile?.id ?? null, category, question: q });
      setHistory((h) => [...h, { q, a: res.answer }]);
      setQuestion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось связаться с отелем');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal kicker={hotelName} title="Спросить у отеля" onClose={onClose}>
      <p className="fine">Агент передаст вопрос отельеру и принесёт ответ сюда — обычно это пара секунд.</p>

      {history.length > 0 && (
        <div className="qa">
          {history.map((h, i) => (
            <div key={i} className="qa__item">
              <div className="qa__q">{h.q}</div>
              <div className="qa__a">
                <span className="kicker">Отель</span>
                <Markdown text={h.a.replace(/^Отельер ответил:\s*/, '')} />
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={send} className="inquiry">
        <div className="tabs">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.key}
              className={category === c.key ? 'is-active' : ''}
              onClick={() => pick(c.key)}
            >
              <Icon name={c.icon} size={15} /> {c.label}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ваш вопрос отелю"
          aria-label="Вопрос"
        />
        {error && <div className="field-error">{error}</div>}
        <button className="btn btn--ink" disabled={loading || !question.trim()}>
          {loading ? (
            <>
              <Spinner small /> Связываемся с отелем…
            </>
          ) : (
            'Отправить вопрос'
          )}
        </button>
      </form>
    </Modal>
  );
}
