export type PrivacyMode = 'private' | 'balanced' | 'open';

export type AnonymousProfile = {
  privacyMode: PrivacyMode;
  selectedValues: string[];
  selectedContexts: string[];
};

type PersistedState = {
  onboardingCompleted: boolean;
  profile: AnonymousProfile;
};

const STORAGE_KEY = 'zavisimye.anonymous-state.v1';

const defaultProfile: AnonymousProfile = {
  privacyMode: 'private',
  selectedValues: [],
  selectedContexts: [],
};

const defaultState: PersistedState = {
  onboardingCompleted: false,
  profile: defaultProfile,
};

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;

    const parsed = JSON.parse(raw) as Partial<PersistedState>;

    const privacyMode = parsed.profile?.privacyMode;
    const selectedValues = Array.isArray(parsed.profile?.selectedValues)
      ? parsed.profile?.selectedValues.filter((x): x is string => typeof x === 'string')
      : [];
    const selectedContexts = Array.isArray(parsed.profile?.selectedContexts)
      ? parsed.profile?.selectedContexts.filter((x): x is string => typeof x === 'string')
      : [];

    const safeProfile: AnonymousProfile = {
      privacyMode: privacyMode === 'balanced' || privacyMode === 'open' ? privacyMode : 'private',
      selectedValues,
      selectedContexts,
    };

    return {
      onboardingCompleted: Boolean(parsed.onboardingCompleted),
      profile: safeProfile,
    };
  } catch {
    return defaultState;
  }
}

export function saveProfile(profile: AnonymousProfile): void {
  const current = loadState();
  const next: PersistedState = {
    ...current,
    profile,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function setOnboardingCompleted(profile: AnonymousProfile): void {
  const next: PersistedState = {
    onboardingCompleted: true,
    profile,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
