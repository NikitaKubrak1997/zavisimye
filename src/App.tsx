import { useEffect, useMemo, useState } from 'react';
import { init, miniApp, themeParams, viewport } from '@tma.js/sdk';
import type { CheckIn } from './domain/CheckIn';
import type { Circle, CircleMember } from './domain/Circle';
import type { MicroStep } from './domain/MicroStep';
import type { Report } from './domain/Report';
import type { ValueCard } from './domain/ValueCard';

type Section = 'Home' | 'Values' | 'HardSteps' | 'Circle' | 'Settings';

type Trigger = { id: string; label: string; suggestion: string };

const triggers: Trigger[] = [
  { id: 'stress', label: 'Стресс', suggestion: 'Сделай дыхание 4-7-8 в течение 2 минут.' },
  { id: 'lonely', label: 'Одиночество', suggestion: 'Напиши человеку из круга поддержки.' },
  { id: 'bored', label: 'Скука', suggestion: 'Смени контекст: 10 минут прогулки или душ.' },
  { id: 'anger', label: 'Злость', suggestion: 'Выгрузи эмоции в заметку, не действуй импульсивно.' },
  { id: 'fatigue', label: 'Усталость', suggestion: 'Восстановление: вода + еда + 15 минут отдыха.' },
];

const resources = [
  'Если тяга слишком сильная — обратись к врачу/психотерапевту.',
  'Экстренно: 112 (если есть риск для жизни).',
  'Попроси близкого человека быть “контактом первой помощи”.',
];

const sections: Section[] = ['Home', 'Values', 'HardSteps', 'Circle', 'Settings'];
const valueContexts = ['Утро', 'Работа', 'Дом', 'Конфликт', 'Одиночество', 'Вечер'];

const initialCircle: Circle = {
  id: 'main-circle',
  name: 'Круг поддержки',
  rules: [
    'Без токсичных советов и обвинений.',
    'Конфиденциальность: не выносить личные истории наружу.',
    'Поддержка через заботу и конкретные шаги.',
  ],
  templatePosts: [
    'Сегодня мне сложно, нужна короткая поддержка 🙏',
    'Я замечаю триггер: ____. Что помогало вам?',
    'Сделал(а) маленький шаг: ____. Отмечаю прогресс.',
  ],
  members: [
    { id: 'm1', displayName: 'Аня', blocked: false },
    { id: 'm2', displayName: 'Илья', blocked: false },
    { id: 'm3', displayName: 'Маша', blocked: false },
  ],
};

const initialHardSteps: MicroStep[] = [
  { id: 's1', title: '90 секунд паузы и дыхания', done: false },
  { id: 's2', title: 'Уйти из опасного контекста', done: false },
  { id: 's3', title: 'Написать в круг поддержки', done: false },
  { id: 's4', title: 'Описать чувства в заметке', done: false },
];

function getTelegramName(): string {
  const unsafeUser = (window as Window & { Telegram?: any }).Telegram?.WebApp?.initDataUnsafe?.user;
  return unsafeUser?.first_name ?? 'друг';
}

