import type { AppSettings, DashboardStats, HibernatedTab, RuntimeResponse, TabSummary } from '../types';
import { countDuplicateTabs, findDuplicateGroups } from '../utils/duplicates';
import {
  addHistory,
  clearSavedData,
  DEFAULT_SETTINGS,
  exportSavedData,
  getHibernatedTabs,
  getSessions,
  getSettings,
  importSavedData,
  removeHibernatedTab,
  saveHibernatedTab,
  saveSettings
} from '../utils/storage';
import { buildTabGroupPlans, isExtensionOrBrowserUrl, isIgnoredDomain } from '../utils/tabClassifier';
import { createSession, deleteSession, markSessionRestored, renameSession } from '../utils/sessions';

type RuntimeMessage =
  | { type: 'GET_DASHBOARD_STATS' }
  | { type: 'GET_INACTIVE_TABS' }
  | { type: 'ORGANIZE_TABS' }
  | { type: 'UNGROUP_TABS' }
  | { type: 'CLOSE_DUPLICATES' }
  | { type: 'SAVE_SESSION'; name: string }
  | { type: 'GET_SESSIONS' }
  | { type: 'RESTORE_SESSION'; sessionId: string }
  | { type: 'DELETE_SESSION'; sessionId: string }
  | { type: 'RENAME_SESSION'; sessionId: string; name: string }
  | { type: 'HIBERNATE_INACTIVE' }
  | { type: 'HIBERNATE_TABS'; tabIds: number[] }
  | { type: 'RESTORE_HIBERNATED_TAB'; hibernationId: string; tabId?: number }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; settings: AppSettings }
  | { type: 'EXPORT_DATA' }
  | { type: 'IMPORT_DATA'; data: unknown }
  | { type: 'CLEAR_DATA' };

const MAINTENANCE_ALARM = 'easytab-maintenance';

async function queryAllTabs(): Promise<chrome.tabs.Tab[]> {
  return chrome.tabs.query({});
}

async function queryAllWindows(): Promise<chrome.windows.Window[]> {
  return chrome.windows.getAll({});
}

async function ensureAlarm(): Promise<void> {
  await chrome.alarms.create(MAINTENANCE_ALARM, {
    delayInMinutes: 1,
    periodInMinutes: 15
  });
}

function getInactiveTabs(tabs: chrome.tabs.Tab[], settings: AppSettings): chrome.tabs.Tab[] {
  const threshold = Date.now() - settings.inactiveMinutes * 60 * 1000;
  return tabs.filter((tab) => {
    if (!tab.id || tab.active || tab.pinned || tab.audible || isExtensionOrBrowserUrl(tab.url)) {
      return false;
    }
    if (isIgnoredDomain(tab.url, settings)) {
      return false;
    }
    return (tab.lastAccessed ?? 0) > 0 && (tab.lastAccessed ?? 0) < threshold;
  });
}

async function getDashboardStats(): Promise<DashboardStats> {
  const [tabs, windows, settings, sessions] = await Promise.all([
    queryAllTabs(),
    queryAllWindows(),
    getSettings(),
    getSessions()
  ]);
  const duplicateGroups = findDuplicateGroups(tabs);

  return {
    totalTabs: tabs.length,
    totalWindows: windows.length,
    duplicateTabs: countDuplicateTabs(duplicateGroups),
    duplicateGroups,
    inactiveTabs: getInactiveTabs(tabs, settings).length,
    sessionsCount: sessions.length
  };
}

async function getInactiveTabSummaries(): Promise<TabSummary[]> {
  const [tabs, settings] = await Promise.all([queryAllTabs(), getSettings()]);
  return getInactiveTabs(tabs, settings).map((tab) => ({
    id: tab.id as number,
    windowId: tab.windowId,
    title: tab.title || tab.url || 'Sem título',
    url: tab.url || '',
    favIconUrl: tab.favIconUrl,
    lastAccessed: tab.lastAccessed
  }));
}

