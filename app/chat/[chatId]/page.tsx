"use client";

import * as React from "react";
import { MessageSquare, Send, Phone } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Message = {
  id: string;
  text: string;
  fromUser: boolean;
  timestamp: string;
};

export default function ChatOnlyPage({ params }: { params: { chatId: string } }) {
  const chatId = params.chatId;
  const [chatInfo, setChatInfo] = React.useState<{ callerName: string | null; linkedCallId: string | null; active: boolean } | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [messageInput, setMessageInput] = React.useState("");
  const [ws, setWs] = React.useState<WebSocket | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`/api/chat/${encodeURIComponent(chatId)}`);
        const data = await resp.json();
        if (!resp.ok) {
          alert('Chat não encontrado');
          window.location.href = '/';
          return;
        }
        setChatInfo(data);
        setLoading(false);
      } catch (e) {
        console.error('Erro ao carregar chat:', e);
        alert('Erro ao carregar chat');
        window.location.href = '/';
      }
    })();
  }, [chatId]);

  React.useEffect(() => {
    if (!chatId || loading) return;

    // Conectar WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      websocket.send(JSON.stringify({
        type: 'join',
        callId: chatId,
        role: 'guest'
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'chat_history' && Array.isArray(data.messages)) {
          // Carregar histórico
          setMessages(data.messages || []);
        } else if (data.type === 'new_message' && data.message) {
          // Nova mensagem recebida (do admin)
          setMessages(prev => {
            // Verificar se mensagem já existe para evitar duplicação
            const exists = prev.some(m => m.id === data.message.id);
            if (exists) return prev;
            return [...prev, data.message];
          });
        } else if (data.type === 'message_sent') {
          // Confirmação de envio
          console.log('Mensagem enviada:', data.messageId);
        }
      } catch (e) {
        console.error('Erro ao processar mensagem WebSocket:', e);
      }
    };

    websocket.onerror = () => {
      console.error('Erro na conexão WebSocket do chat');
    };

    websocket.onclose = () => {
      // Reconectar após 3 segundos
      setTimeout(() => {
        if (loading === false) {
          // Só reconecta se não estiver em loading
        }
      }, 3000);
    };

    setWs(websocket);

    // Carregar histórico de mensagens
    (async () => {
      try {
        const resp = await fetch(`/api/chat/${chatId}/messages`);
        const data = await resp.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (e) {
        console.error('Erro ao carregar histórico:', e);
      }
    })();

    return () => {
      websocket.close();
    };
  }, [chatId, loading]);

  function sendMessage() {
    const text = messageInput.trim();
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

    // Enviar via WebSocket
    ws.send(JSON.stringify({
      type: 'chat_message',
      callId: chatId,
      text: text
    }));

    setMessageInput("");
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

  function handleCall() {
    if (chatInfo?.linkedCallId) {
      window.location.href = `/ring/${chatInfo.linkedCallId}`;
    } else {
      alert('Ainda não há uma chamada disponível. Aguarde o atendente.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0612] flex items-center justify-center">
        <div className="text-white">Carregando chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0612] flex flex-col">
      {/* Header */}
      <div className="bg-neutral-900/80 border-b border-neutral-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-white" />
            <h1 className="text-xl font-bold text-white">
              {chatInfo?.callerName || 'Chat'}
            </h1>
          </div>
          {chatInfo?.linkedCallId && (
            <button
              onClick={handleCall}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Ligar Agora
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-white/50 py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm mt-2">Inicie a conversa!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.fromUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.fromUser
                      ? 'bg-purple-600/30 border border-purple-500/50 text-white'
                      : 'bg-neutral-800 border border-neutral-700 text-white'
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
      </div>

      {/* Input Area */}
      <div className="bg-neutral-900/80 border-t border-neutral-800 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
            placeholder="Diga algo..."
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-red-500"
          />
          <button
            onClick={sendMessage}
            disabled={!messageInput.trim() || !ws || ws.readyState !== WebSocket.OPEN}
            className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

