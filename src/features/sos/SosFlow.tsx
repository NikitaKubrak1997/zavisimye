import { useEffect, useMemo, useState } from 'react';

export type SOSOutcome = 'completed' | 'closed';

export type SOSSession = {
  startedAt: string;
  selectedStep: number;
  outcome: SOSOutcome | null;
};

type SosFlowProps = {
  isOpen: boolean;
  onClose: () => void;
};

const SOS_STORAGE_KEY = 'sosSession.v1';

type FlowStep = {
  title: string;
  text: string;
};

const flowSteps: FlowStep[] = [
  {
    title: 'Пауза и дыхание',
    text: 'Сделай паузу на 90 секунд. Вдох 4 секунды, задержка 4, выдох 6.',
  },
  {
    title: 'Выйти из триггерной ситуации',
    text: 'Закрой чат/ленты, выйди в другое помещение или на короткую прогулку.',
  },
  {
    title: 'Выбери микро-шаг',
    text: 'Выбери одно безопасное действие на ближайшие 5 минут.',
  },
  {
    title: 'Контакт поддержки',
    text: 'Напиши коротко: «Мне сейчас трудно, побудь со мной на связи».',
  },
  {
    title: 'Завершение',
    text: 'Ты прошёл SOS-план. Зафиксируй, что помогло, и сделай маленький шаг заботы о себе.',
  },
];

const microSteps = ['Стакан воды', '10 приседаний', 'Тёплый душ', 'Дыхание 2 минуты'];

function loadSession(): SOSSession | null {
  try {
    const raw = localStorage.getItem(SOS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SOSSession;
    if (!parsed.startedAt || typeof parsed.selectedStep !== 'number') return null;

    return {
      startedAt: parsed.startedAt,
      selectedStep: Math.min(Math.max(parsed.selectedStep, 0), flowSteps.length - 1),
      outcome: parsed.outcome ?? null,
    };
  } catch {
    return null;
  }
}

function saveSession(session: SOSSession) {
  localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(session));
}

function buildBuddyText() {
  return 'Мне сейчас нужна поддержка. Можешь побыть со мной на связи ближайшие 10 минут?';
}

function buildTelegramShareUrl(text: string) {
  return `https://t.me/share/url?url=${encodeURIComponent('https://t.me')}&text=${encodeURIComponent(text)}`;
}

async function contactBuddy() {
  const text = buildBuddyText();

  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch {
      // Fallback to link in case share menu was unavailable/cancelled.
    }
  }

  const telegramLink = buildTelegramShareUrl(text);
  const tgWebApp = (window as Window & { Telegram?: any }).Telegram?.WebApp;

  if (tgWebApp?.openTelegramLink) {
    tgWebApp.openTelegramLink(telegramLink);
    return;
  }

  window.open(telegramLink, '_blank', 'noopener,noreferrer');
}

export function SosFlow({ isOpen, onClose }: SosFlowProps) {
  const [session, setSession] = useState<SOSSession | null>(null);
  const [microStep, setMicroStep] = useState(microSteps[0]);
  const [hasResumableSession, setHasResumableSession] = useState(false);

  useEffect(() => {
    const existing = loadSession();
    if (existing && !existing.outcome) {
      setSession(existing);
      setHasResumableSession(true);
    }
  }, []);

  const currentStep = useMemo(() => {
    return session?.selectedStep ?? 0;
  }, [session]);

  const isFinalStep = currentStep === flowSteps.length - 1;

  const startSession = () => {
    const created: SOSSession = {
      startedAt: new Date().toISOString(),
      selectedStep: 0,
      outcome: null,
    };
    saveSession(created);
    setSession(created);
  };

  const updateStep = (nextStep: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, selectedStep: nextStep };
      saveSession(updated);
      return updated;
    });
  };

  const finish = (outcome: SOSOutcome) => {
    setSession((prev) => {
      if (!prev) return prev;
      const finished = { ...prev, selectedStep: flowSteps.length - 1, outcome };
      saveSession(finished);
      return finished;
    });
  };

  const closeFlow = () => {
    if (session && !session.outcome) {
      finish('closed');
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="sos-overlay" role="dialog" aria-modal="true" aria-label="SOS помощь">
      <section className="sos-sheet card">
        <div className="sos-head">
          <h2>SOS-помощь</h2>
          <button className="ghost-btn" onClick={closeFlow}>
            Закрыть
          </button>
        </div>

        {!session ? (
          <>
            <p className="tip">
              {hasResumableSession
                ? 'Найдена незавершённая SOS-сессия. Можно начать заново.'
                : 'Запусти SOS-поток, чтобы пройти короткие шаги стабилизации.'}
            </p>
            <button onClick={startSession}>Начать SOS</button>
          </>
        ) : (
          <>
            <p className="tip">
              Шаг {currentStep + 1} из {flowSteps.length}
            </p>
            <h3>{flowSteps[currentStep].title}</h3>
            <p>{flowSteps[currentStep].text}</p>

            {currentStep === 2 && (
              <label className="micro-step-picker">
                Микро-шаг
                <select value={microStep} onChange={(e) => setMicroStep(e.target.value)}>
                  {microSteps.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="row">
              {currentStep > 0 && <button onClick={() => updateStep(currentStep - 1)}>Назад</button>}
              {!isFinalStep && <button onClick={() => updateStep(currentStep + 1)}>Дальше</button>}
              {isFinalStep && (
                <>
                  <button onClick={contactBuddy}>Связаться с buddy</button>
                  <button onClick={() => finish('completed')}>Завершить SOS</button>
                </>
              )}
            </div>

            {session.outcome && (
              <p className="tip">Сессия завершена ({session.outcome}). Можно закрыть окно SOS.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
