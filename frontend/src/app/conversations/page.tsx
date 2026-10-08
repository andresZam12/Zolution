"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Bot,
  User,
  Clock,
  Sparkles,
  Phone,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  time?: string;
  toolCall?: string;
}

interface ConversationItem {
  id: string;
  customerName: string;
  phone: string;
  lastMessage: string;
  time: string;
  status: string;
  messages: MessageItem[];
}

const fallbackConversations: ConversationItem[] = [
  {
    id: "conv-1",
    customerName: "María Gómez",
    phone: "+57 310 987 6543",
    lastMessage: "¡Perfecto, nos vemos el jueves a las 10:00 AM!",
    time: "10:42 AM",
    status: "active",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Hola, buenos días. ¿Tienen citas disponibles para consulta dental esta semana?",
        time: "10:38 AM",
      },
      {
        id: "m2",
        role: "assistant",
        content: "¡Hola María! Con mucho gusto te ayudo. Permíteme consultar la agenda disponible...",
        time: "10:39 AM",
        toolCall: "check_availability(date='2026-10-08')",
      },
      {
        id: "m3",
        role: "assistant",
        content: "Para este jueves tenemos espacio a las 10:00 AM o a las 3:30 PM. ¿Cuál de esos horarios se te acomoda mejor?",
        time: "10:39 AM",
      },
      {
        id: "m4",
        role: "user",
        content: "El de las 10:00 AM me queda perfecto.",
        time: "10:41 AM",
      },
      {
        id: "m5",
        role: "assistant",
        content: "¡Excelente! He confirmado tu cita para el jueves a las 10:00 AM. La cita ha sido agregada al calendario oficial.",
        time: "10:41 AM",
        toolCall: "book_appointment(start_time='2026-10-08T10:00:00')",
      },
      {
        id: "m6",
        role: "user",
        content: "¡Perfecto, nos vemos el jueves a las 10:00 AM!",
        time: "10:42 AM",
      },
    ],
  },
  {
    id: "conv-2",
    customerName: "Carlos Rodríguez",
    phone: "+57 312 456 7890",
    lastMessage: "¿Qué costo tiene la limpieza con ultrasonido?",
    time: "Ayer",
    status: "active",
    messages: [
      {
        id: "m7",
        role: "user",
        content: "Buenas tardes, ¿qué costo tiene la limpieza con ultrasonido?",
        time: "3:15 PM",
      },
      {
        id: "m8",
        role: "assistant",
        content: "¡Hola Carlos! La limpieza dental con ultrasonido tiene un costo de $120.000 COP e incluye valoración general. ¿Te gustaría agendar una cita para esta semana?",
        time: "3:16 PM",
      },
    ],
  },
  {
    id: "conv-3",
    customerName: "Laura Restrepo",
    phone: "+57 301 234 5678",
    lastMessage: "Gracias por la información, lo reviso con mi familia.",
    time: "Lunes",
    status: "active",
    messages: [
      {
        id: "m9",
        role: "user",
        content: "¿Hacen tratamientos de ortodoncia invisible?",
        time: "11:20 AM",
      },
      {
        id: "m10",
        role: "assistant",
        content: "¡Hola Laura! Sí, manejamos alineadores transparentes de última generación. Puedes solicitar una cita de valoración sin costo para escanear tu dentadura en 3D.",
        time: "11:21 AM",
      },
      {
        id: "m11",
        role: "user",
        content: "Gracias por la información, lo reviso con mi familia.",
        time: "11:25 AM",
      },
    ],
  },
];

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>(fallbackConversations);
  const [selectedConv, setSelectedConv] = useState<ConversationItem>(fallbackConversations[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{
        items: Array<{
          id: string;
          customer_name: string | null;
          customer_phone: string;
          status: string;
          updated_at: string;
          last_message: { content: string; created_at: string } | null;
        }>;
        total: number;
      }>("/conversations");

      if (data && data.items && data.items.length > 0) {
        const mapped: ConversationItem[] = data.items.map((item) => ({
          id: item.id,
          customerName: item.customer_name || "Paciente WhatsApp",
          phone: item.customer_phone,
          lastMessage: item.last_message?.content || "Sin mensajes",
          time: new Date(item.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: item.status,
          messages: [],
        }));
        setConversations(mapped);
        setSelectedConv(mapped[0]);
        setIsLiveApi(true);
      } else {
        setIsLiveApi(false);
      }
    } catch {
      // Fallback gracefully to demo conversations if API is offline
      setIsLiveApi(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleSelectConversation = async (conv: ConversationItem) => {
    setSelectedConv(conv);
    if (isLiveApi) {
      try {
        const detail = await apiFetch<{
          messages: Array<{
            id: string;
            role: "user" | "assistant";
            content: string;
            created_at: string;
          }>;
        }>(`/conversations/${conv.id}`);

        if (detail && detail.messages) {
          const formattedMessages: MessageItem[] = detail.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }));
          setSelectedConv((prev) => ({ ...prev, messages: formattedMessages }));
        }
      } catch {
        // Keep current messages
      }
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Historial de Conversaciones</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Supervisa los chats atendidos automáticamente por tu agente en WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`text-xs gap-1.5 py-1 ${
              isLiveApi
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {isLiveApi ? (
              <>
                <Wifi className="h-3 w-3 text-emerald-500" />
                Backend Live API
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-zinc-400" />
                Modo Demo Local
              </>
            )}
          </Badge>

          <Button
            size="sm"
            variant="outline"
            onClick={loadConversations}
            disabled={isLoading}
            className="text-xs h-8"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        {/* Left Column: Conversation list */}
        <div className="lg:col-span-5 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar paciente o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{filteredConversations.length} conversaciones</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                WhatsApp Live
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {filteredConversations.map((conv) => {
              const isSelected = selectedConv.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left p-4 transition-colors flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                    isSelected ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-l-4 border-indigo-600" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {conv.customerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
                        {conv.customerName}
                      </p>
                      <span className="text-[11px] text-zinc-400">{conv.time}</span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{conv.phone}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-1">
                      {conv.lastMessage}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Conversation Viewer */}
        <div className="lg:col-span-7 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                {selectedConv.customerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedConv.customerName}
                </h3>
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  {selectedConv.phone}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800">
                Resuelto por IA
              </Badge>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-zinc-50/30 dark:bg-zinc-950/20">
            {selectedConv.messages.map((msg) => (
              <div key={msg.id} className="space-y-1.5">
                <div
                  className={`flex items-start gap-2.5 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      msg.role === "user"
                        ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[80%] leading-relaxed shadow-xs ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                    <div
                      className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${
                        msg.role === "user" ? "text-indigo-200" : "text-zinc-400"
                      }`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {msg.time}
                    </div>
                  </div>
                </div>

                {/* Function calling indicator badge */}
                {msg.toolCall && (
                  <div className="ml-10 flex items-center gap-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/40 w-fit">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span>Tool ejecutada: {msg.toolCall}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Footer Note */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-center text-xs text-zinc-500">
            Los mensajes entrantes son procesados asíncronamente vía <code>BackgroundTasks</code> en FastAPI.
          </div>
        </div>
      </div>
    </div>
  );
}
