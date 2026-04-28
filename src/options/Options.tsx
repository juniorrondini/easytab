import { Download, FileUp, Save, Trash2 } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../utils/storage';
import { sendRuntimeMessage } from '../utils/runtime';

export function Options() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [domainsText, setDomainsText] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void sendRuntimeMessage<AppSettings>({ type: 'GET_SETTINGS' })
      .then((loadedSettings) => {
        setSettings(loadedSettings);
        setDomainsText(loadedSettings.ignoredDomains.join('\n'));
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as configurações.');
      });
  }, []);

  async function saveOptions() {
    setError('');
    const nextSettings: AppSettings = {
      ...settings,
      ignoredDomains: domainsText
        .split(/\r?\n|,/)
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean)
    };

    try {
      const saved = await sendRuntimeMessage<AppSettings>({ type: 'SAVE_SETTINGS', settings: nextSettings });
      setSettings(saved);
      setDomainsText(saved.ignoredDomains.join('\n'));
      setStatus('Configurações salvas.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar.');
    }
  }

  async function exportData() {
    const data = await sendRuntimeMessage<unknown>({ type: 'EXPORT_DATA' });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `easytab-sessoes-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('Dados exportados.');
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      await sendRuntimeMessage({ type: 'IMPORT_DATA', data: parsed });
      const loadedSettings = await sendRuntimeMessage<AppSettings>({ type: 'GET_SETTINGS' });
      setSettings(loadedSettings);
      setDomainsText(loadedSettings.ignoredDomains.join('\n'));
      setStatus('Dados importados.');
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Arquivo inválido.');
    } finally {
      event.target.value = '';
    }
  }

  async function clearData() {
    const confirmed = confirm('Limpar sessões, configurações, hibernações e histórico salvos?');
    if (!confirmed) {
      return;
    }
    await sendRuntimeMessage({ type: 'CLEAR_DATA' });
    setSettings(DEFAULT_SETTINGS);
    setDomainsText('');
    setStatus('Dados limpos.');
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300">easytab</p>
          <h1 className="text-2xl font-semibold tracking-normal">Opções</h1>
        </header>

        <section className="card p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Tempo para aba inativa</span>
              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <input
                  className="field"
                  min={1}
                  type="number"
                  value={settings.inactiveMinutes}
                  onChange={(event) => setSettings((current) => ({ ...current, inactiveMinutes: Number(event.target.value) }))}
                />
                <span className="text-sm text-slate-400">min</span>
              </div>
            </label>

            <div className="grid gap-3">
              <Toggle
                label="Agrupamento automático"
                checked={settings.autoGrouping}
                onChange={(checked) => setSettings((current) => ({ ...current, autoGrouping: checked }))}
              />
              <Toggle
                label="Hibernação automática"
                checked={settings.autoHibernate}
                onChange={(checked) => setSettings((current) => ({ ...current, autoHibernate: checked }))}
              />
            </div>
          </div>

          <label className="mt-5 grid gap-2">
            <span className="text-sm font-medium text-slate-200">Domínios ignorados</span>
            <textarea
              className="field min-h-32 resize-y py-3"
              value={domainsText}
              placeholder={'exemplo.com\nlocalhost'}
              onChange={(event) => setDomainsText(event.target.value)}
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="button-primary" onClick={() => void saveOptions()}>
              <Save size={17} />
              Salvar
            </button>
            <button className="button-secondary" onClick={() => void exportData()}>
              <Download size={17} />
              Exportar JSON
            </button>
            <button className="button-secondary" onClick={() => fileInputRef.current?.click()}>
              <FileUp size={17} />
              Importar JSON
            </button>
            <button className="button-danger" onClick={() => void clearData()}>
              <Trash2 size={17} />
              Limpar dados
            </button>
            <input ref={fileInputRef} className="hidden" type="file" accept="application/json" onChange={importData} />
          </div>

          {(status || error) && (
            <p className={`mt-4 rounded-md px-3 py-2 text-sm ${error ? 'bg-rose-500/15 text-rose-200' : 'bg-sky-500/15 text-sky-100'}`}>
              {error || status}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-10 items-center justify-between rounded-md border border-line bg-slate-950/45 px-3">
      <span className="text-sm text-slate-200">{label}</span>
      <input
        type="checkbox"
        className="h-5 w-5 accent-sky-400"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
