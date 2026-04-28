import { Download, FileUp, Plus, Save, Trash2 } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { AppSettings, CustomRule, CustomRuleTarget, TabCategory } from '../types';
import { CATEGORY_META, CATEGORY_ORDER } from '../utils/tabClassifier';
import { DEFAULT_SETTINGS } from '../utils/storage';
import { sendRuntimeMessage } from '../utils/runtime';

const TARGETS: Array<{ value: CustomRuleTarget; label: string }> = [
  { value: 'domain', label: 'Domínio' },
  { value: 'url', label: 'URL' },
  { value: 'title', label: 'Título' }
];

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

  function updateRule(ruleId: string, patch: Partial<CustomRule>) {
    setSettings((current) => ({
      ...current,
      customRules: current.customRules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule))
    }));
  }

  function addRule() {
    setSettings((current) => ({
      ...current,
      customRules: [
        ...current.customRules,
        {
          id: crypto.randomUUID(),
          label: 'Nova regra',
          target: 'domain',
          match: '',
          category: 'productivity',
          enabled: true
        }
      ]
    }));
  }

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
    <main className="liquid-panel min-h-screen px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">easytab</p>
          <h1 className="text-3xl font-semibold tracking-normal text-white">Opções</h1>
        </header>

        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="glass-card rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-white">Automação</h2>
            <div className="mt-4 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Tempo para aba inativa</span>
                <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <input
                    className="glass-field"
                    min={1}
                    type="number"
                    value={settings.inactiveMinutes}
                    onChange={(event) => setSettings((current) => ({ ...current, inactiveMinutes: Number(event.target.value) }))}
                  />
                  <span className="text-sm text-slate-400">min</span>
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Perfil de organização</span>
                <select
                  className="glass-field"
                  value={settings.activeProfileId}
                  onChange={(event) => setSettings((current) => ({ ...current, activeProfileId: event.target.value }))}
                >
                  {settings.profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400">
                  {settings.profiles.find((profile) => profile.id === settings.activeProfileId)?.description}
                </span>
              </label>

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

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Domínios ignorados</span>
                <textarea
                  className="glass-field min-h-32 resize-y py-3"
                  value={domainsText}
                  placeholder={'exemplo.com\nlocalhost'}
                  onChange={(event) => setDomainsText(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Regras personalizadas</h2>
                <p className="text-sm text-slate-400">Force domínios, URLs ou títulos para uma categoria.</p>
              </div>
              <button className="button-secondary" onClick={addRule}>
                <Plus size={16} />
                Regra
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {settings.customRules.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/14 bg-slate-950/20 p-4 text-sm text-slate-400">
                  Nenhuma regra criada. Exemplo: domínio contém `cliente-x.com` → Produtividade.
                </p>
              ) : (
                settings.customRules.map((rule) => (
                  <article key={rule.id} className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                    <div className="grid gap-2 md:grid-cols-[1fr_120px_1fr_150px_auto]">
                      <input
                        className="glass-field"
                        value={rule.label}
                        placeholder="Nome"
                        onChange={(event) => updateRule(rule.id, { label: event.target.value })}
                      />
                      <select
                        className="glass-field"
                        value={rule.target}
                        onChange={(event) => updateRule(rule.id, { target: event.target.value as CustomRuleTarget })}
                      >
                        {TARGETS.map((target) => (
                          <option key={target.value} value={target.value}>
                            {target.label}
                          </option>
                        ))}
                      </select>
                      <input
                        className="glass-field"
                        value={rule.match}
                        placeholder="contém..."
                        onChange={(event) => updateRule(rule.id, { match: event.target.value })}
                      />
                      <select
                        className="glass-field"
                        value={rule.category}
                        onChange={(event) => updateRule(rule.id, { category: event.target.value as TabCategory })}
                      >
                        {CATEGORY_ORDER.map((category) => (
                          <option key={category} value={category}>
                            {CATEGORY_META[category].label}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-cyan-300"
                          checked={rule.enabled}
                          onChange={(event) => updateRule(rule.id, { enabled: event.target.checked })}
                        />
                        On
                      </label>
                    </div>
                    <button
                      className="mt-2 text-xs text-rose-200 hover:text-rose-100"
                      onClick={() =>
                        setSettings((current) => ({
                          ...current,
                          customRules: current.customRules.filter((item) => item.id !== rule.id)
                        }))
                      }
                    >
                      Remover regra
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="glass-card mt-4 rounded-2xl p-5">
          <div className="flex flex-wrap gap-2">
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
    <label className="flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-slate-950/30 px-3">
      <span className="text-sm text-slate-200">{label}</span>
      <input
        type="checkbox"
        className="h-5 w-5 accent-cyan-300"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
