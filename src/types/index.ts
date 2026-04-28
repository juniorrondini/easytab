export type TabCategory =
  | 'ai'
  | 'chats'
  | 'development'
  | 'devops'
  | 'documentation'
  | 'learning'
  | 'videos'
  | 'design'
  | 'productivity'
  | 'email'
  | 'social'
  | 'news'
  | 'shopping'
  | 'finance'
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

export type CustomRuleTarget = 'domain' | 'url' | 'title';

export interface CustomRule {
  id: string;
  label: string;
  target: CustomRuleTarget;
  match: string;
  category: TabCategory;
  enabled: boolean;
}

export interface OrganizationProfile {
  id: string;
  name: string;
  description: string;
  enabledCategories: TabCategory[];
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
  activeProfileId: string;
  customRules: CustomRule[];
  profiles: OrganizationProfile[];
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
  category?: TabCategory;
  active?: boolean;
  pinned?: boolean;
}

export interface OrganizationPreviewGroup {
  key: string;
  label: string;
  color: TabGroupColor;
  count: number;
  windowId: number;
  sampleTabs: TabSummary[];
}

export interface OrganizationPreview {
  groupedTabs: number;
  groups: number;
  windows: number;
  previewGroups: OrganizationPreviewGroup[];
}

export interface DashboardData {
  tabs: TabSummary[];
  sessions: SmartTabSession[];
  duplicateGroups: DuplicateGroup[];
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
