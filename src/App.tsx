import { useEffect, useMemo, useState } from 'react';
import { getTelegramName, getTelegramTheme, initializeTelegramApi } from './telegram';

type Trigger = { id: string; label: string; suggestion: string };
type OnboardingState = { step: number; goal: string; supportContact: string };
type SosState = { step: number; intensity: string; action: string };
type ValueCardState = { step: number; value: string; whyItMatters: string; firstAction: string };

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

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => loadState<T>(key, fallback));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

export function App() {
  const [days, setDays] = usePersistentState<number>('cleanDays', 0);
  const [selectedTriggerId, setSelectedTriggerId] = usePersistentState<string>('selectedTriggerId', triggers[0].id);
  const [onboarding, setOnboarding] = usePersistentState<OnboardingState>('onboarding', {
    step: 1,
    goal: '',
    supportContact: '',
  });
  const [sos, setSos] = usePersistentState<SosState>('sos', {
    step: 1,
    intensity: '3',
    action: '',
  });
  const [valueCard, setValueCard] = usePersistentState<ValueCardState>('valueCard', {
    step: 1,
    value: '',
    whyItMatters: '',
    firstAction: '',
  });

  useEffect(() => {
    initializeTelegramApi();
  }, []);

  const tgThemeStyles = useMemo(() => {
    const { bg, text, button } = getTelegramTheme();
    return {
      '--bg': bg,
      '--text': text,
      '--button': button,
    } as React.CSSProperties;
  }, []);

  const trigger = triggers.find((x) => x.id === selectedTriggerId) ?? triggers[0];

  return (
    <main className="container" style={tgThemeStyles}>
      <h1 tabIndex={0}>Опора</h1>
      <p className="subtitle">Привет, {getTelegramName()}. Ты не один — маленькие шаги каждый день.</p>

      <section className="card" aria-label="Счетчик трезвых дней">
        <h2>Трезвые дни</h2>
        <p className="big" aria-live="polite">
          {days}
        </p>
        <div className="row">
          <button aria-label="Уменьшить счетчик на один день" onClick={() => setDays((d) => Math.max(0, d - 1))}>
            -1
          </button>
          <button aria-label="Увеличить счетчик на один день" onClick={() => setDays((d) => d + 1)}>
            +1 день
          </button>
          <button aria-label="Сбросить счетчик трезвых дней" onClick={() => setDays(0)}>
            Сброс
          </button>
        </div>
      </section>

      <section className="card" aria-label="Онбординг">
        <h2>Онбординг (шаг {onboarding.step}/2)</h2>
        {onboarding.step === 1 ? (
          <>
            <label htmlFor="goal">Главная цель на ближайшую неделю</label>
            <input
              id="goal"
              aria-label="Цель на неделю"
              value={onboarding.goal}
              onChange={(e) => setOnboarding((s) => ({ ...s, goal: e.target.value }))}
            />
            <button onClick={() => setOnboarding((s) => ({ ...s, step: 2 }))}>Далее</button>
          </>
        ) : (
          <>
            <label htmlFor="contact">Контакт поддержки</label>
            <input
              id="contact"
              aria-label="Контакт поддержки"
              value={onboarding.supportContact}
              onChange={(e) => setOnboarding((s) => ({ ...s, supportContact: e.target.value }))}
            />
            <div className="row">
              <button onClick={() => setOnboarding((s) => ({ ...s, step: 1 }))}>Назад</button>
              <button onClick={() => setOnboarding((s) => ({ ...s, step: 2 }))}>Готово</button>
            </div>
          </>
        )}
      </section>

      <section className="card" aria-label="Триггеры">
        <h2>Что сейчас триггерит?</h2>
        <label htmlFor="trigger-select" className="visually-hidden">
          Выбери триггер
        </label>
        <select
          id="trigger-select"
          aria-label="Выбор текущего триггера"
          value={selectedTriggerId}
          onChange={(e) => setSelectedTriggerId(e.target.value)}
        >
          {triggers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="tip">Совет: {trigger.suggestion}</p>
      </section>

      <section className="card" aria-label="SOS план">
        <h2>SOS (шаг {sos.step}/2)</h2>
        {sos.step === 1 ? (
          <>
            <label htmlFor="intensity">Сила тяги (1-5)</label>
            <input
              id="intensity"
              aria-label="Оценка силы тяги"
              type="range"
              min="1"
              max="5"
              value={sos.intensity}
              onChange={(e) => setSos((s) => ({ ...s, intensity: e.target.value }))}
            />
            <button onClick={() => setSos((s) => ({ ...s, step: 2 }))}>Далее</button>
          </>
        ) : (
          <>
            <label htmlFor="action">Первое безопасное действие</label>
            <textarea
              id="action"
              aria-label="Первое безопасное действие"
              value={sos.action}
              onChange={(e) => setSos((s) => ({ ...s, action: e.target.value }))}
            />
            <div className="row">
              <button onClick={() => setSos((s) => ({ ...s, step: 1 }))}>Назад</button>
              <button onClick={() => setSos((s) => ({ ...s, step: 2 }))}>Сохранить</button>
            </div>
          </>
        )}
      </section>

      <section className="card" aria-label="Форма карточки ценностей">
        <h2>ValueCard (шаг {valueCard.step}/3)</h2>
        {valueCard.step === 1 && (
          <>
            <label htmlFor="value">Моя ценность</label>
            <input
              id="value"
              aria-label="Моя ценность"
              value={valueCard.value}
              onChange={(e) => setValueCard((s) => ({ ...s, value: e.target.value }))}
            />
            <button onClick={() => setValueCard((s) => ({ ...s, step: 2 }))}>Далее</button>
          </>
        )}
        {valueCard.step === 2 && (
          <>
            <label htmlFor="matters">Почему это важно</label>
            <textarea
              id="matters"
              aria-label="Почему ценность важна"
              value={valueCard.whyItMatters}
              onChange={(e) => setValueCard((s) => ({ ...s, whyItMatters: e.target.value }))}
            />
            <div className="row">
              <button onClick={() => setValueCard((s) => ({ ...s, step: 1 }))}>Назад</button>
              <button onClick={() => setValueCard((s) => ({ ...s, step: 3 }))}>Далее</button>
            </div>
          </>
        )}
        {valueCard.step === 3 && (
          <>
            <label htmlFor="first-action">Первый шаг сегодня</label>
            <input
              id="first-action"
              aria-label="Первый шаг сегодня"
              value={valueCard.firstAction}
              onChange={(e) => setValueCard((s) => ({ ...s, firstAction: e.target.value }))}
            />
            <div className="row">
              <button onClick={() => setValueCard((s) => ({ ...s, step: 2 }))}>Назад</button>
              <button onClick={() => setValueCard((s) => ({ ...s, step: 3 }))}>Готово</button>
            </div>
          </>
        )}
      </section>

      <section className="card" aria-label="План если накроет">
        <h2>План “если накроет”</h2>
        <ol>
          <li>Пауза 90 секунд и глубокое дыхание.</li>
          <li>Уйти из ситуации/чата, которая усиливает тягу.</li>
          <li>Написать человеку поддержки.</li>
          <li>Открыть заметку и описать состояние словами.</li>
        </ol>
      </section>

      <section className="card" aria-label="Важные ресурсы">
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