async function organizeTabs(): Promise<{ groupedTabs: number; groups: number }> {
  const [tabs, settings] = await Promise.all([queryAllTabs(), getSettings()]);
  const byWindow = new Map<number, chrome.tabs.Tab[]>();

  for (const tab of tabs) {
    if (!tab.id || tab.windowId === chrome.windows.WINDOW_ID_NONE) {
      continue;
    }
    byWindow.set(tab.windowId, [...(byWindow.get(tab.windowId) ?? []), tab]);
  }

  let groupedTabs = 0;
  let groups = 0;

  for (const [windowId, windowTabs] of byWindow.entries()) {
    const plans = buildTabGroupPlans(windowTabs, settings);

    for (const plan of plans) {
      const tabIds = plan.tabs.map((tab) => tab.id).filter((id): id is number => typeof id === 'number');
      if (tabIds.length === 0) {
        continue;
      }

      const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId } });
      await chrome.tabGroups.update(groupId, {
        title: plan.label,
        color: plan.color,
        collapsed: false
      });
      groupedTabs += tabIds.length;
      groups += 1;
    }
  }

  await addHistory('Organizar abas', `${groupedTabs} abas em ${groups} grupos`);
  return { groupedTabs, groups };
}

async function ungroupTabs(): Promise<{ ungroupedTabs: number }> {
  const tabs = await queryAllTabs();
  const groupedTabIds = tabs
    .filter((tab) => tab.id && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE)
    .map((tab) => tab.id)
    .filter((id): id is number => typeof id === 'number');

  if (groupedTabIds.length > 0) {
    await chrome.tabs.ungroup(groupedTabIds);
    await addHistory('Desagrupar abas', `${groupedTabIds.length} abas desagrupadas`);
  }

  return { ungroupedTabs: groupedTabIds.length };
}

async function closeDuplicates(): Promise<{ closedTabs: number }> {
  const tabs = await queryAllTabs();
  const duplicateGroups = findDuplicateGroups(tabs);
  const closeTabIds = duplicateGroups.flatMap((group) => group.closeTabIds);

  if (closeTabIds.length > 0) {
    await chrome.tabs.remove(closeTabIds);
    await addHistory('Fechar duplicadas', `${closeTabIds.length} abas fechadas`);
  }

  return { closedTabs: closeTabIds.length };
}

async function saveCurrentSession(name: string) {
  const tabs = await queryAllTabs();
  const session = await createSession(name, tabs);
  await addHistory('Salvar sessão', `${session.name} com ${session.tabs.length} abas`);
  return session;
}

async function restoreSession(sessionId: string): Promise<{ restoredTabs: number }> {
  const sessions = await getSessions();
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) {
    throw new Error('Sessão não encontrada.');
  }
  if (session.tabs.length === 0) {
    return { restoredTabs: 0 };
  }

  const [firstTab, ...remainingTabs] = session.tabs;
  const createdWindow = await chrome.windows.create({ url: firstTab.url, focused: true });
  const windowId = createdWindow.id;

  if (windowId) {
    await Promise.all(
      remainingTabs.map((tab) =>
        chrome.tabs.create({
          windowId,
          url: tab.url,
          pinned: tab.pinned,
          active: false
        })
      )
    );
  }

  await markSessionRestored(sessionId);
  await addHistory('Restaurar sessão', `${session.name} com ${session.tabs.length} abas`);
  return { restoredTabs: session.tabs.length };
}

async function hibernateTab(tab: chrome.tabs.Tab): Promise<HibernatedTab | undefined> {
  if (!tab.id || !tab.url || isExtensionOrBrowserUrl(tab.url)) {
    return undefined;
  }

  const hibernated: HibernatedTab = {
    id: crypto.randomUUID(),
    tabId: tab.id,
    windowId: tab.windowId,
    originalUrl: tab.url,
    title: tab.title || tab.url,
    favIconUrl: tab.favIconUrl,
    createdAt: Date.now()
  };

  await saveHibernatedTab(hibernated);
  await chrome.tabs.update(tab.id, {
    url: chrome.runtime.getURL(`hibernate.html?id=${encodeURIComponent(hibernated.id)}`)
  });
  return hibernated;
}

