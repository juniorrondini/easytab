import { Brain, Clock, Wind } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

const FOCUS_MINUTES = 25;

export function FocusMode() {
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);

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

  return (
    <main className="liquid-panel flex min-h-screen items-center justify-center px-5 py-8 text-slate-100">
      <section className="glass-card grid w-full max-w-5xl gap-8 rounded-[28px] p-6 md:grid-cols-[1fr_1fr] md:p-10">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Modo foco</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-white">Respire, escolha uma tarefa e proteja seu contexto.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Suas abas foram salvas como sessão, as inativas foram hibernadas e o workspace foi organizado. Use este ciclo para
            trabalhar sem procurar abas a cada cinco minutos.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <FocusMetric icon={<Clock size={18} />} label="Ciclo" value={`${minutes}:${seconds}`} />
            <FocusMetric icon={<Brain size={18} />} label="Estado" value={secondsLeft === 0 ? 'Pronto' : 'Foco'} />
            <FocusMetric icon={<Wind size={18} />} label="Ritmo" value="4-4" />
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

function MeditatingNinja() {
  return (
    <div className="relative h-[420px] w-[420px]">
      <div className="absolute inset-x-12 bottom-10 h-12 rounded-[50%] bg-cyan-950/40 blur-xl" />
      <svg className="ninja-float relative z-10 h-full w-full" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="210" cy="210" r="172" fill="url(#focusGlow)" opacity="0.28" />
        <circle className="ninja-aura" cx="210" cy="210" r="132" stroke="#67E8F9" strokeOpacity="0.34" strokeWidth="3" />
        <g className="ninja-breathe">
          <path d="M114 292C142 258 180 249 210 276C240 249 278 258 306 292C280 309 238 312 210 294C182 312 140 309 114 292Z" fill="#0F172A" stroke="#5EEAD4" strokeOpacity="0.45" strokeWidth="5" />
          <path d="M143 286C162 279 181 278 198 289" stroke="#1E293B" strokeWidth="18" strokeLinecap="round" />
          <path d="M277 286C258 279 239 278 222 289" stroke="#1E293B" strokeWidth="18" strokeLinecap="round" />
          <path d="M160 182C160 139 181 112 210 112C239 112 260 139 260 182V218C260 249 239 270 210 270C181 270 160 249 160 218V182Z" fill="#111827" stroke="#67E8F9" strokeOpacity="0.35" strokeWidth="5" />
          <path d="M169 176C176 142 190 127 210 127C230 127 244 142 251 176C238 166 225 162 210 162C195 162 182 166 169 176Z" fill="#020617" />
          <rect x="172" y="181" width="76" height="34" rx="17" fill="#E0F2FE" />
          <path className="ninja-eyes" d="M190 198C197 193 203 193 210 198C217 193 223 193 230 198" stroke="#020617" strokeWidth="6" strokeLinecap="round" />
          <path d="M154 222C124 224 103 238 92 265" stroke="#111827" strokeWidth="24" strokeLinecap="round" />
          <path d="M266 222C296 224 317 238 328 265" stroke="#111827" strokeWidth="24" strokeLinecap="round" />
          <path d="M122 254C146 269 173 268 194 249" stroke="#0F172A" strokeWidth="18" strokeLinecap="round" />
          <path d="M298 254C274 269 247 268 226 249" stroke="#0F172A" strokeWidth="18" strokeLinecap="round" />
          <circle cx="210" cy="240" r="10" fill="#22D3EE" opacity="0.75" />
        </g>
        <g className="ninja-particles" fill="#A5F3FC">
          <circle cx="120" cy="130" r="4" />
          <circle cx="312" cy="150" r="3" />
          <circle cx="96" cy="226" r="3" />
          <circle cx="330" cy="250" r="4" />
        </g>
        <defs>
          <radialGradient id="focusGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(210 210) rotate(90) scale(172)">
            <stop stopColor="#67E8F9" />
            <stop offset="1" stopColor="#0F172A" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
