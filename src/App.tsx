import { useEffect, useMemo, useState } from 'react';
import { init, miniApp, themeParams, viewport } from '@tma.js/sdk';
import { SosFlow } from './features/sos/SosFlow';

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

function getTelegramName(): string {
  const unsafeUser = (window as Window & { Telegram?: any }).Telegram?.WebApp?.initDataUnsafe?.user;
  return unsafeUser?.first_name ?? 'друг';
}

function getSavedDays(): number {
  const raw = localStorage.getItem('cleanDays');
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function App() {
  const [days, setDays] = useState<number>(getSavedDays);
  const [selectedTriggerId, setSelectedTriggerId] = useState<string>(triggers[0].id);
  const [isSosOpen, setIsSosOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cleanDays', String(days));
  }, [days]);

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

  return (
    <>
      <main className="container" style={tgThemeStyles}>
        <header className="app-header">
          <div>
            <h1>Опора</h1>
            <p className="subtitle">Привет, {getTelegramName()}. Ты не один — маленькие шаги каждый день.</p>
          </div>
          <button className="sos-button" onClick={() => setIsSosOpen(true)}>
            SOS
          </button>
        </header>

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

        <section className="card">
          <h2>План “если накроет”</h2>
          <ol>
            <li>Пауза 90 секунд и глубокое дыхание.</li>
            <li>Уйти из ситуации/чата, которая усиливает тягу.</li>
            <li>Написать человеку поддержки.</li>
            <li>Открыть заметку и описать состояние словами.</li>
          </ol>
        </section>

        <section className="card">
          <h2>Важно</h2>
          <ul>
            {resources.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      </main>

      <button className="sos-floating" onClick={() => setIsSosOpen(true)}>
        SOS
      </button>
      <SosFlow isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />
    </>
  );
}
