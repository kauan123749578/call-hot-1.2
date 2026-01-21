"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const resp = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Erro ao solicitar recuperação");
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-10 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-2xl border border-neutral-800 bg-[#0a0a0a] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black tracking-tighter mb-2">
              <span className="text-white">Recuperar</span> <span className="text-[#d61f1f]">Senha</span>
            </h1>
            <p className="text-xs text-gray-500">
              Digite seu email para receber o link de recuperação
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-green-900/50 bg-green-900/20 p-4 text-sm text-green-200">
                <p className="font-bold mb-2">✓ Email enviado!</p>
                <p className="text-xs">
                  Se o email existir em nossa base, você receberá instruções para redefinir sua senha.
                  Verifique sua caixa de entrada e spam.
                </p>
              </div>
              <Link href="/login">
                <Button className="h-12 w-full bg-gradient-to-r from-[#b91c1c] to-[#d61f1f] text-sm font-bold uppercase tracking-widest text-white">
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  type="email"
                  className="h-12 border-neutral-800 bg-black text-white placeholder:text-gray-600 focus:border-[#d61f1f] transition-all"
                  disabled={loading}
                  required
                />
              </div>

              {error ? (
                <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-xs text-red-200 animate-shake">
                  {error}
                </div>
              ) : null}

              <Button
                className="h-12 w-full bg-gradient-to-r from-[#b91c1c] to-[#d61f1f] text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-red-900/20 hover:from-[#991b1b] hover:to-[#b91c1c] transition-all transform active:scale-[0.98]"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Enviando...
                  </span>
                ) : "Enviar Link de Recuperação"}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-xs text-gray-500 hover:text-[#d61f1f] transition-colors"
                >
                  Voltar ao Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