async function hibernateInactiveTabs(): Promise<{ hibernatedTabs: number }> {
  const [tabs, settings] = await Promise.all([queryAllTabs(), getSettings()]);
  const inactiveTabs = getInactiveTabs(tabs, settings);
  const hibernated = await Promise.all(inactiveTabs.map((tab) => hibernateTab(tab)));
  const hibernatedTabs = hibernated.filter(Boolean).length;

  if (hibernatedTabs > 0) {
    await addHistory('Hibernar inativas', `${hibernatedTabs} abas hibernadas`);
  }

  return { hibernatedTabs };
}

async function hibernateTabsByIds(tabIds: number[]): Promise<{ hibernatedTabs: number }> {
  if (tabIds.length === 0) {
    return { hibernatedTabs: 0 };
  }

  const tabs = await queryAllTabs();
  const selected = tabs.filter((tab) => tab.id && tabIds.includes(tab.id));
  const hibernated = await Promise.all(selected.map((tab) => hibernateTab(tab)));
  const hibernatedTabs = hibernated.filter(Boolean).length;

  if (hibernatedTabs > 0) {
    await addHistory('Hibernar selecionadas', `${hibernatedTabs} abas hibernadas`);
  }

  return { hibernatedTabs };
}

async function restoreHibernatedTab(hibernationId: string, tabId?: number): Promise<{ restored: boolean }> {
  const hibernated = await removeHibernatedTab(hibernationId);
  if (!hibernated) {
    throw new Error('Aba hibernada não encontrada.');
  }

  const targetTabId = tabId ?? hibernated.tabId;
  if (targetTabId) {
    await chrome.tabs.update(targetTabId, { url: hibernated.originalUrl, active: true });
  } else {
    await chrome.tabs.create({ url: hibernated.originalUrl, active: true });
  }

  await addHistory('Restaurar aba hibernada', hibernated.originalUrl);
  return { restored: true };
}

async function handleMessage(message: RuntimeMessage, sender: chrome.runtime.MessageSender): Promise<unknown> {
  switch (message.type) {
    case 'GET_DASHBOARD_STATS':
      return getDashboardStats();
    case 'GET_INACTIVE_TABS':
      return getInactiveTabSummaries();
    case 'ORGANIZE_TABS':
      return organizeTabs();
    case 'UNGROUP_TABS':
      return ungroupTabs();
    case 'CLOSE_DUPLICATES':
      return closeDuplicates();
    case 'SAVE_SESSION':
      return saveCurrentSession(message.name);
    case 'GET_SESSIONS':
      return getSessions();
    case 'RESTORE_SESSION':
      return restoreSession(message.sessionId);
    case 'DELETE_SESSION':
      await deleteSession(message.sessionId);
      await addHistory('Excluir sessão', message.sessionId);
      return { deleted: true };
    case 'RENAME_SESSION':
      return renameSession(message.sessionId, message.name);
    case 'HIBERNATE_INACTIVE':
      return hibernateInactiveTabs();
    case 'HIBERNATE_TABS':
      return hibernateTabsByIds(message.tabIds);
    case 'RESTORE_HIBERNATED_TAB':
      return restoreHibernatedTab(message.hibernationId, message.tabId ?? sender.tab?.id);
    case 'GET_SETTINGS':
      return getSettings();
    case 'SAVE_SETTINGS':
      return saveSettings(message.settings);
    case 'EXPORT_DATA':
      return exportSavedData();
    case 'IMPORT_DATA':
      await importSavedData(message.data as Parameters<typeof importSavedData>[0]);
      return { imported: true };
    case 'CLEAR_DATA':
      await clearSavedData();
      await saveSettings(DEFAULT_SETTINGS);
      return { cleared: true };
    default:
      throw new Error('Mensagem desconhecida.');
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await saveSettings(settings);
  await ensureAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== MAINTENANCE_ALARM) {
    return;
  }

  void (async () => {
    const settings = await getSettings();
    if (settings.autoGrouping) {
      await organizeTabs();
    }
    if (settings.autoHibernate) {
      await hibernateInactiveTabs();
    }
  })();
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  void handleMessage(message, sender)
    .then((data) => {
      const response: RuntimeResponse = { ok: true, data };
      sendResponse(response);
    })
    .catch((error: unknown) => {
      const response: RuntimeResponse = {
        ok: false,
        error: error instanceof Error ? error.message : 'Erro inesperado.'
      };
      sendResponse(response);
    });

  return true;
});
