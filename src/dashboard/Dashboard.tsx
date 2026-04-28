import { ArchiveRestore, CopyX, Layers3, Search, Snowflake, Target, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { DashboardData, OrganizationPreview } from '../types';
import { sendRuntimeMessage } from '../utils/runtime';

export function Dashboard() {
  const [data, setData] = useState<DashboardData>({ tabs: [], sessions: [], duplicateGroups: [] });
  const [preview, setPreview] = useState<OrganizationPreview | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [nextData, nextPreview] = await Promise.all([
      sendRuntimeMessage<DashboardData>({ type: 'GET_DASHBOARD_DATA' }),
      sendRuntimeMessage<OrganizationPreview>({ type: 'GET_ORGANIZATION_PREVIEW' })
    ]);
    setData(nextData);
    setPreview(nextPreview);
  }

  useEffect(() => {
    void load().catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o dashboard.');
    });
  }, []);

  async function run<T>(message: unknown, success: (data: T) => string) {
    setError('');
    try {
      const response = await sendRuntimeMessage<T>(message);
      setStatus(success(response));
      await load();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Ação não concluída.');
    }
  }

  const filteredTabs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return data.tabs;
    }
    return data.tabs.filter((tab) => `${tab.title} ${tab.url} ${tab.category ?? ''}`.toLowerCase().includes(needle));
  }, [data.tabs, query]);

  const filteredSessions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return data.sessions;
    }
    return data.sessions.filter((session) =>
      `${session.name} ${session.tabs.map((tab) => `${tab.title} ${tab.url}`).join(' ')}`.toLowerCase().includes(needle)
    );
  }, [data.sessions, query]);

  return (
    <main className="liquid-panel min-h-screen px-5 py-6 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="glass-card rounded-2xl p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">easytab</p>
              <h1 className="text-3xl font-semibold tracking-normal text-white">Dashboard de abas</h1>
              <p className="mt-1 text-sm text-slate-400">Busque, organize, salve e entre em foco a partir de uma tela completa.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <QuickMetric label="Abas" value={data.tabs.length} />
              <QuickMetric label="Sessões" value={data.sessions.length} />
              <QuickMetric label="Duplicadas" value={data.duplicateGroups.length} />
              <QuickMetric label="Grupos previstos" value={preview?.groups ?? '-'} />
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="glass-card flex min-h-12 items-center gap-3 rounded-2xl px-4">
            <Search size={18} className="text-cyan-200" />
            <input
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              value={query}
              placeholder="Buscar por título, URL, categoria ou sessão"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[560px]">
            <DashboardButton icon={<Layers3 size={17} />} label="Organizar" onClick={() => run<{ groupedTabs: number; groups: number }>({ type: 'ORGANIZE_TABS' }, (result) => `${result.groupedTabs} abas em ${result.groups} grupos.`)} />
            <DashboardButton icon={<CopyX size={17} />} label="Duplicadas" onClick={() => run<{ closedTabs: number }>({ type: 'CLOSE_DUPLICATES' }, (result) => `${result.closedTabs} duplicadas fechadas.`)} />
            <DashboardButton icon={<Snowflake size={17} />} label="Hibernar" onClick={() => run<{ hibernatedTabs: number }>({ type: 'HIBERNATE_INACTIVE' }, (result) => `${result.hibernatedTabs} abas hibernadas.`)} />
            <DashboardButton icon={<Target size={17} />} label="Foco" onClick={() => run<{ sessionName: string }>({ type: 'START_FOCUS_MODE' }, (result) => `Modo foco iniciado: ${result.sessionName}.`)} />
          </div>
        </section>

        {(status || error) && (
          <p className={`glass-card mt-4 rounded-2xl px-4 py-3 text-sm ${error ? 'text-rose-100' : 'text-cyan-50'}`}>
            {error || status}
          </p>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="glass-card rounded-2xl p-4">
            <h2 className="text-lg font-semibold text-white">Abas abertas</h2>
            <div className="mt-3 max-h-[520px] space-y-2 overflow-auto pr-1">
              {filteredTabs.map((tab) => (
                <article key={tab.id} className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{tab.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">{tab.url}</p>
                    </div>
                    <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[11px] text-cyan-100">{tab.category ?? 'other'}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="grid gap-4">
            <section className="glass-card rounded-2xl p-4">
              <h2 className="text-lg font-semibold text-white">Prévia inteligente</h2>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
                {preview?.previewGroups.map((group) => (
                  <div key={`${group.windowId}:${group.key}`} className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">{group.label}</p>
                      <span className="text-xs text-cyan-100">{group.count} abas</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">{group.sampleTabs.map((tab) => tab.title).join(' · ')}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card rounded-2xl p-4">
              <h2 className="text-lg font-semibold text-white">Sessões</h2>
              <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
                {filteredSessions.map((session) => (
                  <article key={session.id} className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                    <p className="truncate text-sm font-semibold text-white">{session.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{session.tabs.length} abas salvas</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <DashboardButton icon={<ArchiveRestore size={15} />} label="Restaurar" onClick={() => run<{ restoredTabs: number }>({ type: 'RESTORE_SESSION', sessionId: session.id }, (result) => `${result.restoredTabs} abas restauradas.`)} />
                      <DashboardButton icon={<Trash2 size={15} />} label="Excluir" onClick={() => run<{ deleted: boolean }>({ type: 'DELETE_SESSION', sessionId: session.id }, () => 'Sessão excluída.')} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function QuickMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
      <strong className="block text-xl text-white">{value}</strong>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

function DashboardButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="glass-card flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-100 transition hover:border-cyan-300/50 hover:text-white"
      onClick={onClick}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
