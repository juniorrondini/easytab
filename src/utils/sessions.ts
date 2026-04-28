import type { SavedTab, SmartTabSession } from '../types';
import { classifyTab, isExtensionOrBrowserUrl } from './tabClassifier';
import { getSessions, saveSessions } from './storage';

export function tabsToSavedTabs(tabs: chrome.tabs.Tab[]): SavedTab[] {
  return tabs
    .filter((tab) => tab.url && !isExtensionOrBrowserUrl(tab.url))
    .map((tab) => ({
      url: tab.url as string,
      title: tab.title || tab.url || 'Sem título',
      favIconUrl: tab.favIconUrl,
      pinned: tab.pinned,
      category: classifyTab(tab)
    }));
}

export async function createSession(name: string, tabs: chrome.tabs.Tab[]): Promise<SmartTabSession> {
  const sessions = await getSessions();
  const now = Date.now();
  const session: SmartTabSession = {
    id: crypto.randomUUID(),
    name: name.trim() || `Sessão ${new Date(now).toLocaleString('pt-BR')}`,
    tabs: tabsToSavedTabs(tabs),
    createdAt: now,
    updatedAt: now
  };

  await saveSessions([session, ...sessions]);
  return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const sessions = await getSessions();
  await saveSessions(sessions.filter((session) => session.id !== sessionId));
}

export async function renameSession(sessionId: string, name: string): Promise<SmartTabSession | undefined> {
  const sessions = await getSessions();
  let updatedSession: SmartTabSession | undefined;
  const updated = sessions.map((session) => {
    if (session.id !== sessionId) {
      return session;
    }
    updatedSession = { ...session, name: name.trim() || session.name, updatedAt: Date.now() };
    return updatedSession;
  });
  await saveSessions(updated);
  return updatedSession;
}

export async function markSessionRestored(sessionId: string): Promise<void> {
  const sessions = await getSessions();
  await saveSessions(
    sessions.map((session) =>
      session.id === sessionId ? { ...session, lastRestoredAt: Date.now(), updatedAt: Date.now() } : session
    )
  );
}
