import type { AppSettings, CategoryMeta, SavedTab, TabCategory, TabGroupColor } from '../types';

export interface TabGroupPlan {
  key: string;
  label: string;
  color: TabGroupColor;
  tabs: chrome.tabs.Tab[];
}

export const CATEGORY_ORDER: TabCategory[] = [
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
];

export const CATEGORY_META: Record<TabCategory, CategoryMeta> = {
  ai: { key: 'ai', label: 'IA', color: 'purple' },
  chats: { key: 'chats', label: 'Chats', color: 'green' },
  development: { key: 'development', label: 'Desenvolvimento', color: 'blue' },
  devops: { key: 'devops', label: 'DevOps & Cloud', color: 'cyan' },
  documentation: { key: 'documentation', label: 'Documentação', color: 'green' },
  learning: { key: 'learning', label: 'Aprendizado', color: 'yellow' },
  videos: { key: 'videos', label: 'Vídeos', color: 'red' },
  design: { key: 'design', label: 'Design', color: 'pink' },
  productivity: { key: 'productivity', label: 'Produtividade', color: 'orange' },
  email: { key: 'email', label: 'E-mail', color: 'cyan' },
  social: { key: 'social', label: 'Redes sociais', color: 'pink' },
  news: { key: 'news', label: 'Notícias', color: 'cyan' },
  shopping: { key: 'shopping', label: 'Compras', color: 'yellow' },
  finance: { key: 'finance', label: 'Finanças', color: 'green' },
  other: { key: 'other', label: 'Outros', color: 'grey' }
};

type ClassificationRule = {
  category: TabCategory;
  score: number;
  domains?: string[];
  domainIncludes?: string[];
  textPatterns?: RegExp[];
};

