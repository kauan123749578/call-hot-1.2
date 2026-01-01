"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export default function ApiDocsPage() {
  const [baseUrl, setBaseUrl] = React.useState("");

  React.useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <AppShell title="Documentação da API" onLogout={logout}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API de Automação - Gerar Sala de Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">Endpoint</h3>
              <code className="block rounded-lg bg-white/5 p-3 text-sm text-white">
                POST {baseUrl}/api/automation/[secret]
              </code>
              <p className="mt-2 text-sm text-white/70">
                Onde <code className="rounded bg-white/10 px-1">[secret]</code> é a chave privada da automação.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">Parâmetros</h3>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-2">
                  <code className="text-sm font-semibold text-white">secret</code>
                  <span className="ml-2 rounded bg-red-500/20 px-2 py-1 text-xs text-red-400">Obrigatório</span>
                </div>
                <p className="mt-1 text-sm text-white/70">
                  <strong>Tipo:</strong> string
                  <br />
                  <strong>Localização:</strong> URL Path
                  <br />
                  Chave privada da automação. É gerada automaticamente ao criar a automação e deve ser mantida em segredo.
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">Resposta de Sucesso (200)</h3>
              <pre className="rounded-lg bg-white/5 p-4 text-sm text-white">
{`{
  "success": true,
  "chatUrl": "${baseUrl}/ring/clx123abc456",
  "chatId": "clx123abc456"
}`}
              </pre>
              <div className="mt-2 space-y-1 text-sm text-white/70">
                <p><code className="rounded bg-white/10 px-1">success</code> - Indica que a sala foi criada com sucesso</p>
                <p><code className="rounded bg-white/10 px-1">chatUrl</code> - URL completa para acessar a sala criada</p>
                <p><code className="rounded bg-white/10 px-1">chatId</code> - ID único da sala gerada</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">Respostas de Erro</h3>
              
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <div className="mb-2 font-semibold text-red-400">400 - Bad Request</div>
                <pre className="text-sm text-white/80">
{`{
  "error": "Secret parameter is required"
}`}
                </pre>
                <p className="mt-2 text-sm text-white/70">Ocorre quando o parâmetro secret não é fornecido na URL.</p>
              </div>

              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <div className="mb-2 font-semibold text-red-400">404 - Not Found</div>
                <pre className="text-sm text-white/80">
{`{
  "error": "Invalid automation or secret"
}`}
                </pre>
                <p className="mt-2 text-sm text-white/70">
                  Ocorre quando a chave secreta não corresponde a nenhuma automação ou a automação está desativada.
                </p>
              </div>

              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <div className="mb-2 font-semibold text-red-400">500 - Internal Server Error</div>
                <pre className="text-sm text-white/80">
{`{
  "error": "Internal server error"
}`}
                </pre>
                <p className="mt-2 text-sm text-white/70">Erro inesperado do servidor.</p>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Exemplos de Uso</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 font-semibold text-white">cURL</h4>
                  <pre className="rounded-lg bg-white/5 p-4 text-sm text-white">
{`curl -X POST ${baseUrl}/api/automation/abc123xyz`}
                  </pre>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-white">JavaScript (fetch)</h4>
                  <pre className="rounded-lg bg-white/5 p-4 text-sm text-white">
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
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-white">Python (requests)</h4>
                  <pre className="rounded-lg bg-white/5 p-4 text-sm text-white">
{`import requests

url = "${baseUrl}/api/automation/abc123xyz"
response = requests.post(url)
data = response.json()

if data.get('success'):
    print(f"Sala criada: {data['chatUrl']}")
else:
    print(f"Erro: {data.get('error')}")`}
                  </pre>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-white">HTML (Botão em Landing Page)</h4>
                  <pre className="rounded-lg bg-white/5 p-4 text-sm text-white">
{`<button onclick="gerarChamada()">
  Iniciar Chamada
</button>

<script>
async function gerarChamada() {
  try {
    const response = await fetch(
      '${baseUrl}/api/automation/abc123xyz',
      { method: 'POST' }
    );
    const data = await response.json();
    
    if (data.success) {
      window.location.href = data.chatUrl;
    } else {
      alert('Erro: ' + data.error);
    }
  } catch (error) {
    alert('Erro ao gerar chamada');
  }
}
</script>`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <h4 className="mb-2 font-semibold text-blue-400">🔒 Segurança</h4>
              <ul className="ml-4 list-disc space-y-1 text-sm text-white/80">
                <li>Mantenha a chave secreta (secret) privada</li>
                <li>Não exponha o link completo publicamente</li>
                <li>Use apenas em requisições server-side ou com botões protegidos</li>
                <li>Cada automação pode ser ativada/desativada a qualquer momento</li>
              </ul>
            </div>

            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <h4 className="mb-2 font-semibold text-green-400">♻️ Reutilização</h4>
              <ul className="ml-4 list-disc space-y-1 text-sm text-white/80">
                <li>O mesmo link pode gerar infinitas salas</li>
                <li>Cada sala é completamente independente</li>
                <li>Ideal para processos de vendas escaláveis</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fluxo Completo de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-white">Criar Automação</h4>
                  <p className="mt-1 text-sm text-white/70">
                    Acesse <code className="rounded bg-white/10 px-1">/automations</code> e crie uma nova automação com:
                    nome, título, URL do vídeo, avatar, etc.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-white">Obter Link Privado</h4>
                  <p className="mt-1 text-sm text-white/70">
                    Após criar, você receberá algo como:
                    <code className="ml-1 rounded bg-white/10 px-1">
                      {baseUrl}/api/automation/abc123xyz
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-white">Compartilhar Link</h4>
                  <p className="mt-1 text-sm text-white/70">
                    Compartilhe o link privado com seus clientes através de:
                    página de vendas, email marketing, integração com CRM, automação de marketing
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-white">Cliente Acessa</h4>
                  <p className="mt-1 text-sm text-white/70">
                    Quando o cliente clica no botão/link, sua aplicação faz um POST para o endpoint.
                    O sistema cria uma nova sala e retorna o link único.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400">
                  5
                </div>
                <div>
                  <h4 className="font-semibold text-white">Redirecionar Cliente</h4>
                  <p className="mt-1 text-sm text-white/70">
                    Redirecione o cliente para o <code className="rounded bg-white/10 px-1">chatUrl</code> retornado.
                    Cada cliente terá sua própria sala isolada.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

