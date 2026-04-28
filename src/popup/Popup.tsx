import {
  ArchiveRestore,
  Bot,
  Boxes,
  Code2,
  CopyX,
  FolderOpen,
  Layers3,
  Loader2,
  MessageCircle,
  Moon,
  Play,
  RotateCcw,
  Save,
  Search,
  Settings,
  Snowflake,
  Target,
  Trash2,
  Ungroup
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { DashboardStats, OrganizationPreview, SmartTabSession, TabSummary } from '../types';
import { sendRuntimeMessage } from '../utils/runtime';

type ActionState = 'idle' | 'loading';

const formatDate = (timestamp?: number) =>
  timestamp ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(timestamp) : 'Nunca';

export function Popup() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<SmartTabSession[]>([]);
  const [inactiveTabs, setInactiveTabs] = useState<TabSummary[]>([]);
  const [selectedInactiveIds, setSelectedInactiveIds] = useState<number[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<OrganizationPreview | null>(null);
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const isBusy = actionState === 'loading';

  const loadData = useCallback(async () => {
    const [nextStats, nextSessions, nextInactiveTabs] = await Promise.all([
      sendRuntimeMessage<DashboardStats>({ type: 'GET_DASHBOARD_STATS' }),
      sendRuntimeMessage<SmartTabSession[]>({ type: 'GET_SESSIONS' }),
      sendRuntimeMessage<TabSummary[]>({ type: 'GET_INACTIVE_TABS' })
    ]);
    setStats(nextStats);
    setSessions(nextSessions);
    setInactiveTabs(nextInactiveTabs);
    setSelectedInactiveIds((current) => current.filter((id) => nextInactiveTabs.some((tab) => tab.id === id)));
  }, []);

  useEffect(() => {
    void loadData().catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os dados.');
    });
  }, [loadData]);

  async function runAction<T>(message: unknown, successMessage: (data: T) => string) {
    setActionState('loading');
    setError('');
    try {
      const data = await sendRuntimeMessage<T>(message);
      setStatus(successMessage(data));
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Ação não concluída.');
    } finally {
      setActionState('idle');
    }
  }

  async function loadPreview() {
    await runAction<OrganizationPreview>({ type: 'GET_ORGANIZATION_PREVIEW' }, (data) => {
      setPreview(data);
      return `${data.groups} grupos previstos para ${data.groupedTabs} abas.`;
    });
  }

  const sessionPlaceholder = `Projeto ${new Date().toLocaleDateString('pt-BR')}`;
  const iconUrl = chrome.runtime.getURL('icons/icon48.png');

  return (
    <main className="liquid-panel relative w-[420px] overflow-hidden px-4 pb-4 pt-4 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
      <div className="liquid-line pointer-events-none absolute left-8 right-8 top-[72px] h-px opacity-70" />

      <header className="glass-card relative mb-4 rounded-2xl p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src={iconUrl} alt="" className="h-11 w-11 rounded-xl shadow-lg shadow-cyan-950/40" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">easytab</p>
              <h1 className="truncate text-xl font-semibold tracking-normal text-white">SmartTab Organizer</h1>
            </div>
          </div>
          <button
            className="glass-card flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-200 transition hover:border-cyan-300/60 hover:text-white"
            title="Abrir opções"
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <section className="grid grid-cols-4 gap-2">
        <Metric icon={<Boxes size={16} />} label="Abas" value={stats?.totalTabs ?? '-'} tone="cyan" />
        <Metric icon={<FolderOpen size={16} />} label="Janelas" value={stats?.totalWindows ?? '-'} tone="teal" />
        <Metric icon={<CopyX size={16} />} label="Duplicadas" value={stats?.duplicateTabs ?? '-'} tone="amber" />
        <Metric icon={<Moon size={16} />} label="Inativas" value={stats?.inactiveTabs ?? '-'} tone="violet" />
      </section>

      <section className="glass-card mt-3 rounded-2xl p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Workspace</h2>
            <p className="text-xs text-slate-400">Organização por contexto</p>
          </div>
          {isBusy && <Loader2 className="animate-spin text-cyan-200" size={18} />}
        </div>

        <div className="grid gap-2">
          <button
            className="group relative min-h-12 overflow-hidden rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/35 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy}
            onClick={() =>
              loadPreview()
            }
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/10 opacity-70" />
            <span className="relative flex items-center justify-center gap-2">
              <Layers3 size={18} />
              Prévia inteligente
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              icon={<Layers3 size={17} />}
              label="Aplicar grupos"
              disabled={isBusy || Boolean(preview && preview.groups === 0)}
              onClick={() =>
                runAction<{ groupedTabs: number; groups: number }>({ type: 'ORGANIZE_TABS' }, (data) => {
                  setPreview(null);
                  return `${data.groupedTabs} abas organizadas em ${data.groups} grupos.`;
                })
              }
            />
            <ActionButton
              icon={<Ungroup size={17} />}
              label="Desagrupar"
              disabled={isBusy}
              onClick={() =>
                runAction<{ ungroupedTabs: number }>({ type: 'UNGROUP_TABS' }, (data) =>
                  `${data.ungroupedTabs} abas removidas de grupos.`
                )
              }
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <CategoryChip icon={<Bot size={14} />} label="IA" />
          <CategoryChip icon={<MessageCircle size={14} />} label="Chats" />
          <CategoryChip icon={<Code2 size={14} />} label="Dev" />
          <CategoryChip icon={<Play size={14} />} label="Vídeos" />
        </div>
      </section>

      {preview && (
        <section className="glass-card mt-3 rounded-2xl p-3">
          <PanelTitle title="Prévia de grupos" badge={`${preview.groups} grupos`} />
          <div className="max-h-36 space-y-2 overflow-auto pr-1">
            {preview.previewGroups.slice(0, 6).map((group) => (
              <div key={`${group.windowId}:${group.key}`} className="rounded-xl border border-white/10 bg-slate-950/35 p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-white">{group.label}</p>
                  <span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-[11px] text-cyan-100">{group.count} abas</span>
                </div>
                <p className="mt-1 truncate text-[11px] text-slate-400">{group.sampleTabs.map((tab) => tab.title).join(' · ')}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-3 grid grid-cols-[1fr_46px] gap-2">
        <input
          className="glass-field"
          value={sessionName}
          placeholder={sessionPlaceholder}
          onChange={(event) => setSessionName(event.target.value)}
        />
        <button
          className="glass-card flex h-11 items-center justify-center rounded-xl text-cyan-100 transition hover:border-cyan-300/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isBusy}
          title="Salvar sessão"
          onClick={() =>
            runAction<SmartTabSession>({ type: 'SAVE_SESSION', name: sessionName }, (session) => {
              setSessionName('');
              return `Sessão "${session.name}" salva.`;
            })
          }
        >
          <Save size={18} />
        </button>
      </section>

      <section className="mt-2 grid grid-cols-2 gap-2">
        <ActionButton
          icon={<Target size={17} />}
          label="Modo foco"
          disabled={isBusy}
          onClick={() =>
            runAction<{ sessionName: string; hibernatedTabs: number }>({ type: 'START_FOCUS_MODE' }, (data) =>
              `Modo foco iniciado. Sessão "${data.sessionName}" salva; ${data.hibernatedTabs} abas hibernadas.`
            )
          }
        />
        <ActionButton
          icon={<Search size={17} />}
          label="Dashboard"
          disabled={isBusy}
          onClick={() => runAction<{ tabId?: number }>({ type: 'OPEN_DASHBOARD' }, () => 'Dashboard aberto.')}
        />
      </section>

      <section className="mt-2 grid grid-cols-2 gap-2">
        <ActionButton
          icon={<CopyX size={17} />}
          label="Fechar duplicadas"
          disabled={isBusy || !stats?.duplicateTabs}
          onClick={() =>
            runAction<{ closedTabs: number }>({ type: 'CLOSE_DUPLICATES' }, (data) =>
              `${data.closedTabs} duplicadas fechadas.`
            )
          }
        />
        <ActionButton
          icon={<Snowflake size={17} />}
          label="Hibernar"
          disabled={isBusy || !stats?.inactiveTabs}
          onClick={() =>
            runAction<{ hibernatedTabs: number }>({ type: 'HIBERNATE_INACTIVE' }, (data) =>
              `${data.hibernatedTabs} abas hibernadas.`
            )
          }
        />
      </section>

      <button
        className="mt-3 inline-flex w-full items-center justify-center gap-2 text-xs font-medium text-slate-400 transition hover:text-cyan-100"
        onClick={() => void loadData()}
      >
        <RotateCcw size={14} />
        Atualizar dados
      </button>

      {(status || error) && (
        <p
          className={`glass-card mt-3 rounded-xl px-3 py-2 text-sm ${
            error ? 'text-rose-100 ring-1 ring-rose-400/25' : 'text-cyan-50 ring-1 ring-cyan-300/25'
          }`}
        >
          {error || status}
        </p>
      )}

      {inactiveTabs.length > 0 && (
        <section className="glass-card mt-3 rounded-2xl p-3">
          <PanelTitle
            title="Abas inativas"
            actionLabel={selectedInactiveIds.length === inactiveTabs.length ? 'Limpar' : 'Selecionar todas'}
            onAction={() =>
              setSelectedInactiveIds(selectedInactiveIds.length === inactiveTabs.length ? [] : inactiveTabs.map((tab) => tab.id))
            }
          />
          <div className="max-h-32 space-y-2 overflow-auto pr-1">
            {inactiveTabs.map((tab) => (
              <label key={tab.id} className="grid grid-cols-[auto_1fr] gap-2 rounded-xl border border-white/10 bg-slate-950/35 p-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-cyan-300"
                  checked={selectedInactiveIds.includes(tab.id)}
                  onChange={(event) =>
                    setSelectedInactiveIds((current) =>
                      event.target.checked ? [...current, tab.id] : current.filter((id) => id !== tab.id)
                    )
                  }
                />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-slate-100">{tab.title}</span>
                  <span className="block truncate text-[11px] text-slate-400">{tab.url}</span>
                </span>
              </label>
            ))}
          </div>
          <button
            className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy || selectedInactiveIds.length === 0}
            onClick={() =>
              runAction<{ hibernatedTabs: number }>(
                { type: 'HIBERNATE_TABS', tabIds: selectedInactiveIds },
                (data) => {
                  setSelectedInactiveIds([]);
                  return `${data.hibernatedTabs} abas selecionadas hibernadas.`;
                }
              )
            }
          >
            <Snowflake size={17} />
            Hibernar selecionadas
          </button>
        </section>
      )}

      {Boolean(stats?.duplicateGroups.length) && (
        <section className="glass-card mt-3 rounded-2xl p-3">
          <PanelTitle title="Duplicadas" badge={`${stats?.duplicateGroups.length ?? 0}`} />
          <div className="max-h-28 space-y-2 overflow-auto pr-1">
            {stats?.duplicateGroups.map((group) => (
              <div key={group.url} className="rounded-xl border border-white/10 bg-slate-950/35 p-2">
                <p className="truncate text-xs font-medium text-slate-100">{group.tabs[0]?.title || group.url}</p>
                <p className="truncate text-[11px] text-slate-400">{group.url}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Manter {group.keepTabId}; fechar {group.closeTabIds.length}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass-card mt-3 rounded-2xl p-3">
        <PanelTitle title="Sessões" badge={`${sessions.length} salvas`} />

        {sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/14 bg-slate-950/20 p-3 text-sm text-slate-400">
            Nenhuma sessão salva.
          </p>
        ) : (
          <div className="max-h-56 space-y-2 overflow-auto pr-1">
            {sessions.map((session) => (
              <article key={session.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                {renamingId === session.id ? (
                  <div className="mb-2 grid grid-cols-[1fr_auto] gap-2">
                    <input className="glass-field" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
                    <button
                      className="rounded-lg bg-cyan-300 px-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() =>
                        runAction<SmartTabSession | undefined>(
                          { type: 'RENAME_SESSION', sessionId: session.id, name: renameValue },
                          () => {
                            setRenamingId(null);
                            setRenameValue('');
                            return 'Sessão renomeada.';
                          }
                        )
                      }
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    className="mb-1 block max-w-full truncate text-left text-sm font-semibold text-white"
                    title="Renomear sessão"
                    onClick={() => {
                      setRenamingId(session.id);
                      setRenameValue(session.name);
                    }}
                  >
                    {session.name}
                  </button>
                )}
                <p className="text-xs text-slate-400">
                  {session.tabs.length} abas · criada em {formatDate(session.createdAt)} · restaurada {formatDate(session.lastRestoredAt)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <ActionButton
                    icon={<ArchiveRestore size={16} />}
                    label="Restaurar"
                    disabled={isBusy}
                    onClick={() =>
                      runAction<{ restoredTabs: number }>({ type: 'RESTORE_SESSION', sessionId: session.id }, (data) =>
                        `${data.restoredTabs} abas restauradas.`
                      )
                    }
                  />
                  <button
                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-300/25 bg-rose-400/12 px-3 text-sm font-medium text-rose-100 transition hover:bg-rose-400/18 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() =>
                      runAction<{ deleted: boolean }>({ type: 'DELETE_SESSION', sessionId: session.id }, () => 'Sessão excluída.')
                    }
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  tone
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  tone: 'cyan' | 'teal' | 'amber' | 'violet';
}) {
  const toneClass = {
    cyan: 'text-cyan-200 bg-cyan-300/10',
    teal: 'text-teal-200 bg-teal-300/10',
    amber: 'text-amber-200 bg-amber-300/10',
    violet: 'text-violet-200 bg-violet-300/10'
  }[tone];

  return (
    <div className="glass-card rounded-2xl p-2.5">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>{icon}</div>
      <strong className="block text-2xl font-semibold tracking-normal text-white">{value}</strong>
      <span className="block truncate text-[11px] text-slate-400">{label}</span>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  disabled,
  onClick
}: {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="glass-card flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-100 transition hover:border-cyan-300/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function CategoryChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-h-8 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.06] px-2 text-[11px] font-medium text-slate-300">
      {icon}
      <span className="truncate">{label}</span>
    </div>
  );
}

function PanelTitle({
  title,
  badge,
  actionLabel,
  onAction
}: {
  title: string;
  badge?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {actionLabel && onAction ? (
        <button className="text-xs font-medium text-cyan-200 transition hover:text-white" onClick={onAction}>
          {actionLabel}
        </button>
      ) : (
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] text-slate-300">{badge}</span>
      )}
    </div>
  );
}
