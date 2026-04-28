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
  return (
    <div className="relative h-[460px] w-full max-w-[460px]">
      <div className="ninja-ground absolute inset-x-10 bottom-8 h-14 rounded-[50%] bg-cyan-950/50 blur-xl" />
      <svg className="ninja-float relative z-10 h-full w-full" viewBox="0 0 460 460" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="focusGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(230 226) rotate(90) scale(190)">
            <stop stopColor="#67E8F9" stopOpacity="0.8" />
            <stop offset="1" stopColor="#0F172A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="suit" x1="156" y1="116" x2="310" y2="344" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1E293B" />
            <stop offset="1" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="face" x1="189" y1="165" x2="268" y2="219" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F8E3C7" />
            <stop offset="1" stopColor="#E7B98F" />
          </linearGradient>
          <linearGradient id="redBand" x1="166" y1="150" x2="308" y2="174" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FB7185" />
            <stop offset="1" stopColor="#DC2626" />
          </linearGradient>
        </defs>

        <circle cx="230" cy="226" r="190" fill="url(#focusGlow)" opacity="0.34" />
        <circle className="ninja-aura" cx="230" cy="226" r="148" stroke="#67E8F9" strokeOpacity="0.35" strokeWidth="3" />
        <circle className="ninja-aura ninja-aura-delay" cx="230" cy="226" r="104" stroke="#5EEAD4" strokeOpacity="0.2" strokeWidth="2" />

        <g className="ninja-breathe">
          <path
            d="M118 333C151 289 194 286 230 316C266 286 309 289 342 333C313 358 262 359 230 337C198 359 147 358 118 333Z"
            fill="#0B1120"
            stroke="#5EEAD4"
            strokeOpacity="0.38"
            strokeWidth="6"
          />
          <path d="M150 324C174 312 199 313 219 330" stroke="#1E293B" strokeWidth="24" strokeLinecap="round" />
          <path d="M310 324C286 312 261 313 241 330" stroke="#1E293B" strokeWidth="24" strokeLinecap="round" />
          <path d="M165 352C186 362 207 359 230 342C253 359 274 362 295 352" stroke="#020617" strokeWidth="12" strokeLinecap="round" />

          <path
            d="M156 212C156 151 186 112 230 112C274 112 304 151 304 212V248C304 294 274 326 230 326C186 326 156 294 156 248V212Z"
            fill="url(#suit)"
            stroke="#67E8F9"
            strokeOpacity="0.32"
            strokeWidth="6"
          />
          <path d="M178 128C197 101 263 101 282 128C264 119 196 119 178 128Z" fill="#020617" />
          <path d="M170 166C178 132 199 117 230 117C261 117 282 132 290 166C272 153 252 147 230 147C208 147 188 153 170 166Z" fill="#020617" />

          <g className="ninja-headband">
            <path d="M165 158C195 147 265 147 295 158L288 178C258 170 202 170 172 178L165 158Z" fill="url(#redBand)" />
            <path d="M288 160C316 147 337 151 357 168C333 168 314 175 296 188L288 160Z" fill="#DC2626" />
            <path d="M301 177C330 176 348 187 360 207C335 198 316 198 294 206L301 177Z" fill="#B91C1C" />
          </g>

          <path d="M178 175C191 158 210 149 230 149C250 149 269 158 282 175V215C282 241 260 262 230 262C200 262 178 241 178 215V175Z" fill="url(#face)" />
          <path d="M177 198H283V222C268 232 250 237 230 237C210 237 192 232 177 222V198Z" fill="#020617" />
          <path className="ninja-eyes" d="M202 190C210 185 218 185 225 190M235 190C242 185 250 185 258 190" stroke="#020617" strokeWidth="7" strokeLinecap="round" />
          <path d="M214 211C225 216 236 216 247 211" stroke="#334155" strokeWidth="4" strokeLinecap="round" />

          <path d="M178 254C155 258 129 276 114 302" stroke="#111827" strokeWidth="28" strokeLinecap="round" />
          <path d="M282 254C305 258 331 276 346 302" stroke="#111827" strokeWidth="28" strokeLinecap="round" />
          <path className="ninja-hands" d="M151 298C178 319 207 313 221 290" stroke="#0B1120" strokeWidth="19" strokeLinecap="round" />
          <path className="ninja-hands" d="M309 298C282 319 253 313 239 290" stroke="#0B1120" strokeWidth="19" strokeLinecap="round" />
          <circle className="ninja-orb" cx="230" cy="286" r="12" fill="#22D3EE" opacity="0.88" />
          <circle className="ninja-orb" cx="230" cy="286" r="26" stroke="#67E8F9" strokeOpacity="0.2" strokeWidth="3" />

          <path d="M197 270L230 292L263 270" stroke="#334155" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M188 300H272" stroke="#DC2626" strokeWidth="11" strokeLinecap="round" />
        </g>

        <g className="ninja-smoke" stroke="#A5F3FC" strokeOpacity="0.26" strokeWidth="4" strokeLinecap="round">
          <path d="M108 228C88 212 90 190 112 176" />
          <path d="M356 232C378 214 374 190 350 174" />
          <path d="M230 76C210 60 214 40 236 30" />
        </g>
        <g className="ninja-particles" fill="#A5F3FC">
          <circle cx="110" cy="140" r="4" />
          <circle cx="344" cy="154" r="3" />
          <circle cx="92" cy="286" r="3" />
          <circle cx="368" cy="292" r="4" />
          <circle cx="230" cy="64" r="3" />
        </g>
      </svg>
    </div>
  );
}
