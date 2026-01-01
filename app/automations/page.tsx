"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

type Automation = {
  automationId: string;
  name: string;
  title: string | null;
  videoUrl: string;
  callerName: string | null;
  callerAvatarUrl: string | null;
  expectedAmount: number | null;
  secret: string;
  isActive: boolean;
  automationUrl: string;
  callsGenerated: number;
  createdAt: string;
};

function fmtBRL(value: number | null) {
  if (value === null) return "-";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AutomationsPage() {
  const [automations, setAutomations] = React.useState<Automation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  // Form states
  const [name, setName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [callerName, setCallerName] = React.useState("");
  const [callerAvatarUrl, setCallerAvatarUrl] = React.useState("");
  const [expectedAmount, setExpectedAmount] = React.useState("");
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);

  // Telegram Bot states
  const [showTelegramConfig, setShowTelegramConfig] = React.useState(false);
  const [telegramToken, setTelegramToken] = React.useState("");
  const [telegramAutomationId, setTelegramAutomationId] = React.useState<string | null>(null);
  const [telegramBotConfig, setTelegramBotConfig] = React.useState<{
    configured: boolean;
    tokenPreview?: string;
    automationId?: string | null;
    automationName?: string | null;
    messages?: any;
  } | null>(null);

  // Bot Messages states
  const [welcomeMessage, setWelcomeMessage] = React.useState("");
  const [priceTable, setPriceTable] = React.useState("");
  const [priceOptions, setPriceOptions] = React.useState<Array<{duration: string, price: number, label?: string}>>([]);
  const [paymentConfirmation, setPaymentConfirmation] = React.useState("");
  const [timeSelection, setTimeSelection] = React.useState("");
  const [timeOptions, setTimeOptions] = React.useState<string[]>([]);
  const [callReadyMessage, setCallReadyMessage] = React.useState("");
  const [callButtonText, setCallButtonText] = React.useState("");

  function showToast(message: string) {
    setToast(message);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), 3000);
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function refresh() {
    const resp = await apiFetch("/api/automations");
    if (resp.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await resp.json();
    setAutomations(Array.isArray(data?.automations) ? data.automations : []);
  }

  React.useEffect(() => {
    refresh();
    loadTelegramBotConfig();
  }, []);

  async function loadTelegramBotConfig() {
    try {
      const resp = await apiFetch("/api/telegram-bot");
      if (resp.ok) {
        const data = await resp.json();
        setTelegramBotConfig(data);
        if (data.configured && data.automationId) {
          setTelegramAutomationId(data.automationId);
        }
        if (data.messages) {
          setWelcomeMessage(data.messages.welcomeMessage || "");
          setPriceTable(data.messages.priceTable || "");
          setPriceOptions(data.messages.priceOptions || []);
          setPaymentConfirmation(data.messages.paymentConfirmation || "");
          setTimeSelection(data.messages.timeSelection || "");
          setTimeOptions(data.messages.timeOptions || []);
          setCallReadyMessage(data.messages.callReadyMessage || "");
          setCallButtonText(data.messages.callButtonText || "");
        }
      }
    } catch (e) {
      console.error("Erro ao carregar configuração do bot:", e);
    }
  }

  function addPriceOption() {
    setPriceOptions([...priceOptions, { duration: "", price: 0, label: "" }]);
  }

  function removePriceOption(index: number) {
    setPriceOptions(priceOptions.filter((_, i) => i !== index));
  }

  function updatePriceOption(index: number, field: string, value: any) {
    const updated = [...priceOptions];
    updated[index] = { ...updated[index], [field]: value };
    setPriceOptions(updated);
  }

  function addTimeOption() {
    setTimeOptions([...timeOptions, ""]);
  }

  function removeTimeOption(index: number) {
    setTimeOptions(timeOptions.filter((_, i) => i !== index));
  }

  async function saveTelegramBot() {
    if (!telegramToken) {
      showToast("Token do bot é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const messages = {
        welcomeMessage,
        priceTable,
        priceOptions: priceOptions.filter(p => p.duration && p.price > 0),
        paymentConfirmation,
        timeSelection,
        timeOptions: timeOptions.filter(t => t.trim() !== ""),
        callReadyMessage,
        callButtonText
      };

      const resp = await apiFetch("/api/telegram-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: telegramToken,
          automationId: telegramAutomationId || null,
          messages
        })
      });
      if (!resp.ok) throw new Error("Erro ao configurar bot");
      showToast("Bot do Telegram configurado com sucesso!");
      setShowTelegramConfig(false);
      setTelegramToken("");
      await loadTelegramBotConfig();
    } catch (e: any) {
      showToast(e?.message || "Erro ao configurar bot. Verifique se o token é válido.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTelegramBot() {
    if (!confirm("Tem certeza que deseja remover o bot do Telegram?")) return;
    
    setLoading(true);
    try {
      const resp = await apiFetch("/api/telegram-bot", {
        method: "DELETE"
      });
      if (!resp.ok) throw new Error("Erro ao remover bot");
      showToast("Bot removido com sucesso!");
      await loadTelegramBotConfig();
    } catch (e: any) {
      showToast(e?.message || "Erro ao remover bot");
    } finally {
      setLoading(false);
    }
  }

  async function uploadVideo(file: File) {
    const formData = new FormData();
    formData.append("video", file);
    const resp = await apiFetch("/api/upload-video", {
      method: "POST",
      body: formData
    });
    if (!resp.ok) throw new Error("Erro ao fazer upload do vídeo");
    const data = await resp.json();
    return data.videoUrl as string;
  }

  async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    const resp = await apiFetch("/api/upload-avatar", {
      method: "POST",
      body: formData
    });
    if (!resp.ok) throw new Error("Erro ao fazer upload do avatar");
    const data = await resp.json();
    return data.avatarUrl as string;
  }

  function resetForm() {
    setName("");
    setTitle("");
    setVideoUrl("");
    setCallerName("");
    setCallerAvatarUrl("");
    setExpectedAmount("");
    setVideoFile(null);
    setAvatarFile(null);
    setEditingId(null);
    setShowForm(false);
  }

  function editAutomation(auto: Automation) {
    setName(auto.name);
    setTitle(auto.title || "");
    setVideoUrl(auto.videoUrl);
    setCallerName(auto.callerName || "");
    setCallerAvatarUrl(auto.callerAvatarUrl || "");
    setExpectedAmount(auto.expectedAmount ? String(auto.expectedAmount) : "");
    setEditingId(auto.automationId);
    setShowForm(true);
  }

  async function saveAutomation() {
    if (!name || !videoUrl) {
      showToast("Nome e URL do vídeo são obrigatórios");
      return;
    }

    setLoading(true);
    try {
      let vUrl = videoUrl;
      let aUrl = callerAvatarUrl;
      
      if (videoFile && !vUrl) {
        vUrl = await uploadVideo(videoFile);
      }
      if (!vUrl) {
        throw new Error("Selecione um vídeo ou forneça uma URL");
      }
      if (avatarFile && !aUrl) {
        aUrl = await uploadAvatar(avatarFile);
      }

      if (editingId) {
        // Update
        const resp = await apiFetch(`/api/automation/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            title: title || null,
            videoUrl: vUrl,
            callerName: callerName || null,
            callerAvatarUrl: aUrl || null,
            expectedAmount: expectedAmount || null
          })
        });
        if (!resp.ok) throw new Error("Erro ao atualizar automação");
        showToast("Automação atualizada com sucesso!");
      } else {
        // Create
        const resp = await apiFetch("/api/automations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            title: title || null,
            videoUrl: vUrl,
            callerName: callerName || null,
            callerAvatarUrl: aUrl || null,
            expectedAmount: expectedAmount || null
          })
        });
        if (!resp.ok) throw new Error("Erro ao criar automação");
        showToast("Automação criada com sucesso!");
      }

      resetForm();
      await refresh();
    } catch (e: any) {
      showToast(e?.message || "Erro ao salvar automação");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAutomation(automationId: string) {
    if (!confirm("Tem certeza que deseja deletar esta automação?")) return;
    
    setLoading(true);
    try {
      const resp = await apiFetch(`/api/automation/${automationId}`, {
        method: "DELETE"
      });
      if (!resp.ok) throw new Error("Erro ao deletar automação");
      showToast("Automação deletada com sucesso!");
      await refresh();
    } catch (e: any) {
      showToast(e?.message || "Erro ao deletar automação");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(automationId: string, currentState: boolean) {
    setLoading(true);
    try {
      const resp = await apiFetch(`/api/automation/${automationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentState })
      });
      if (!resp.ok) throw new Error("Erro ao atualizar automação");
      showToast(`Automação ${!currentState ? "ativada" : "desativada"} com sucesso!`);
      await refresh();
    } catch (e: any) {
      showToast(e?.message || "Erro ao atualizar automação");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showToast("Link copiado para a área de transferência!");
  }

  return (
    <AppShell title="Automações" onLogout={logout}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-red-600 px-4 py-2 text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={refresh} disabled={loading}>
          Atualizar
        </Button>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={loading}
        >
          + Nova Automação
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowTelegramConfig(!showTelegramConfig)}
          disabled={loading}
        >
          🤖 {telegramBotConfig?.configured ? "Configurar Bot Telegram" : "Conectar Bot Telegram"}
        </Button>
      </div>

      {showTelegramConfig && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configurar Bot do Telegram</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-white/80">
              <strong>Como configurar:</strong>
              <ol className="mt-2 ml-4 list-decimal space-y-1">
                <li>Abra o Telegram e procure por @BotFather</li>
                <li>Envie /newbot e siga as instruções</li>
                <li>Copie o token fornecido pelo BotFather</li>
                <li>Cole o token abaixo e selecione uma automação</li>
                <li>Use /call no seu bot para gerar chamadas!</li>
              </ol>
            </div>

            {telegramBotConfig?.configured && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <div className="text-sm text-white/80">
                  <strong>Bot configurado:</strong> {telegramBotConfig.tokenPreview}
                  {telegramBotConfig.automationName && (
                    <div className="mt-1">Automação: {telegramBotConfig.automationName}</div>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={deleteTelegramBot}
                  disabled={loading}
                >
                  Remover Bot
                </Button>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm text-white/70">Token do Bot *</label>
              <Input
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="bg-white/5 border-white/10 font-mono text-xs"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Vincular Automação (opcional)</label>
              <select
                value={telegramAutomationId || ""}
                onChange={(e) => setTelegramAutomationId(e.target.value || null)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Nenhuma (configurar depois)</option>
                {automations
                  .filter(a => a.isActive)
                  .map((auto) => (
                    <option key={auto.automationId} value={auto.automationId}>
                      {auto.name}
                    </option>
                  ))}
              </select>
              <div className="mt-2 text-xs text-white/50">
                Quando alguém usar /call no bot, será gerada uma call usando esta automação
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Configurar Mensagens do Bot</h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-white/70">Mensagem de Boas-vindas (/start)</label>
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Ex: amorzinho agora que finalmente chegou aqui quero te dar um presentinho especial..."
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Tabela de Preços (texto acima dos botões)</label>
                  <textarea
                    value={priceTable}
                    onChange={(e) => setPriceTable(e.target.value)}
                    placeholder="Ex: veja minha tabela abaixo:&#10;15 minutos = 30 reais&#10;25 minutos = 45 reais"
                    rows={4}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 font-mono"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Opções de Preço</label>
                  <div className="space-y-2">
                    {priceOptions.map((option, index) => (
                      <div key={index} className="flex gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                        <Input
                          value={option.duration}
                          onChange={(e) => updatePriceOption(index, "duration", e.target.value)}
                          placeholder="Duração (ex: 15 minutos)"
                          className="flex-1 bg-white/5 border-white/10 text-sm"
                        />
                        <Input
                          type="number"
                          value={option.price}
                          onChange={(e) => updatePriceOption(index, "price", parseFloat(e.target.value) || 0)}
                          placeholder="Preço"
                          className="w-24 bg-white/5 border-white/10 text-sm"
                        />
                        <Input
                          value={option.label || ""}
                          onChange={(e) => updatePriceOption(index, "label", e.target.value)}
                          placeholder="Label do botão (opcional)"
                          className="flex-1 bg-white/5 border-white/10 text-sm"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => removePriceOption(index)}
                          disabled={loading}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={addPriceOption}
                      disabled={loading}
                    >
                      + Adicionar Opção
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Mensagem de Confirmação de Pagamento</label>
                  <textarea
                    value={paymentConfirmation}
                    onChange={(e) => setPaymentConfirmation(e.target.value)}
                    placeholder="Ex: amorzinho eu recebi o seu pagamento aqui, voce escolheu {duration}"
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                  />
                  <div className="mt-1 text-xs text-white/50">
                    Use {"{duration}"} e {"{price}"} para substituir pelos valores selecionados
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Mensagem de Seleção de Horário</label>
                  <Input
                    value={timeSelection}
                    onChange={(e) => setTimeSelection(e.target.value)}
                    placeholder="Ex: agora é só escolher em qual horario voce quer a chamada amorzinho"
                    className="w-full bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Opções de Horário</label>
                  <div className="space-y-2">
                    {timeOptions.map((time, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={time}
                          onChange={(e) => {
                            const updated = [...timeOptions];
                            updated[index] = e.target.value;
                            setTimeOptions(updated);
                          }}
                          placeholder="Ex: AGORA, 23:00, 00:00"
                          className="flex-1 bg-white/5 border-white/10"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => removeTimeOption(index)}
                          disabled={loading}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={addTimeOption}
                      disabled={loading}
                    >
                      + Adicionar Horário
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Mensagem de Chamada Pronta</label>
                  <textarea
                    value={callReadyMessage}
                    onChange={(e) => setCallReadyMessage(e.target.value)}
                    placeholder="Ex: amorzinho voce escolheu fazer a chamadinha agora e eu estou disponível..."
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Texto do Botão de Iniciar Chamada</label>
                  <Input
                    value={callButtonText}
                    onChange={(e) => setCallButtonText(e.target.value)}
                    placeholder="Ex: INICIAR CHAMADA"
                    className="w-full bg-white/5 border-white/10"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button onClick={saveTelegramBot} disabled={loading}>
                {telegramBotConfig?.configured ? "Atualizar" : "Configurar"}
              </Button>
              <Button variant="secondary" onClick={() => setShowTelegramConfig(false)} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Automação" : "Nova Automação"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/70">Nome da Automação *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Apresentação do Produto"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Título (opcional)</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da apresentação"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">URL do Vídeo *</label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://... ou faça upload abaixo"
                className="bg-white/5 border-white/10"
              />
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="mt-2 text-sm text-white/70"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Nome do Remetente (opcional)</label>
              <Input
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder="Nome que aparece na chamada"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Avatar (opcional)</label>
              <Input
                value={callerAvatarUrl}
                onChange={(e) => setCallerAvatarUrl(e.target.value)}
                placeholder="URL do avatar ou faça upload abaixo"
                className="bg-white/5 border-white/10"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="mt-2 text-sm text-white/70"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Valor Esperado (opcional)</label>
              <Input
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(e.target.value)}
                placeholder="R$ 0,00"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveAutomation} disabled={loading}>
                {editingId ? "Atualizar" : "Criar"}
              </Button>
              <Button variant="secondary" onClick={resetForm} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {automations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-white/60">
              Nenhuma automação criada ainda. Clique em "Nova Automação" para começar.
            </CardContent>
          </Card>
        ) : (
          automations.map((auto) => (
            <Card key={auto.automationId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {auto.name}
                      {!auto.isActive && (
                        <span className="rounded bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">
                          Desativada
                        </span>
                      )}
                    </CardTitle>
                    <div className="mt-2 text-sm text-white/60">
                      Criada em {new Date(auto.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleActive(auto.automationId, auto.isActive)}
                      disabled={loading}
                    >
                      {auto.isActive ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => editAutomation(auto)}
                      disabled={loading}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => deleteAutomation(auto.automationId)}
                      disabled={loading}
                    >
                      Deletar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-white/60">Calls Geradas</div>
                    <div className="mt-1 text-2xl font-extrabold">{auto.callsGenerated}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-white/60">Valor Esperado</div>
                    <div className="mt-1 text-xl font-semibold">{fmtBRL(auto.expectedAmount)}</div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs text-white/60">Link de Automação</label>
                  <div className="flex gap-2">
                    <Input
                      value={auto.automationUrl}
                      readOnly
                      className="bg-white/5 border-white/10 font-mono text-xs"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => copyToClipboard(auto.automationUrl)}
                    >
                      Copiar
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-white/50">
                    Use este link em requisições POST para gerar novas calls automaticamente
                  </div>
                </div>

                {auto.title && (
                  <div>
                    <div className="text-xs text-white/60">Título:</div>
                    <div className="text-sm text-white/80">{auto.title}</div>
                  </div>
                )}

                {auto.callerName && (
                  <div>
                    <div className="text-xs text-white/60">Remetente:</div>
                    <div className="text-sm text-white/80">{auto.callerName}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}

