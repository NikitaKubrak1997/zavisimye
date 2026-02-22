import { init, miniApp, themeParams, viewport } from '@tma.js/sdk';

type MethodWithAvailability<T> = (() => T) & { isAvailable?: () => boolean };

function canUse<T>(method: MethodWithAvailability<T> | undefined): method is MethodWithAvailability<T> {
  return typeof method === 'function' && typeof method.isAvailable === 'function' && method.isAvailable();
}

function readIfAvailable<T>(method: MethodWithAvailability<T> | undefined, fallback: T): T {
  return canUse(method) ? method() : fallback;
}

export function initializeTelegramApi(): void {
  try {
    init();
    if (canUse(miniApp.mount)) {
      miniApp.mount();
    }
    if (canUse(miniApp.ready)) {
      miniApp.ready();
    }
    if (canUse(viewport.mount)) {
      viewport.mount();
    }
  } catch {
    // Supports running outside Telegram.
  }
}

export function getTelegramName(): string {
  const unsafeUser = (window as Window & { Telegram?: any }).Telegram?.WebApp?.initDataUnsafe?.user;
  return unsafeUser?.first_name ?? 'друг';
}

export function getTelegramTheme() {
  const bg = readIfAvailable(themeParams.bgColor as MethodWithAvailability<string> | undefined, '#0f172a');
  const text = readIfAvailable(themeParams.textColor as MethodWithAvailability<string> | undefined, '#e2e8f0');
  const button = readIfAvailable(themeParams.buttonColor as MethodWithAvailability<string> | undefined, '#2563eb');

  return { bg, text, button };
}
