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
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { getTenantContext, getTenantConversations, ConversationSummary, TenantContext } from "@/lib/tenant";

export default function ConversationsPage() {
  const [tenant, setTenant] = useState<TenantContext>({
    id: "dra-garcia-dental",
    slug: "dra-garcia-dental",
    name: "Cargando empresa...",
    industry: "Servicios",
    email: "admin@zolution.ai",
  });
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);

  const loadConversations = async () => {
    setIsLoading(true);
    const ctx = getTenantContext();
    setTenant(ctx);

    const initialDemos = getTenantConversations(ctx.name, ctx.industry);

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
        const mapped: ConversationSummary[] = data.items.map((item) => ({
          id: item.id,
          customerName: item.customer_name || "Cliente WhatsApp",
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
        // Use tenant-specific dynamic demo conversation
        setConversations(initialDemos);
        setSelectedConv(initialDemos[0] || null);
        setIsLiveApi(false);
      }
    } catch {
      setConversations(initialDemos);
      setSelectedConv(initialDemos[0] || null);
      setIsLiveApi(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    window.addEventListener("storage", loadConversations);
    return () => window.removeEventListener("storage", loadConversations);
  }, []);

  const handleSelectConversation = async (conv: ConversationSummary) => {
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
          const formattedMessages = detail.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }));
          setSelectedConv((prev) => (prev ? { ...prev, messages: formattedMessages } : null));
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
          <h2 className="text-2xl font-bold tracking-tight">Historial de Conversaciones · {tenant.name}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Supervisa los chats atendidos automáticamente por tu agente de IA en WhatsApp para {tenant.name}.
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
                Modo Demo Local ({tenant.industry})
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
                placeholder="Buscar cliente o teléfono..."
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
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-zinc-300" />
                <p className="text-xs">No hay conversaciones registradas para {tenant.name}.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
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
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Viewer */}
        <div className="lg:col-span-7 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
          {selectedConv ? (
            <>
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
                Mensajes entrantes sincronizados automáticamente para <strong>{tenant.name}</strong>.
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 space-y-3">
              <MessageSquare className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm font-medium">Selecciona una conversación para ver los detalles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
