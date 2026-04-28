import {
  ArchiveRestore,
  Boxes,
  CopyX,
  FolderOpen,
  Loader2,
  Moon,
  RotateCcw,
  Save,
  Settings,
  Snowflake,
  Trash2
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { DashboardStats, SmartTabSession, TabSummary } from '../types';
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

  const sessionPlaceholder = `Projeto ${new Date().toLocaleDateString('pt-BR')}`;

  return (
    <main className="w-[390px] bg-surface p-4 text-slate-100">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300">easytab</p>
          <h1 className="text-xl font-semibold tracking-normal">SmartTab Organizer</h1>
        </div>
        <button
          className="button-secondary h-10 w-10 px-0"
          title="Abrir opções"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <Settings size={18} />
        </button>
      </header>

      <section className="grid grid-cols-2 gap-2">
        <Metric icon={<Boxes size={17} />} label="Abas" value={stats?.totalTabs ?? '-'} />
        <Metric icon={<FolderOpen size={17} />} label="Janelas" value={stats?.totalWindows ?? '-'} />
        <Metric icon={<CopyX size={17} />} label="Duplicadas" value={stats?.duplicateTabs ?? '-'} />
        <Metric icon={<Moon size={17} />} label="Inativas" value={stats?.inactiveTabs ?? '-'} />
      </section>

      <section className="mt-4 grid gap-2">
        <button
          className="button-primary w-full"
          disabled={isBusy}
          onClick={() =>
            runAction<{ groupedTabs: number; groups: number }>({ type: 'ORGANIZE_TABS' }, (data) =>
              `${data.groupedTabs} abas organizadas em ${data.groups} grupos.`
            )
          }
        >
          {isBusy ? <Loader2 className="animate-spin" size={17} /> : <Boxes size={17} />}
          Organizar abas
        </button>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            className="field"
            value={sessionName}
            placeholder={sessionPlaceholder}
            onChange={(event) => setSessionName(event.target.value)}
          />
          <button
            className="button-secondary"
            disabled={isBusy}
            title="Salvar sessão"
            onClick={() =>
              runAction<SmartTabSession>({ type: 'SAVE_SESSION', name: sessionName }, (session) => {
                setSessionName('');
                return `Sessão "${session.name}" salva.`;
              })
            }
          >
            <Save size={17} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            className="button-secondary"
            disabled={isBusy || !stats?.duplicateTabs}
            onClick={() =>
              runAction<{ closedTabs: number }>({ type: 'CLOSE_DUPLICATES' }, (data) =>
                `${data.closedTabs} duplicadas fechadas.`
              )
            }
          >
            <CopyX size={17} />
            Fechar duplicadas
          </button>
          <button
            className="button-secondary"
            disabled={isBusy || !stats?.inactiveTabs}
            onClick={() =>
              runAction<{ hibernatedTabs: number }>({ type: 'HIBERNATE_INACTIVE' }, (data) =>
                `${data.hibernatedTabs} abas hibernadas.`
              )
            }
          >
            <Snowflake size={17} />
            Hibernar
          </button>
        </div>
      </section>

      {(status || error) && (
        <p className={`mt-3 rounded-md px-3 py-2 text-sm ${error ? 'bg-rose-500/15 text-rose-200' : 'bg-sky-500/15 text-sky-100'}`}>
          {error || status}
        </p>
      )}

      {inactiveTabs.length > 0 && (
        <section className="card mt-4 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Abas inativas</h2>
            <button
              className="text-xs text-sky-300 hover:text-sky-200"
              onClick={() =>
                setSelectedInactiveIds(
                  selectedInactiveIds.length === inactiveTabs.length ? [] : inactiveTabs.map((tab) => tab.id)
                )
              }
            >
              {selectedInactiveIds.length === inactiveTabs.length ? 'Limpar' : 'Selecionar todas'}
            </button>
          </div>
          <div className="max-h-32 space-y-2 overflow-auto pr-1">
            {inactiveTabs.map((tab) => (
              <label key={tab.id} className="grid grid-cols-[auto_1fr] gap-2 rounded-md border border-line bg-slate-950/50 p-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-sky-400"
                  checked={selectedInactiveIds.includes(tab.id)}
                  onChange={(event) =>
                    setSelectedInactiveIds((current) =>
                      event.target.checked ? [...current, tab.id] : current.filter((id) => id !== tab.id)
                    )
                  }
                />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-slate-200">{tab.title}</span>
                  <span className="block truncate text-[11px] text-slate-400">{tab.url}</span>
                </span>
              </label>
            ))}
          </div>
          <button
            className="button-secondary mt-3 w-full"
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
        <section className="card mt-4 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Duplicadas encontradas</h2>
            <span className="rounded bg-slate-950 px-2 py-1 text-xs text-slate-300">{stats?.duplicateGroups.length}</span>
          </div>
          <div className="max-h-28 space-y-2 overflow-auto pr-1">
            {stats?.duplicateGroups.map((group) => (
              <div key={group.url} className="rounded-md border border-line bg-slate-950/50 p-2">
                <p className="truncate text-xs font-medium text-slate-200">{group.tabs[0]?.title || group.url}</p>
                <p className="truncate text-[11px] text-slate-400">{group.url}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Manter aba {group.keepTabId}; fechar {group.closeTabIds.length}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card mt-4 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Sessões</h2>
          <span className="text-xs text-slate-400">{sessions.length} salvas</span>
        </div>

        {sessions.length === 0 ? (
          <p className="rounded-md border border-dashed border-line p-3 text-sm text-slate-400">Nenhuma sessão salva.</p>
        ) : (
          <div className="max-h-56 space-y-2 overflow-auto pr-1">
            {sessions.map((session) => (
              <article key={session.id} className="rounded-md border border-line bg-slate-950/45 p-3">
                {renamingId === session.id ? (
                  <div className="mb-2 grid grid-cols-[1fr_auto] gap-2">
                    <input className="field" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
                    <button
                      className="button-primary"
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
                    className="mb-1 block max-w-full truncate text-left text-sm font-medium text-slate-100"
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
                  <button
                    className="button-secondary"
                    disabled={isBusy}
                    onClick={() =>
                      runAction<{ restoredTabs: number }>({ type: 'RESTORE_SESSION', sessionId: session.id }, (data) =>
                        `${data.restoredTabs} abas restauradas.`
                      )
                    }
                  >
                    <ArchiveRestore size={16} />
                    Restaurar
                  </button>
                  <button
                    className="button-danger"
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

      <button className="mt-3 inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200" onClick={() => void loadData()}>
        <RotateCcw size={14} />
        Atualizar dados
      </button>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <div className="card p-3">
      <div className="mb-2 flex items-center justify-between text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <strong className="text-2xl font-semibold tracking-normal">{value}</strong>
    </div>
  );
}
