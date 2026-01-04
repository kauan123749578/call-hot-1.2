"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { Copy, Check, Code, Zap, Shield, RefreshCw } from "lucide-react";

export default function ApiDocsPage() {
  const [baseUrl, setBaseUrl] = React.useState("");
  const [copied, setCopied] = React.useState<string | null>(null);

  React.useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <AppShell title="Documentação da API" onLogout={logout}>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/40 via-black to-purple-950/40 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-purple-500/10" />
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-3 shadow-lg shadow-red-500/30">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">API de Automação</h1>
                <p className="text-sm text-white/60">Integre chamadas automáticas em sua aplicação</p>
              </div>
            </div>
            <div className="mt-6 rounded-lg border border-red-500/30 bg-black/40 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono text-red-400">
                  POST {baseUrl}/api/automation/[secret]
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(`POST ${baseUrl}/api/automation/[secret]`, "endpoint")}
                  className="h-8 w-8 p-0 text-white/60 hover:text-white"
                >
                  {copied === "endpoint" ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Docs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Endpoint Details */}
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-black">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <CardTitle className="text-white">Endpoint</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-purple-500/30 bg-black/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-purple-500/20 px-2 py-1 text-xs font-bold text-purple-300">
                      POST
                    </span>
                    <code className="text-sm font-mono text-white">
                      {baseUrl}/api/automation/[secret]
                    </code>
                  </div>
                  <p className="mt-3 text-sm text-white/70">
                    Onde <code className="rounded bg-purple-500/20 px-1.5 py-0.5 text-xs text-purple-300">[secret]</code> é a chave privada da automação.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Parameters */}
            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-950/30 to-black">
              <CardHeader>
                <CardTitle className="text-white">Parâmetros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-blue-500/30 bg-black/40 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <code className="text-sm font-semibold text-blue-300">secret</code>
                    <span className="rounded bg-red-500/20 px-2 py-1 text-xs font-bold text-red-400">
                      Obrigatório
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-white/80">
                    <p><strong className="text-blue-300">Tipo:</strong> string</p>
                    <p><strong className="text-blue-300">Localização:</strong> URL Path</p>
                    <p className="mt-2 text-white/60">
                      Chave privada da automação. É gerada automaticamente ao criar a automação e deve ser mantida em segredo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Response */}
            <Card className="border-green-500/20 bg-gradient-to-br from-green-950/30 to-black">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-500/20 p-1.5">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                  <CardTitle className="text-white">Resposta de Sucesso (200)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="overflow-x-auto rounded-lg border border-green-500/30 bg-black/60 p-4 text-sm text-green-100">
{`{
  "success": true,
  "chatUrl": "${baseUrl}/ring/clx123abc456",
  "chatId": "clx123abc456"
}`}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`{\n  "success": true,\n  "chatUrl": "${baseUrl}/ring/clx123abc456",\n  "chatId": "clx123abc456"\n}`, "success")}
                    className="absolute right-2 top-2 h-7 w-7 p-0 text-white/60 hover:text-white"
                  >
                    {copied === "success" ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <div className="space-y-2 rounded-lg bg-green-500/10 p-3">
                  <p className="text-sm text-white/90">
                    <code className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-300">success</code> - Indica que a sala foi criada com sucesso
                  </p>
                  <p className="text-sm text-white/90">
                    <code className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-300">chatUrl</code> - URL completa para acessar a sala criada
                  </p>
                  <p className="text-sm text-white/90">
                    <code className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-300">chatId</code> - ID único da sala gerada
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Error Responses */}
            <Card className="border-red-500/20 bg-gradient-to-br from-red-950/30 to-black">
              <CardHeader>
                <CardTitle className="text-white">Respostas de Erro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-red-500/30 px-2 py-1 text-xs font-bold text-red-300">
                      400
                    </span>
                    <span className="font-semibold text-red-400">Bad Request</span>
                  </div>
                  <pre className="mt-2 overflow-x-auto rounded bg-black/60 p-3 text-xs text-red-200">
{`{
  "error": "Secret parameter is required"
}`}
                  </pre>
                  <p className="mt-2 text-sm text-white/70">Ocorre quando o parâmetro secret não é fornecido na URL.</p>
                </div>

                <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-red-500/30 px-2 py-1 text-xs font-bold text-red-300">
                      404
                    </span>
                    <span className="font-semibold text-red-400">Not Found</span>
                  </div>
                  <pre className="mt-2 overflow-x-auto rounded bg-black/60 p-3 text-xs text-red-200">
{`{
  "error": "Invalid automation or secret"
}`}
                  </pre>
                  <p className="mt-2 text-sm text-white/70">
                    Ocorre quando a chave secreta não corresponde a nenhuma automação ou a automação está desativada.
                  </p>
                </div>

                <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-red-500/30 px-2 py-1 text-xs font-bold text-red-300">
                      500
                    </span>
                    <span className="font-semibold text-red-400">Internal Server Error</span>
                  </div>
                  <pre className="mt-2 overflow-x-auto rounded bg-black/60 p-3 text-xs text-red-200">
{`{
  "error": "Internal server error"
}`}
                  </pre>
                  <p className="mt-2 text-sm text-white/70">Erro inesperado do servidor.</p>
                </div>
              </CardContent>
            </Card>

            {/* Code Examples */}
            <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-black">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-cyan-400" />
                  <CardTitle className="text-white">Exemplos de Uso</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-cyan-300">
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs">cURL</span>
                  </h4>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg border border-cyan-500/30 bg-black/60 p-4 text-sm text-cyan-100">
{`curl -X POST ${baseUrl}/api/automation/abc123xyz`}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(`curl -X POST ${baseUrl}/api/automation/abc123xyz`, "curl")}
                      className="absolute right-2 top-2 h-7 w-7 p-0 text-white/60 hover:text-white"
                    >
                      {copied === "curl" ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-cyan-300">
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs">JavaScript</span>
                  </h4>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg border border-cyan-500/30 bg-black/60 p-4 text-sm text-cyan-100">
{`const response = await fetch(
  '${baseUrl}/api/automation/abc123xyz',
  { method: 'POST' }
);

const data = await response.json();

if (data.success) {
  console.log('Sala criada:', data.chatUrl);
  window.location.href = data.chatUrl;
} else {
  console.error('Erro:', data.error);
}`}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(`const response = await fetch(\n  '${baseUrl}/api/automation/abc123xyz',\n  { method: 'POST' }\n);\n\nconst data = await response.json();\n\nif (data.success) {\n  console.log('Sala criada:', data.chatUrl);\n  window.location.href = data.chatUrl;\n} else {\n  console.error('Erro:', data.error);\n}`, "js")}
                      className="absolute right-2 top-2 h-7 w-7 p-0 text-white/60 hover:text-white"
                    >
                      {copied === "js" ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-cyan-300">
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs">Python</span>
                  </h4>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg border border-cyan-500/30 bg-black/60 p-4 text-sm text-cyan-100">
{`import requests

url = "${baseUrl}/api/automation/abc123xyz"
response = requests.post(url)
data = response.json()

if data.get('success'):
    print(f"Sala criada: {data['chatUrl']}")
else:
    print(f"Erro: {data.get('error')}")`}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(`import requests\n\nurl = "${baseUrl}/api/automation/abc123xyz"\nresponse = requests.post(url)\ndata = response.json()\n\nif data.get('success'):\n    print(f"Sala criada: {data['chatUrl']}")\nelse:\n    print(f"Erro: {data.get('error')}")`, "python")}
                      className="absolute right-2 top-2 h-7 w-7 p-0 text-white/60 hover:text-white"
                    >
                      {copied === "python" ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Security */}
            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-950/30 to-black">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <CardTitle className="text-white">Segurança</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Mantenha a chave secreta privada
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Não exponha o link completo
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Use apenas server-side
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Ative/desative quando necessário
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Reusability */}
            <Card className="border-green-500/20 bg-gradient-to-br from-green-950/30 to-black">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-green-400" />
                  <CardTitle className="text-white">Reutilização</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400" />
                    Link gera infinitas salas
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400" />
                    Cada sala é independente
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400" />
                    Ideal para vendas escaláveis
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Quick Flow */}
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-black">
              <CardHeader>
                <CardTitle className="text-white">Fluxo Rápido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-xs font-bold text-white">
                      1
                    </div>
                    <p className="text-sm text-white/70">Criar automação</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-xs font-bold text-white">
                      2
                    </div>
                    <p className="text-sm text-white/70">Obter link privado</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-xs font-bold text-white">
                      3
                    </div>
                    <p className="text-sm text-white/70">Compartilhar link</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-xs font-bold text-white">
                      4
                    </div>
                    <p className="text-sm text-white/70">Cliente acessa</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-xs font-bold text-white">
                      5
                    </div>
                    <p className="text-sm text-white/70">Redirecionar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
