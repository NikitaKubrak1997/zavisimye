import { useState } from 'react';
import type { AnonymousProfile, PrivacyMode } from '../../lib/storage';

const valuesOptions = ['Здоровье', 'Семья', 'Свобода', 'Фокус', 'Уважение к себе'];
const contextOptions = ['Утро', 'Вечер', 'Работа', 'Выходные', 'Одиночество'];

type OnboardingFlowProps = {
  profile: AnonymousProfile;
  onChange: (profile: AnonymousProfile) => void;
  onComplete: () => void;
};

const privacyDescriptions: Record<PrivacyMode, string> = {
  private: 'Максимум приватности: только безопасные советы, без отображения прогресса.',
  balanced: 'Баланс: видны советы и персональные триггеры, но без явного счетчика дней.',
  open: 'Открытый режим: все блоки видимы, включая счетчик прогресса.',
};

function toggleItem(items: string[], item: string): string[] {
  return items.includes(item) ? items.filter((x) => x !== item) : [...items, item];
}

export function OnboardingFlow({ profile, onChange, onComplete }: OnboardingFlowProps) {
  const steps = ['Welcome', 'PrivacyMode', 'ValuesPicker', 'ContextsPicker'] as const;
  const [stepIndex, setStepIndex] = useState(0);

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <section className="card">
      <p className="step">Шаг {stepIndex + 1} из {steps.length}</p>

      {step === 'Welcome' && (
        <>
          <h2>Добро пожаловать</h2>
          <p className="tip">Мы сохраним только анонимный профиль: режим приватности, ценности и контексты риска.</p>
        </>
      )}

      {step === 'PrivacyMode' && (
        <>
          <h2>Режим приватности</h2>
          <div className="stack">
            {(['private', 'balanced', 'open'] as const).map((mode) => (
              <button
                key={mode}
                className={profile.privacyMode === mode ? 'secondary active' : 'secondary'}
                onClick={() => onChange({ ...profile, privacyMode: mode })}
              >
                {mode} — {privacyDescriptions[mode]}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'ValuesPicker' && (
        <>
          <h2>Что для тебя важно?</h2>
          <div className="row">
            {valuesOptions.map((value) => (
              <button
                key={value}
                className={profile.selectedValues.includes(value) ? 'secondary active' : 'secondary'}
                onClick={() =>
                  onChange({
                    ...profile,
                    selectedValues: toggleItem(profile.selectedValues, value),
                  })
                }
              >
                {value}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'ContextsPicker' && (
        <>
          <h2>В каких контекстах сложнее всего?</h2>
          <div className="row">
            {contextOptions.map((ctx) => (
              <button
                key={ctx}
                className={profile.selectedContexts.includes(ctx) ? 'secondary active' : 'secondary'}
                onClick={() =>
                  onChange({
                    ...profile,
                    selectedContexts: toggleItem(profile.selectedContexts, ctx),
                  })
                }
              >
                {ctx}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="row">
        <button disabled={isFirst} onClick={() => setStepIndex((s) => Math.max(0, s - 1))}>
          Назад
        </button>
        {!isLast ? (
          <button onClick={() => setStepIndex((s) => Math.min(steps.length - 1, s + 1))}>Дальше</button>
        ) : (
          <button onClick={onComplete}>Завершить</button>
        )}
      </div>
    </section>
  );
}
