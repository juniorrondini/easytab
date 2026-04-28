import type { AppSettings, BasicHistoryEntry, HibernatedTab, OrganizationProfile, SmartTabSession } from '../types';

const KEYS = {
  settings: 'settings',
  sessions: 'sessions',
  hibernatedTabs: 'hibernatedTabs',
  history: 'history'
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  inactiveMinutes: 45,
  autoGrouping: false,
  autoHibernate: false,
  ignoredDomains: [],
  activeProfileId: 'balanced',
  customRules: [],
  profiles: [
    {
      id: 'balanced',
      name: 'Balanceado',
      description: 'Organiza por todos os contextos principais.',
      enabledCategories: [
        'ai',
        'chats',
        'development',
        'devops',
        'documentation',
        'learning',
        'videos',
        'design',
        'productivity',
        'email',
        'social',
        'news',
        'shopping',
        'finance',
        'other'
      ]
    },
    {
      id: 'developer',
      name: 'Modo Dev',
      description: 'Prioriza desenvolvimento, documentação, cloud, IA e produtividade.',
      enabledCategories: ['ai', 'chats', 'development', 'devops', 'documentation', 'productivity', 'email', 'other']
    },
    {
      id: 'research',
      name: 'Pesquisa',
      description: 'Prioriza aprendizado, vídeos, documentação, notícias e IA.',
      enabledCategories: ['ai', 'documentation', 'learning', 'videos', 'news', 'productivity', 'other']
    },
    {
      id: 'focus',
      name: 'Foco',
      description: 'Mantém só os contextos mais úteis para trabalho profundo.',
      enabledCategories: ['ai', 'development', 'devops', 'documentation', 'productivity', 'email', 'other']
    }
  ]
};

function normalizeProfiles(profiles?: OrganizationProfile[]): OrganizationProfile[] {
  const defaults = DEFAULT_SETTINGS.profiles;
  if (!Array.isArray(profiles) || profiles.length === 0) {
    return defaults;
  }

  const merged = [...defaults];
  for (const profile of profiles) {
    const index = merged.findIndex((item) => item.id === profile.id);
    if (index >= 0) {
      merged[index] = { ...merged[index], ...profile };
    } else {
      merged.push(profile);
    }
  }
  return merged;
}

async function getLocal<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] ?? fallback) as T;
}

async function setLocal<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function getSettings(): Promise<AppSettings> {
  const stored = await getLocal<Partial<AppSettings>>(KEYS.settings, {});
  const profiles = normalizeProfiles(stored.profiles);
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    ignoredDomains: Array.isArray(stored.ignoredDomains) ? stored.ignoredDomains : [],
    customRules: Array.isArray(stored.customRules) ? stored.customRules : [],
    profiles,
    activeProfileId: profiles.some((profile) => profile.id === stored.activeProfileId)
      ? (stored.activeProfileId as string)
      : DEFAULT_SETTINGS.activeProfileId
  };
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const normalized: AppSettings = {
    inactiveMinutes: Math.max(1, Number(settings.inactiveMinutes) || DEFAULT_SETTINGS.inactiveMinutes),
    autoGrouping: Boolean(settings.autoGrouping),
    autoHibernate: Boolean(settings.autoHibernate),
    activeProfileId: settings.activeProfileId || DEFAULT_SETTINGS.activeProfileId,
    profiles: normalizeProfiles(settings.profiles),
    customRules: (settings.customRules ?? []).map((rule) => ({
      ...rule,
      id: rule.id || crypto.randomUUID(),
      label: rule.label.trim() || rule.match.trim(),
      match: rule.match.trim().toLowerCase(),
      enabled: Boolean(rule.enabled)
    })),
    ignoredDomains: settings.ignoredDomains
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean)
  };
  await setLocal(KEYS.settings, normalized);
  return normalized;
}

export async function getSessions(): Promise<SmartTabSession[]> {
  return getLocal<SmartTabSession[]>(KEYS.sessions, []);
}

export async function saveSessions(sessions: SmartTabSession[]): Promise<void> {
  await setLocal(KEYS.sessions, sessions);
}

export async function getHibernatedTabs(): Promise<HibernatedTab[]> {
  return getLocal<HibernatedTab[]>(KEYS.hibernatedTabs, []);
}

export async function saveHibernatedTab(tab: HibernatedTab): Promise<void> {
  const tabs = await getHibernatedTabs();
  await setLocal(KEYS.hibernatedTabs, [tab, ...tabs.filter((item) => item.id !== tab.id)]);
}

export async function removeHibernatedTab(id: string): Promise<HibernatedTab | undefined> {
  const tabs = await getHibernatedTabs();
  const found = tabs.find((item) => item.id === id);
  await setLocal(
    KEYS.hibernatedTabs,
    tabs.filter((item) => item.id !== id)
  );
  return found;
}

export async function addHistory(action: string, details?: string): Promise<void> {
  const history = await getLocal<BasicHistoryEntry[]>(KEYS.history, []);
  const entry: BasicHistoryEntry = {
    id: crypto.randomUUID(),
    action,
    details,
    createdAt: Date.now()
  };
  await setLocal(KEYS.history, [entry, ...history].slice(0, 100));
}

export async function exportSavedData(): Promise<{
  settings: AppSettings;
  sessions: SmartTabSession[];
  hibernatedTabs: HibernatedTab[];
  history: BasicHistoryEntry[];
}> {
  const [settings, sessions, hibernatedTabs, history] = await Promise.all([
    getSettings(),
    getSessions(),
    getHibernatedTabs(),
    getLocal<BasicHistoryEntry[]>(KEYS.history, [])
  ]);
  return { settings, sessions, hibernatedTabs, history };
}

export async function importSavedData(data: Partial<Awaited<ReturnType<typeof exportSavedData>>>): Promise<void> {
  if (data.settings) {
    await saveSettings(data.settings);
  }
  if (Array.isArray(data.sessions)) {
    await saveSessions(data.sessions);
  }
  if (Array.isArray(data.hibernatedTabs)) {
    await setLocal(KEYS.hibernatedTabs, data.hibernatedTabs);
  }
}

export async function clearSavedData(): Promise<void> {
  await chrome.storage.local.remove(Object.values(KEYS));
}
