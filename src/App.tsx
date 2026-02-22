import { useEffect, useMemo, useState } from 'react';
import { init, miniApp, themeParams, viewport } from '@tma.js/sdk';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { loadState, saveProfile, setOnboardingCompleted, type AnonymousProfile, type PrivacyMode } from './lib/storage';

type Trigger = { id: string; label: string; suggestion: string };

type Screen = 'home' | 'settings';

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

const privacyVisibility: Record<PrivacyMode, string> = {
  private: 'Видно: поддержка, план и ресурсы. Скрыто: счетчик дней и персональные триггеры.',
  balanced: 'Видно: поддержка, план, ресурсы и триггеры. Скрыто: счетчик дней.',
  open: 'Видно все блоки: счетчик дней, триггеры, план и ресурсы.',
};

function getTelegramName(): string {
  const unsafeUser = (window as Window & { Telegram?: any }).Telegram?.WebApp?.initDataUnsafe?.user;
  return unsafeUser?.first_name ?? 'друг';
}

function HomeScreen({ profile, onOpenSettings }: { profile: AnonymousProfile; onOpenSettings: () => void }) {
  const [days, setDays] = useState(0);
  const [selectedTriggerId, setSelectedTriggerId] = useState<string>(triggers[0].id);
  const trigger = triggers.find((x) => x.id === selectedTriggerId) ?? triggers[0];

  return (
    <>
      <div className="row">
        <button onClick={onOpenSettings}>Настройки</button>
      </div>

      {profile.privacyMode === 'open' && (
        <section className="card">
          <h2>Трезвые дни</h2>
          <p className="big">{days}</p>
          <div className="row">
            <button onClick={() => setDays((d) => Math.max(0, d - 1))}>-1</button>
            <button onClick={() => setDays((d) => d + 1)}>+1 день</button>
            <button onClick={() => setDays(0)}>Сброс</button>
          </div>
        </section>
      )}

      {profile.privacyMode !== 'private' && (
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
      )}

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
    </>
  );
}

function SettingsScreen({
  profile,
  onBack,
  onChangePrivacy,
}: {
  profile: AnonymousProfile;
  onBack: () => void;
  onChangePrivacy: (mode: PrivacyMode) => void;
}) {
  return (
    <section className="card">
      <h2>Настройки приватности</h2>
      <p className="tip">Сменить режим можно в любой момент. {privacyVisibility[profile.privacyMode]}</p>
      <div className="stack">
        {(['private', 'balanced', 'open'] as const).map((mode) => (
          <button
            key={mode}
            className={profile.privacyMode === mode ? 'secondary active' : 'secondary'}
            onClick={() => onChangePrivacy(mode)}
          >
            {mode} — {privacyVisibility[mode]}
          </button>
        ))}
      </div>
      <button onClick={onBack}>На главный экран</button>
    </section>
  );
}

export function App() {
  const initialState = loadState();
  const [profile, setProfile] = useState<AnonymousProfile>(initialState.profile);
  const [onboardingCompleted, setIsOnboardingCompleted] = useState(initialState.onboardingCompleted);
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

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

  return (
    <main className="container" style={tgThemeStyles}>
      <h1>Опора</h1>
      <p className="subtitle">Привет, {getTelegramName()}. Ты не один — маленькие шаги каждый день.</p>

      {!onboardingCompleted ? (
        <OnboardingFlow
          profile={profile}
          onChange={setProfile}
          onComplete={() => {
            setOnboardingCompleted(profile);
            setIsOnboardingCompleted(true);
            setScreen('home');
          }}
        />
      ) : screen === 'home' ? (
        <HomeScreen profile={profile} onOpenSettings={() => setScreen('settings')} />
      ) : (
        <SettingsScreen
          profile={profile}
          onBack={() => setScreen('home')}
          onChangePrivacy={(mode) => setProfile({ ...profile, privacyMode: mode })}
        />
      )}
    </main>
  );
}
