export type TabCategory =
  | 'development'
  | 'documentation'
  | 'social'
  | 'videos'
  | 'news'
  | 'shopping'
  | 'other';

export type TabGroupColor = chrome.tabGroups.ColorEnum;

export interface CategoryMeta {
  key: TabCategory;
  label: string;
  color: TabGroupColor;
}

export interface SavedTab {
  url: string;
  title: string;
  favIconUrl?: string;
  pinned?: boolean;
  category?: TabCategory;
}

export interface SmartTabSession {
  id: string;
  name: string;
  tabs: SavedTab[];
  createdAt: number;
  updatedAt: number;
  lastRestoredAt?: number;
}

export interface AppSettings {
  inactiveMinutes: number;
  autoGrouping: boolean;
  autoHibernate: boolean;
  ignoredDomains: string[];
}

export interface HibernatedTab {
  id: string;
  tabId?: number;
  windowId?: number;
  originalUrl: string;
  title: string;
  favIconUrl?: string;
  createdAt: number;
}

export interface DuplicateGroup {
  url: string;
  tabs: Array<Pick<chrome.tabs.Tab, 'id' | 'windowId' | 'title' | 'url' | 'active' | 'lastAccessed'>>;
  keepTabId?: number;
  closeTabIds: number[];
}

export interface TabSummary {
  id: number;
  windowId: number;
  title: string;
  url: string;
  favIconUrl?: string;
  lastAccessed?: number;
}

export interface DashboardStats {
  totalTabs: number;
  totalWindows: number;
  duplicateTabs: number;
  duplicateGroups: DuplicateGroup[];
  inactiveTabs: number;
  sessionsCount: number;
}

export interface BasicHistoryEntry {
  id: string;
  action: string;
  createdAt: number;
  details?: string;
}

export interface RuntimeResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
