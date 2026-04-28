import { Brain, Clock, LayoutDashboard, LogOut, RotateCcw, Wind } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

const FOCUS_MINUTES = 25;

export function FocusMode() {
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');

  async function exitFocusMode() {
    setExiting(true);
    try {
      const currentTab = await chrome.tabs.getCurrent();
      if (currentTab?.id) {
        await chrome.tabs.remove(currentTab.id);
        return;
      }
      window.close();
    } catch {
      setExiting(false);
      window.location.href = chrome.runtime.getURL('dashboard.html');
    }
  }

  function openDashboard() {
    window.location.href = chrome.runtime.getURL('dashboard.html');
  }

  return (
    <main className="liquid-panel flex min-h-screen items-center justify-center px-5 py-8 text-slate-100">
      <section className="glass-card grid w-full max-w-6xl gap-8 rounded-[28px] p-6 md:grid-cols-[0.92fr_1.08fr] md:p-10">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Modo foco</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-white">Respire, escolha uma tarefa e proteja seu contexto.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Suas abas foram salvas como sessão, as inativas foram hibernadas e o workspace foi organizado. Quando terminar,
            saia do foco para voltar ao navegador normal.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <FocusMetric icon={<Clock size={18} />} label="Ciclo" value={`${minutes}:${seconds}`} />
            <FocusMetric icon={<Brain size={18} />} label="Estado" value={secondsLeft === 0 ? 'Pronto' : 'Foco'} />
            <FocusMetric icon={<Wind size={18} />} label="Ritmo" value="4-4" />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <FocusButton icon={<RotateCcw size={17} />} label="Reiniciar" onClick={() => setSecondsLeft(FOCUS_MINUTES * 60)} />
            <FocusButton icon={<LayoutDashboard size={17} />} label="Dashboard" onClick={openDashboard} />
            <button
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-rose-300/25 bg-rose-400/12 px-4 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/18 disabled:opacity-60"
              disabled={exiting}
              onClick={() => void exitFocusMode()}
            >
              <LogOut size={17} />
              {exiting ? 'Saindo' : 'Sair do foco'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <MeditatingNinja />
        </div>
      </section>
    </main>
  );
}

function FocusMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-100">{icon}</div>
      <strong className="block text-xl text-white">{value}</strong>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

function FocusButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="glass-card flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/50 hover:text-white"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function MeditatingNinja() {
  const webpUrl = chrome.runtime.getURL('assets/ninja-focus.webp');
  const gifUrl = chrome.runtime.getURL('assets/ninja-focus.gif');

  return (
    <div className="relative h-[460px] w-full max-w-[460px]">
      <div className="ninja-ground absolute inset-x-10 bottom-8 h-14 rounded-[50%] bg-cyan-950/50 blur-xl" />
      <div className="absolute inset-8 rounded-full bg-cyan-300/10 blur-3xl" />
      <picture>
        <source srcSet={webpUrl} type="image/webp" />
        <img
          className="ninja-float relative z-10 h-full w-full object-contain drop-shadow-[0_28px_48px_rgba(8,145,178,0.24)]"
          src={gifUrl}
          alt="Ninja 2D meditando durante o modo foco"
        />
      </picture>
    </div>
  );
}
