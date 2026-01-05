"use client";

import * as React from "react";
import { MessageSquare, Send, Phone, Image, Video, Mic, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Message = {
  id: string;
  text: string;
  fromUser: boolean;
  timestamp: string;
  mediaType?: 'image' | 'video' | 'audio';
  mediaUrl?: string;
  audioDuration?: number;
};

export default function ChatOnlyPage({ params }: { params: { chatId: string } }) {
  const chatId = params.chatId;
  const [chatInfo, setChatInfo] = React.useState<{ callerName: string | null; linkedCallId: string | null; active: boolean } | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [messageInput, setMessageInput] = React.useState("");
  const [ws, setWs] = React.useState<WebSocket | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);

  // Verificar se é admin
  React.useEffect(() => {
    (async () => {
      try {
        const resp = await apiFetch("/api/auth/me");
        if (resp.ok) {
          setIsAdmin(true);
        }
      } catch (e) {
        setIsAdmin(false);
      }
    })();
  }, []);

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
          setMessages(data.messages || []);
        } else if (data.type === 'new_message' && data.message) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === data.message.id);
            if (exists) return prev;
            const filtered = prev.filter(m => !(m.id.startsWith('temp-') && m.text === data.message.text && m.fromUser === data.message.fromUser));
            return [...filtered, data.message];
          });
        }
      } catch (e) {
        console.error('Erro ao processar mensagem WebSocket:', e);
      }
    };

    websocket.onerror = () => {
      console.error('Erro na conexão WebSocket do chat');
    };

    websocket.onclose = () => {
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

  async function sendMessage() {
    const text = messageInput.trim();
    const fileToSend = selectedFile;
    
    if (!text && !fileToSend) return;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    let mediaType: 'image' | 'video' | 'audio' | undefined = undefined;
    let mediaUrl: string | undefined = undefined;

    // Upload de arquivo se houver (apenas admin para áudio)
    if (fileToSend) {
      const fileType = fileToSend.type;
      if (fileType.startsWith('audio/') && !isAdmin) {
        alert('Apenas administradores podem enviar áudio');
        setSelectedFile(null);
        return;
      }

      try {
        const formData = new FormData();
        formData.append('media', fileToSend);
        
        const uploadResp = await apiFetch('/api/chat-media/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResp.ok) {
          throw new Error('Erro ao fazer upload');
        }
        
        const uploadData = await uploadResp.json();
        mediaUrl = uploadData.mediaUrl;
        mediaType = uploadData.mediaType as 'image' | 'video' | 'audio';
      } catch (e) {
        console.error('Erro ao fazer upload:', e);
        alert('Erro ao enviar arquivo');
        setSelectedFile(null);
        return;
      }
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      text: text || '',
      fromUser: !isAdmin, // Cliente envia se não for admin
      timestamp: new Date().toISOString(),
      mediaType,
      mediaUrl
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput("");
    setSelectedFile(null);

    // Enviar via WebSocket (client) ou API (admin)
    if (isAdmin && mediaType) {
      // Admin com mídia envia via API
      try {
        const resp = await apiFetch(`/api/conversation/${chatId}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, mediaType, mediaUrl })
        });
        const data = await resp.json();
        if (data.message) {
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== tempId);
            const exists = filtered.some(m => m.id === data.message.id);
            if (exists) return filtered;
            return [...filtered, data.message];
          });
        }
      } catch (e) {
        console.error('Erro ao enviar mensagem:', e);
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    } else {
      // Cliente envia via WebSocket
      ws.send(JSON.stringify({
        type: 'chat_message',
        callId: chatId,
        text: text || ''
      }));
    }
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.type;
      if (fileType.startsWith('audio/') && !isAdmin) {
        alert('Apenas administradores podem enviar áudio');
        return;
      }
      setSelectedFile(file);
    }
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
                  {msg.mediaType === 'image' && msg.mediaUrl && (
                    <img 
                      src={msg.mediaUrl} 
                      alt="Imagem" 
                      className="max-w-full h-auto rounded mb-2"
                      style={{ maxHeight: '400px' }}
                    />
                  )}
                  {msg.mediaType === 'video' && msg.mediaUrl && (
                    <video 
                      src={msg.mediaUrl} 
                      controls 
                      className="max-w-full h-auto rounded mb-2"
                      style={{ maxHeight: '400px' }}
                    />
                  )}
                  {msg.mediaType === 'audio' && msg.mediaUrl && (
                    <audio 
                      src={msg.mediaUrl} 
                      controls 
                      className="max-w-full mb-2"
                    />
                  )}
                  {msg.text && <p className="text-sm">{msg.text}</p>}
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
        <div className="max-w-4xl mx-auto">
          {selectedFile && (
            <div className="mb-2 flex items-center gap-2 p-2 bg-neutral-800 rounded-lg">
              <span className="text-sm text-white flex-1 truncate">{selectedFile.name}</span>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 hover:bg-neutral-700 rounded"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isAdmin && (
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Enviar imagem ou vídeo"
            >
              <Image className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={() => audioInputRef.current?.click()}
                className="px-3 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center gap-2"
                title="Enviar áudio (apenas admin)"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
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
              disabled={(!messageInput.trim() && !selectedFile) || !ws || ws.readyState !== WebSocket.OPEN}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
