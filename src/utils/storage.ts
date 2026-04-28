import type { AppSettings, BasicHistoryEntry, HibernatedTab, SmartTabSession } from '../types';

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
  ignoredDomains: []
};

async function getLocal<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] ?? fallback) as T;
}

async function setLocal<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function getSettings(): Promise<AppSettings> {
  const stored = await getLocal<Partial<AppSettings>>(KEYS.settings, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    ignoredDomains: Array.isArray(stored.ignoredDomains) ? stored.ignoredDomains : []
  };
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const normalized: AppSettings = {
    inactiveMinutes: Math.max(1, Number(settings.inactiveMinutes) || DEFAULT_SETTINGS.inactiveMinutes),
    autoGrouping: Boolean(settings.autoGrouping),
    autoHibernate: Boolean(settings.autoHibernate),
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
