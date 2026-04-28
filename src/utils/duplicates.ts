import type { DuplicateGroup } from '../types';
import { isExtensionOrBrowserUrl, normalizeUrl } from './tabClassifier';

function pickTabToKeep(tabs: chrome.tabs.Tab[]): chrome.tabs.Tab {
  const active = tabs.find((tab) => tab.active);
  if (active) {
    return active;
  }

  return [...tabs].sort((a, b) => {
    const lastAccessedDiff = (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0);
    if (lastAccessedDiff !== 0) {
      return lastAccessedDiff;
    }
    return (b.id ?? 0) - (a.id ?? 0);
  })[0];
}

export function findDuplicateGroups(tabs: chrome.tabs.Tab[]): DuplicateGroup[] {
  const byUrl = new Map<string, chrome.tabs.Tab[]>();

  for (const tab of tabs) {
    const normalized = normalizeUrl(tab.url);
    if (!normalized || isExtensionOrBrowserUrl(normalized)) {
      continue;
    }
    byUrl.set(normalized, [...(byUrl.get(normalized) ?? []), tab]);
  }

  return [...byUrl.entries()]
    .filter(([, groupTabs]) => groupTabs.length > 1)
    .map(([url, groupTabs]) => {
      const keep = pickTabToKeep(groupTabs);
      const closeTabIds = groupTabs
        .filter((tab) => tab.id !== keep.id)
        .map((tab) => tab.id)
        .filter((id): id is number => typeof id === 'number');

      return {
        url,
        tabs: groupTabs.map((tab) => ({
          id: tab.id,
          windowId: tab.windowId,
          title: tab.title,
          url: tab.url,
          active: tab.active,
          lastAccessed: tab.lastAccessed
        })),
        keepTabId: keep.id,
        closeTabIds
      };
    });
}

export function countDuplicateTabs(groups: DuplicateGroup[]): number {
  return groups.reduce((total, group) => total + group.closeTabIds.length, 0);
}
