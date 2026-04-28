import { ExternalLink, Loader2, Snowflake } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { HibernatedTab } from '../types';
import { sendRuntimeMessage } from '../utils/runtime';
import { getHibernatedTabs } from '../utils/storage';

export function HibernatePage() {
  const hibernationId = new URLSearchParams(window.location.search).get('id') ?? '';
  const [hibernatedTab, setHibernatedTab] = useState<HibernatedTab | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void getHibernatedTabs()
      .then((tabs) => {
        setHibernatedTab(tabs.find((tab) => tab.id === hibernationId) ?? null);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a aba hibernada.');
      })
      .finally(() => setLoading(false));
  }, [hibernationId]);

  async function restoreTab() {
    setRestoring(true);
    setError('');
    try {
      await sendRuntimeMessage({ type: 'RESTORE_HIBERNATED_TAB', hibernationId });
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Não foi possível restaurar a aba.');
      setRestoring(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 text-slate-100">
      <section className="card w-full max-w-xl p-6 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-sky-500/15 text-sky-200">
          <Snowflake size={28} />
        </div>
        <h1 className="text-2xl font-semibold tracking-normal">Esta aba foi hibernada para economizar memória.</h1>

        {loading ? (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="animate-spin" size={17} />
            Carregando
          </div>
        ) : hibernatedTab ? (
          <>
            <div className="mt-5 rounded-md border border-line bg-slate-950/55 p-4 text-left">
              <p className="truncate text-sm font-medium text-slate-100">{hibernatedTab.title}</p>
              <p className="mt-1 break-all text-xs text-slate-400">{hibernatedTab.originalUrl}</p>
            </div>
            <button className="button-primary mt-6" disabled={restoring} onClick={() => void restoreTab()}>
              {restoring ? <Loader2 className="animate-spin" size={17} /> : <ExternalLink size={17} />}
              Restaurar aba
            </button>
          </>
        ) : (
          <p className="mt-5 rounded-md bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
            Registro de hibernação não encontrado.
          </p>
        )}

        {error && <p className="mt-4 rounded-md bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p>}
      </section>
    </main>
  );
}