function getSavedDays(): number {
  const raw = localStorage.getItem('cleanDays');
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getSavedValues(): ValueCard[] {
  const raw = localStorage.getItem('valueCards');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ValueCard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSavedCheckIns(): CheckIn[] {
  const raw = localStorage.getItem('checkIns');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CheckIn[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function deleteMyDataOnServer(): Promise<void> {
  const response = await fetch('/api/user/data', { method: 'DELETE' });
  if (!response.ok) {
    throw new Error('Не удалось удалить данные на сервере');
  }
}

export function App() {
  const [section, setSection] = useState<Section>('Home');
  const [days, setDays] = useState<number>(getSavedDays);
  const [selectedTriggerId, setSelectedTriggerId] = useState<string>(triggers[0].id);
  const [valueCards, setValueCards] = useState<ValueCard[]>(getSavedValues);
  const [hardSteps, setHardSteps] = useState<MicroStep[]>(initialHardSteps);
  const [circle, setCircle] = useState<Circle>(initialCircle);
  const [reports, setReports] = useState<Report[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>(getSavedCheckIns);
  const [newValueTitle, setNewValueTitle] = useState('');
  const [newValueDescription, setNewValueDescription] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');

  useEffect(() => {
    localStorage.setItem('cleanDays', String(days));
  }, [days]);

  useEffect(() => {
    localStorage.setItem('valueCards', JSON.stringify(valueCards));
  }, [valueCards]);

  useEffect(() => {
    localStorage.setItem('checkIns', JSON.stringify(checkIns));
  }, [checkIns]);

  useEffect(() => {
    try {
      init();
      if (miniApp.mount.isAvailable()) {
        miniApp.mount();
      }
      if (miniApp.ready.isAvailable()) {
        miniApp.ready();
      }
      if (viewport.mount.isAvailable()) {
        viewport.mount();
      }
    } catch {
      // App can run in regular browser for development.
    }
  }, []);

  const tgThemeStyles = useMemo(() => {
    const bg = themeParams.bgColor() ?? '#0f172a';
    const text = themeParams.textColor() ?? '#e2e8f0';
    const button = themeParams.buttonColor() ?? '#2563eb';

    return {
      '--bg': bg,
      '--text': text,
      '--button': button,
    } as React.CSSProperties;
  }, []);

  const trigger = triggers.find((x) => x.id === selectedTriggerId) ?? triggers[0];

  const addValueCard = () => {
    const title = newValueTitle.trim();
    const description = newValueDescription.trim();
    if (!title || !description) return;

    const now = new Date().toISOString();
    const card: ValueCard = {
      id: crypto.randomUUID(),
      title,
      description,
      contexts: [],
      createdAt: now,
      updatedAt: now,
    };

    setValueCards((prev) => [card, ...prev]);
    setNewValueTitle('');
    setNewValueDescription('');
  };

  const updateValueCard = (id: string, patch: Partial<Omit<ValueCard, 'id' | 'createdAt'>>) => {
    setValueCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? {
              ...card,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : card,
      ),
    );
  };

  const deleteValueCard = (id: string) => {
    setValueCards((prev) => prev.filter((card) => card.id !== id));
  };

  const toggleContext = (id: string, context: string) => {
    const card = valueCards.find((item) => item.id === id);
    if (!card) return;
    const hasContext = card.contexts.includes(context);
    const contexts = hasContext ? card.contexts.filter((c) => c !== context) : [...card.contexts, context];
    updateValueCard(id, { contexts });
  };

  const toggleStep = (id: string) => {
    setHardSteps((prev) => prev.map((step) => (step.id === id ? { ...step, done: !step.done } : step)));
  };

  const createCheckIn = (mood: CheckIn['mood']) => {
    const item: CheckIn = {
      id: crypto.randomUUID(),
      mood,
      note: `Отметка: ${mood}`,
      createdAt: new Date().toISOString(),
    };
    setCheckIns((prev) => [item, ...prev].slice(0, 20));
  };

  const submitReport = (member: CircleMember) => {
    const reason = window.prompt(`Причина жалобы на ${member.displayName}:`, 'Нарушение правил');
    if (!reason) return;
    const report: Report = {
      id: crypto.randomUUID(),
      circleId: circle.id,
      memberId: member.id,
      reason,
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [report, ...prev]);
  };

  const toggleBlockMember = (memberId: string) => {
    setCircle((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === memberId ? { ...m, blocked: !m.blocked } : m)),
    }));
  };

  const deleteMyData = async () => {
    setDeleteStatus('Удаляем данные...');
    try {
      await deleteMyDataOnServer();
      localStorage.clear();
      setDays(0);
      setValueCards([]);
      setCheckIns([]);
      setDeleteStatus('Данные удалены локально и на сервере.');
    } catch (error) {
      setDeleteStatus(error instanceof Error ? error.message : 'Ошибка удаления данных.');
    }
  };

  return (
    <main className="container" style={tgThemeStyles}>
      <h1>Опора</h1>
      <p className="subtitle">Привет, {getTelegramName()}. Ты не один — маленькие шаги каждый день.</p>

      <nav className="tabs">
        {sections.map((item) => (
          <button key={item} className={item === section ? 'active' : ''} onClick={() => setSection(item)}>
            {item}
          </button>
        ))}
      </nav>

      {section === 'Home' && (
        <>
          <section className="card">
            <h2>Трезвые дни</h2>
            <p className="big">{days}</p>
            <div className="row">
              <button onClick={() => setDays((d) => Math.max(0, d - 1))}>-1</button>
              <button onClick={() => setDays((d) => d + 1)}>+1 день</button>
              <button onClick={() => setDays(0)}>Сброс</button>
            </div>
          </section>

          <section className="card">
            <h2>Что сейчас триггерит?</h2>
            <select value={selectedTriggerId} onChange={(e) => setSelectedTriggerId(e.target.value)}>
              {triggers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="tip">Совет: {trigger.suggestion}</p>
          </section>
        </>
      )}

      {section === 'Values' && (
        <section className="card">
          <h2>Карточки ценностей</h2>
          <div className="column">
            <input
              value={newValueTitle}
              onChange={(e) => setNewValueTitle(e.target.value)}
              placeholder="Название ценности"
            />
            <textarea
              value={newValueDescription}
              onChange={(e) => setNewValueDescription(e.target.value)}
              placeholder="Почему это важно"
            />
            <button onClick={addValueCard}>Добавить ценность</button>
          </div>

          <div className="list">
            {valueCards.map((card) => (
              <article key={card.id} className="innerCard">
                <input value={card.title} onChange={(e) => updateValueCard(card.id, { title: e.target.value })} />
                <textarea
                  value={card.description}
                  onChange={(e) => updateValueCard(card.id, { description: e.target.value })}
                />
                <div className="row">
                  {valueContexts.map((context) => (
                    <label key={context} className="chip">
                      <input
                        type="checkbox"
                        checked={card.contexts.includes(context)}
                        onChange={() => toggleContext(card.id, context)}
                      />
                      {context}
                    </label>
                  ))}
                </div>
                <button onClick={() => deleteValueCard(card.id)}>Удалить карточку</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {section === 'HardSteps' && (
        <section className="card">
          <h2>HardSteps</h2>
          <ol>
            {hardSteps.map((step) => (
              <li key={step.id}>
                <label className="stepItem">
                  <input type="checkbox" checked={step.done} onChange={() => toggleStep(step.id)} />
                  <span>{step.title}</span>
                </label>
              </li>
            ))}
          </ol>
          <div className="row">
            <button onClick={() => createCheckIn('stable')}>Check-in: стабильно</button>
            <button onClick={() => createCheckIn('hard')}>Check-in: тяжело</button>
            <button onClick={() => createCheckIn('craving')}>Check-in: тяга</button>
          </div>
          <p className="tip">Последних check-in: {checkIns.length}</p>
        </section>
      )}

      {section === 'Circle' && (
        <section className="card">
          <h2>{circle.name}</h2>
          <h3>Правила</h3>
          <ul>
            {circle.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>

          <h3>Шаблонные посты</h3>
          <ul>
            {circle.templatePosts.map((post) => (
              <li key={post}>{post}</li>
            ))}
          </ul>

          <h3>Участники</h3>
          <div className="list">
            {circle.members.map((member) => (
              <div key={member.id} className="innerCard">
                <p>
                  {member.displayName} {member.blocked ? '(заблокирован)' : ''}
                </p>
                <div className="row">
                  <button onClick={() => submitReport(member)}>Пожаловаться</button>
                  <button onClick={() => toggleBlockMember(member.id)}>
                    {member.blocked ? 'Разблокировать' : 'Блокировать'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="tip">Жалоб отправлено: {reports.length}</p>
        </section>
      )}

      {section === 'Settings' && (
        <section className="card">
          <h2>Settings</h2>
          <p>Удаление затронет локальные данные и аккаунтные данные на сервере.</p>
          <button onClick={deleteMyData}>Удалить мои данные</button>
          {deleteStatus && <p className="tip">{deleteStatus}</p>}
        </section>
      )}

      <section className="card">
        <h2>Важно</h2>
        <ul>
          {resources.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