const RULES: ClassificationRule[] = [
  {
    category: 'ai',
    score: 100,
    domains: [
      'chat.openai.com',
      'chatgpt.com',
      'claude.ai',
      'gemini.google.com',
      'aistudio.google.com',
      'perplexity.ai',
      'poe.com',
      'grok.com',
      'copilot.microsoft.com'
    ],
    textPatterns: [/\bchatgpt\b/i, /\bclaude\b/i, /\bgemini\b/i, /\bperplexity\b/i, /\bcopilot\b/i]
  },
  {
    category: 'chats',
    score: 95,
    domains: [
      'web.whatsapp.com',
      'telegram.org',
      'web.telegram.org',
      'discord.com',
      'slack.com',
      'teams.microsoft.com',
      'messenger.com',
      'meet.google.com',
      'zoom.us'
    ],
    domainIncludes: ['slack.com'],
    textPatterns: [/\bwhatsapp\b/i, /\btelegram\b/i, /\bdiscord\b/i, /\bslack\b/i, /\bteams\b/i, /\bchat\b/i]
  },
  {
    category: 'development',
    score: 90,
    domains: [
      'github.com',
      'gitlab.com',
      'bitbucket.org',
      'stackoverflow.com',
      'stackblitz.com',
      'codesandbox.io',
      'replit.com'
    ],
    domainIncludes: ['localhost', '127.0.0.1'],
    textPatterns: [/\bpull request\b/i, /\bissue\b/i, /\brepository\b/i, /\bcommit\b/i, /\bapi\b/i]
  },
  {
    category: 'devops',
    score: 88,
    domains: [
      'vercel.com',
      'app.vercel.com',
      'netlify.com',
      'dashboard.render.com',
      'console.aws.amazon.com',
      'cloud.google.com',
      'console.cloud.google.com',
      'portal.azure.com',
      'supabase.com',
      'firebase.google.com',
      'cloudflare.com',
      'sentry.io',
      'datadoghq.com'
    ],
    domainIncludes: ['vercel.app', 'amazonaws.com'],
    textPatterns: [/\bdeploy\b/i, /\blog\b/i, /\bmonitoring\b/i, /\bcloud\b/i, /\bserver\b/i]
  },
  {
    category: 'documentation',
    score: 84,
    domains: [
      'developer.mozilla.org',
      'npmjs.com',
      'react.dev',
      'typescriptlang.org',
      'nodejs.org',
      'vitejs.dev',
      'tailwindcss.com',
      'docs.github.com',
      'developer.chrome.com'
    ],
    textPatterns: [/(^|\.)docs\./i, /\/docs(\/|$)/i, /\bdocumentation\b/i, /\breference\b/i, /\bguide\b/i]
  },
  {
    category: 'learning',
    score: 78,
    domains: [
      'udemy.com',
      'coursera.org',
      'edx.org',
      'freecodecamp.org',
      'khanacademy.org',
      'frontendmasters.com',
      'pluralsight.com',
      'alura.com.br'
    ],
    textPatterns: [/\bcourse\b/i, /\baula\b/i, /\btutorial\b/i, /\bbootcamp\b/i, /\blearn\b/i]
  },
  {
    category: 'videos',
    score: 76,
    domains: ['youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv', 'netflix.com', 'primevideo.com'],
    textPatterns: [/\bwatch\b/i, /\bvideo\b/i, /\bshorts\b/i, /\blive\b/i]
  },
  {
    category: 'design',
    score: 74,
    domains: ['figma.com', 'canva.com', 'dribbble.com', 'behance.net', 'mobbin.com', 'framer.com'],
    textPatterns: [/\bdesign\b/i, /\bprototype\b/i, /\bwireframe\b/i, /\bmockup\b/i, /\bui\b/i, /\bux\b/i]
  },
  {
    category: 'productivity',
    score: 72,
    domains: [
      'notion.so',
      'trello.com',
      'linear.app',
      'jira.com',
      'atlassian.net',
      'asana.com',
      'clickup.com',
      'monday.com',
      'calendar.google.com',
      'drive.google.com'
    ],
    textPatterns: [/\btask\b/i, /\bkanban\b/i, /\bcalendar\b/i, /\bworkspace\b/i, /\broadmap\b/i]
  },
  {
    category: 'email',
    score: 70,
    domains: ['mail.google.com', 'outlook.live.com', 'outlook.office.com', 'proton.me', 'protonmail.com', 'mail.yahoo.com'],
    textPatterns: [/\binbox\b/i, /\be-?mail\b/i, /\bcompose\b/i]
  },
  {
    category: 'social',
    score: 64,
    domains: ['twitter.com', 'x.com', 'linkedin.com', 'instagram.com', 'facebook.com', 'reddit.com', 'threads.net', 'bsky.app'],
    textPatterns: [/\bfeed\b/i, /\bprofile\b/i, /\bpost\b/i, /\bsocial\b/i]
  },
  {
    category: 'news',
    score: 58,
    domains: ['g1.globo.com', 'uol.com.br', 'bbc.com', 'bbc.co.uk', 'cnn.com', 'nytimes.com', 'medium.com'],
    textPatterns: [/\bnews\b/i, /\bnotícias?\b/i, /\breportagem\b/i, /\barticle\b/i]
  },
  {
    category: 'shopping',
    score: 56,
    domains: ['mercadolivre.com.br', 'amazon.com.br', 'amazon.com', 'shopee.com.br', 'aliexpress.com', 'magazineluiza.com.br'],
    textPatterns: [/\bcart\b/i, /\bcarrinho\b/i, /\bcheckout\b/i, /\bcomprar\b/i, /\bproduto\b/i]
  },
  {
    category: 'finance',
    score: 54,
    domains: ['nubank.com.br', 'inter.co', 'xp.com.br', 'binance.com', 'coinbase.com', 'wise.com', 'paypal.com'],
    textPatterns: [/\bbank\b/i, /\bbanco\b/i, /\binvest\b/i, /\bcrypto\b/i, /\bwallet\b/i, /\bfatura\b/i]
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

function domainMatches(domain: string, ruleDomain: string): boolean {
  return domain === ruleDomain || domain.endsWith(`.${ruleDomain}`);
}

export function classifyTab(tab: Pick<chrome.tabs.Tab, 'url' | 'title'> | SavedTab): TabCategory {
  const domain = getDomain(tab.url);
  const text = `${domain} ${tab.url ?? ''} ${tab.title ?? ''}`;

  let bestMatch: { category: TabCategory; score: number } = { category: 'other', score: 0 };

  for (const rule of RULES) {
    let score = 0;

    if (rule.domains?.some((ruleDomain) => domainMatches(domain, ruleDomain))) {
      score += rule.score;
    }

    if (rule.domainIncludes?.some((domainPart) => domain.includes(domainPart))) {
      score += rule.score - 5;
    }

    const patternHits = rule.textPatterns?.filter((pattern) => pattern.test(text)).length ?? 0;
    score += patternHits * 12;

    if (score > bestMatch.score) {
      bestMatch = { category: rule.category, score };
    }
  }

  return bestMatch.score > 0 ? bestMatch.category : 'other';
}

export function groupTabsByCategory(
  tabs: chrome.tabs.Tab[],
  settings: AppSettings
): Record<TabCategory, chrome.tabs.Tab[]> {
  const groups = CATEGORY_ORDER.reduce(
    (accumulator, category) => ({ ...accumulator, [category]: [] }),
    {} as Record<TabCategory, chrome.tabs.Tab[]>
  );

  for (const tab of tabs) {
    if (isExtensionOrBrowserUrl(tab.url) || isIgnoredDomain(tab.url, settings)) {
      continue;
    }
    groups[classifyTab(tab)].push(tab);
  }

  return groups;
}

export function buildTabGroupPlans(tabs: chrome.tabs.Tab[], settings: AppSettings): TabGroupPlan[] {
  const grouped = groupTabsByCategory(tabs, settings);
  const plans: TabGroupPlan[] = [];

  for (const category of CATEGORY_ORDER) {
    if (category === 'other') {
      continue;
    }

    const categoryTabs = grouped[category];
    if (categoryTabs.length > 0) {
      const meta = CATEGORY_META[category];
      plans.push({
        key: category,
        label: meta.label,
        color: meta.color,
        tabs: categoryTabs
      });
    }
  }

  const otherTabsByDomain = new Map<string, chrome.tabs.Tab[]>();
  for (const tab of grouped.other) {
    const domain = getDomain(tab.url) || 'sem-dominio';
    otherTabsByDomain.set(domain, [...(otherTabsByDomain.get(domain) ?? []), tab]);
  }

  const mixedOtherTabs: chrome.tabs.Tab[] = [];
  for (const [domain, domainTabs] of otherTabsByDomain.entries()) {
    if (domainTabs.length >= 2 && domain !== 'sem-dominio') {
      plans.push({
        key: `other:${domain}`,
        label: `Outros: ${domain}`,
        color: CATEGORY_META.other.color,
        tabs: domainTabs
      });
    } else {
      mixedOtherTabs.push(...domainTabs);
    }
  }

  if (mixedOtherTabs.length > 1) {
    plans.push({
      key: 'other:mixed',
      label: CATEGORY_META.other.label,
      color: CATEGORY_META.other.color,
      tabs: mixedOtherTabs
    });
  }

  return plans;
}
