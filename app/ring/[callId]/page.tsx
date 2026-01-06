"use client";

import * as React from "react";
import { Phone, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";

type CallInfo = {
  callId: string;
  title: string | null;
  callerName: string | null;
  callerAvatarUrl: string | null;
  expiresAt: string | null;
};

function initials(name?: string | null) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return ((a + b) || "?").toUpperCase();
}

export default function RingPage({ params }: { params: { callId: string } }) {
  const callId = params.callId;
  const [info, setInfo] = React.useState<CallInfo | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`/api/call/${encodeURIComponent(callId)}`, {
          credentials: 'include'
        });
        const data = await resp.json();
        if (!resp.ok) {
          setError(data?.error || "Falha ao carregar call");
          return;
        }
        setInfo(data);
      } catch {
        setError("Erro de rede");
      }
    })();
  }, [callId]);

  const name = info?.callerName || "Contato";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 bg-black">
      {/* Background Preto */}
      <div className="absolute inset-0 bg-black" />
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Avatar com efeito de pulso e glow mais realista */}
        <div className="mt-4 relative">
          {/* Anéis de pulso múltiplos */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping-slow" />
          <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping-slow" style={{ animationDelay: '2s' }} />
          
          <div className="relative h-[140px] w-[140px] overflow-hidden rounded-full border-[3px] border-emerald-500/70 shadow-[0_0_60px_rgba(16,185,129,0.4),0_0_100px_rgba(16,185,129,0.2)] backdrop-blur-md">
            {info?.callerAvatarUrl ? (
              <img
                src={info.callerAvatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover transition-transform duration-700"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-900 text-4xl font-black text-white">
                {initials(name)}
              </div>
            )}
          </div>
        </div>

        {/* Informações da Chamada */}
        <div className="mt-10 space-y-3 text-center">
          <div className="text-[28px] font-black tracking-tight text-white drop-shadow-2xl">
            {name}
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[13px] font-semibold text-white/90 tracking-wide">
              {name} está te ligando em chamada de vídeo
            </span>
          </div>
        </div>

        {/* Ações de Chamada */}
        <div className="mt-20 grid grid-cols-2 gap-10 w-full px-6">
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className={cn(
              "group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95",
              error ? "opacity-60" : ""
            )}
          >
            <div className="relative h-[72px] w-[72px] flex items-center justify-center rounded-full bg-red-600/90 shadow-[0_0_30px_rgba(214,31,31,0.4)] transition-all group-hover:bg-red-500 group-hover:shadow-[0_0_40px_rgba(214,31,31,0.6)]">
              <PhoneOff className="relative z-10 h-7 w-7 text-white" />
              <div className="absolute inset-0 rounded-full bg-white/25 animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping-slow" />
            </div>
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider group-hover:text-white transition-colors">Recusar</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/track", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: 'include',
                  body: JSON.stringify({ callId, type: "call_answer" })
                });
              } catch {}
              window.location.href = `/connecting/${encodeURIComponent(callId)}`;
            }}
            className={cn("group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95", error ? "pointer-events-none opacity-40" : "")}
          >
            <div className="relative h-[72px] w-[72px] flex items-center justify-center rounded-full bg-emerald-500/90 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all group-hover:bg-emerald-400 group-hover:shadow-[0_0_50px_rgba(16,185,129,0.7)]">
              <Phone className="relative z-10 h-7 w-7 text-white animate-call-wiggle" />
              <div className="absolute inset-0 rounded-full bg-white/25 animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping-slow" />
            </div>
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider group-hover:text-white transition-colors">Atender</span>
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes ping-slow {
          75%, 100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        @keyframes call-wiggle {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-call-wiggle {
          animation: call-wiggle 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}


