import type { AppSettings, CategoryMeta, SavedTab, TabCategory } from '../types';

export const CATEGORY_META: Record<TabCategory, CategoryMeta> = {
  development: { key: 'development', label: 'Desenvolvimento', color: 'blue' },
  documentation: { key: 'documentation', label: 'Documentação', color: 'green' },
  social: { key: 'social', label: 'Redes sociais', color: 'pink' },
  videos: { key: 'videos', label: 'Vídeos', color: 'purple' },
  news: { key: 'news', label: 'Notícias', color: 'cyan' },
  shopping: { key: 'shopping', label: 'Compras', color: 'yellow' },
  other: { key: 'other', label: 'Outros', color: 'grey' }
};

const RULES: Array<{ category: TabCategory; patterns: RegExp[] }> = [
  {
    category: 'development',
    patterns: [
      /github\.com/i,
      /gitlab\.com/i,
      /bitbucket\.org/i,
      /stackoverflow\.com/i,
      /stackblitz\.com/i,
      /codesandbox\.io/i,
      /localhost/i,
      /127\.0\.0\.1/i,
      /vercel\.app/i
    ]
  },
  {
    category: 'documentation',
    patterns: [
      /developer\.mozilla\.org/i,
      /(^|\.)docs\./i,
      /\/docs(\/|$)/i,
      /npmjs\.com/i,
      /react\.dev/i,
      /typescriptlang\.org/i,
      /nodejs\.org/i,
      /vitejs\.dev/i,
      /tailwindcss\.com/i,
      /chrome\.com\/docs/i
    ]
  },
  {
    category: 'videos',
    patterns: [/youtube\.com/i, /youtu\.be/i, /vimeo\.com/i, /twitch\.tv/i]
  },
  {
    category: 'social',
    patterns: [/twitter\.com/i, /x\.com/i, /linkedin\.com/i, /instagram\.com/i, /facebook\.com/i, /reddit\.com/i]
  },
  {
    category: 'news',
    patterns: [/news/i, /g1\.globo\.com/i, /uol\.com\.br/i, /bbc\./i, /cnn\./i, /nytimes\.com/i, /medium\.com/i]
  },
  {
    category: 'shopping',
    patterns: [/mercadolivre\.com\.br/i, /amazon\.com\.br/i, /amazon\.com/i, /shopee\.com\.br/i, /aliexpress\.com/i]
  }
];

export function normalizeUrl(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    parsed.hash = '';
    if (parsed.pathname !== '/') {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function getDomain(url?: string): string {
  if (!url) {
    return '';
  }

  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

export function isExtensionOrBrowserUrl(url?: string): boolean {
  return !url || /^(chrome|chrome-extension|edge|about|devtools):/i.test(url);
}

export function isIgnoredDomain(url: string | undefined, settings: AppSettings): boolean {
  const domain = getDomain(url);
  return settings.ignoredDomains.some((ignored) => domain === ignored || domain.endsWith(`.${ignored}`));
}

export function classifyTab(tab: Pick<chrome.tabs.Tab, 'url' | 'title'> | SavedTab): TabCategory {
  const text = `${tab.url ?? ''} ${tab.title ?? ''}`;
  const match = RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(text)));
  return match?.category ?? 'other';
}

export function groupTabsByCategory(
  tabs: chrome.tabs.Tab[],
  settings: AppSettings
): Record<TabCategory, chrome.tabs.Tab[]> {
  const groups: Record<TabCategory, chrome.tabs.Tab[]> = {
    development: [],
    documentation: [],
    social: [],
    videos: [],
    news: [],
    shopping: [],
    other: []
  };

  for (const tab of tabs) {
    if (isExtensionOrBrowserUrl(tab.url) || isIgnoredDomain(tab.url, settings)) {
      continue;
    }
    groups[classifyTab(tab)].push(tab);
  }

  return groups;
}
