"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

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

export default function ConnectingPage({ params }: { params: { callId: string } }) {
  const callId = params.callId;
  const [info, setInfo] = React.useState<CallInfo | null>(null);
  const [connecting, setConnecting] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const resp = await apiFetch(`/api/call/${encodeURIComponent(callId)}`);
        const data = await resp.json();
        if (resp.ok) {
          setInfo(data);
        }
      } catch {
        // Ignora erros
      }

      // Simula conexão por 2-3 segundos
      const delay = 2000 + Math.random() * 1000;
      setTimeout(() => {
        setConnecting(false);
        // Redireciona para a chamada após conectar
        setTimeout(() => {
          window.location.href = `/video/${encodeURIComponent(callId)}`;
        }, 500);
      }, delay);
    })();
  }, [callId]);

  const name = info?.callerName || "Contato";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 bg-[#0a0612]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.9))]" />
        <div 
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.25'/%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px'
          }} 
        />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Avatar */}
        <div className="mt-4 relative">
          <div className="relative h-[140px] w-[140px] overflow-hidden rounded-full border-[3px] border-emerald-500/60 shadow-[0_0_50px_rgba(16,185,129,0.3)] backdrop-blur-md">
            {info?.callerAvatarUrl ? (
              <img
                src={info.callerAvatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-900 text-4xl font-black text-white">
                {initials(name)}
              </div>
            )}
          </div>
        </div>

        {/* Informações */}
        <div className="mt-10 space-y-4 text-center">
          <div className="text-[28px] font-black tracking-tight text-white drop-shadow-2xl">
            {name}
          </div>
          
          {/* Indicador de conexão */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            </div>
            <div className="text-[15px] font-semibold text-white/80 tracking-wide animate-pulse">
              {connecting ? "Conectando..." : "Conectado!"}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}


