"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { MessageSquare, Send } from "lucide-react";

type Conversation = {
  callId: string;
  callerName: string | null;
  messageCount: number;
  lastMessage: {
    id: string;
    text: string;
    fromUser: boolean;
    timestamp: string;
  } | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  text: string;
  fromUser: boolean;
  timestamp: string;
};

export default function ConversationsPage() {
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [messageInput, setMessageInput] = React.useState("");
  const [ws, setWs] = React.useState<WebSocket | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = React.useState(false);
  const [newChatName, setNewChatName] = React.useState("");

  React.useEffect(() => {
    (async () => {
      const me = await apiFetch("/api/auth/me");
      if (!me.ok) {
        window.location.href = "/login";
        return;
      }
      const userData = await me.json();
      setUserId(userData.userId);
      setAuthed(true);
      await loadConversations();
    })();
  }, []);

  React.useEffect(() => {
    if (!userId) return;

    // Conectar WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      websocket.send(JSON.stringify({
        type: 'join',
        userId: userId,
        role: 'admin'
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message' && data.callId) {
          // Nova mensagem recebida
          if (selectedConv === data.callId) {
            setMessages(prev => [...prev, data.message]);
          }
          // Atualizar lista de conversas
          loadConversations();
        } else if (data.type === 'conversations_list') {
          setConversations(data.conversations || []);
        }
      } catch (e) {
        console.error('Erro ao processar mensagem WebSocket:', e);
      }
    };

    websocket.onerror = () => {
      console.error('Erro na conexão WebSocket');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [userId, selectedConv]);

  async function loadConversations() {
    try {
      const resp = await apiFetch("/api/conversations");
      const data = await resp.json();
      setConversations(data.conversations || []);
    } catch (e) {
      console.error('Erro ao carregar conversas:', e);
    }
  }

  async function selectConversation(callId: string) {
    setSelectedConv(callId);
    try {
      const resp = await apiFetch(`/api/conversation/${callId}`);
      const data = await resp.json();
      setMessages(data.conversation?.messages || []);
      
      // Solicitar atualizações via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'join_conversation',
          callId: callId
        }));
      }
    } catch (e) {
      console.error('Erro ao carregar conversa:', e);
    }
  }

  async function sendMessage() {
    if (!selectedConv || !messageInput.trim()) return;

    try {
      const resp = await apiFetch(`/api/conversation/${selectedConv}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageInput.trim() })
      });
      
      const data = await resp.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        setMessageInput("");
        await loadConversations();
      }
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
    }
  }

  async function createNewChat() {
    if (!newChatName.trim()) {
      alert('Digite um nome para o chat');
      return;
    }

    try {
      const resp = await apiFetch('/api/conversations/chat-only', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerName: newChatName.trim() })
      });
      
      const data = await resp.json();
      if (data.chatId) {
        setShowNewChatModal(false);
        setNewChatName("");
        await loadConversations();
        selectConversation(data.chatId);
        showToast(`Chat criado! Link: ${data.chatUrl}`);
      }
    } catch (e: any) {
      console.error('Erro ao criar chat:', e);
      alert('Erro ao criar chat: ' + (e?.message || 'Erro desconhecido'));
    }
  }

  function showToast(message: string) {
    // Toast simples
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const selectedConversation = conversations.find(c => c.callId === selectedConv);

  if (authed === null) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;
  }

  return (
    <AppShell title="Conversas">
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4 h-[calc(100vh-200px)]">
        {/* Lista de Conversas */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Conversas</h2>
            <button
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors"
              onClick={() => setShowNewChatModal(true)}
            >
              + Nova
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-white/50">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversa ainda</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {conversations.map((conv) => (
                  <button
                    key={conv.callId}
                    onClick={() => selectConversation(conv.callId)}
                    className={`w-full p-4 text-left hover:bg-neutral-800/50 transition-colors ${
                      selectedConv === conv.callId ? 'bg-red-500/10 border-l-2 border-red-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${conv.active ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <span className="font-semibold text-white">
                          {conv.callerName || `Lead ${conv.callId.slice(0, 8)}`}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        conv.active 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-neutral-700 text-neutral-400'
                      }`}>
                        {conv.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <div className="text-xs text-white/60 mb-1">
                      {formatDate(conv.updatedAt)}
                    </div>
                    {conv.lastMessage && (
                      <div className="text-sm text-white/80 truncate">
                        {conv.lastMessage.text}
                      </div>
                    )}
                    <div className="text-xs text-white/40 mt-1">
                      {conv.messageCount} mensagens
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Área de Chat */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg flex flex-col">
          {selectedConv ? (
            <>
              <div className="p-4 border-b border-neutral-800">
                <h3 className="text-lg font-bold text-white">
                  {selectedConversation?.callerName || `Lead ${selectedConv.slice(0, 8)}`}
                </h3>
                <p className="text-sm text-white/60">
                  {selectedConversation?.active ? 'Conversa ativa' : 'Conversa inativa'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-white/50 py-8">
                    <p>Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.fromUser ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.fromUser
                            ? 'bg-neutral-800 border border-neutral-700 text-white'
                            : 'bg-purple-600/30 border border-purple-500/50 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs text-white/40 mt-1">
                          {formatDate(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-neutral-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        sendMessage();
                      }
                    }}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/50">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa na lista</p>
                <p className="text-sm mt-2">Escolha uma conversa para ver os detalhes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar Novo Chat */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowNewChatModal(false)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Nova Conversa</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome do Cliente</label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Ex: João, Maria..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') createNewChat();
                  }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createNewChat}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Criar Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

