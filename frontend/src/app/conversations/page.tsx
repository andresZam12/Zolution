"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Bot,
  User,
  Clock,
  CheckCircle2,
  Phone,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import {
  getTenantContext,
  getTenantConversations,
  getAppLanguage,
  formatToolLabel,
  ConversationSummary,
  TenantContext,
  AppLanguage,
} from "@/lib/tenant";

export default function ConversationsPage() {
  const [lang, setLang] = useState<AppLanguage>("es");
  const [tenant, setTenant] = useState<TenantContext>({
    id: "dra-garcia-dental",
    slug: "dra-garcia-dental",
    name: "Mi Negocio",
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
    const currentLang = getAppLanguage();
    setTenant(ctx);
    setLang(currentLang);

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
          time: new Date(item.updated_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: item.status,
          messages: [],
        }));
        setConversations(mapped);
        setIsLiveApi(true);

        try {
          const firstDetail = await apiFetch<{
            messages: Array<{
              id: string;
              role: "user" | "assistant";
              content: string;
              created_at: string;
            }>;
          }>(`/conversations/${mapped[0].id}`);
          if (firstDetail && firstDetail.messages) {
            mapped[0].messages = firstDetail.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              time: new Date(m.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }));
          }
        } catch {
          // Keep empty if detail fails
        }
        setSelectedConv({ ...mapped[0] });
      } else {
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
            time: new Date(m.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
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
          <h2 className="text-2xl font-bold tracking-tight">
            {lang === "en" ? `Conversations · ${tenant.name}` : `Conversaciones · ${tenant.name}`}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {lang === "en"
              ? `Review the chats answered automatically by your assistant on WhatsApp for ${tenant.name}.`
              : `Revisa los chats atendidos por tu asistente en WhatsApp para ${tenant.name}.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={loadConversations}
            disabled={isLoading}
            className="text-xs h-8 cursor-pointer"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {lang === "en" ? "Refresh" : "Actualizar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        {/* Left Column: Conversation list */}
        <div className="lg:col-span-5 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder={
                  lang === "en" ? "Search customer or phone..." : "Buscar cliente o teléfono..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>
                {filteredConversations.length}{" "}
                {lang === "en" ? "conversations" : "conversaciones"}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {lang === "en" ? "WhatsApp Connected" : "WhatsApp Conectado"}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-zinc-300" />
                <p className="text-xs">
                  {lang === "en"
                    ? `No conversations found for ${tenant.name}.`
                    : `No hay conversaciones registradas para ${tenant.name}.`}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-l-4 border-indigo-600"
                        : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
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
        <div className="lg:col-span-7 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 shadow-2xs overflow-hidden">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/40 dark:bg-zinc-800/30">
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
                  <Badge
                    variant="outline"
                    className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                  >
                    {lang === "en" ? "Answered by Agent" : "Atendido por tu Agente"}
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
                        {msg.role === "user" ? (
                          <User className="h-3.5 w-3.5" />
                        ) : (
                          <Bot className="h-3.5 w-3.5" />
                        )}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[80%] leading-relaxed shadow-2xs ${
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

                    {/* Natural Language Action Indicator */}
                    {msg.toolCall && (
                      <div className="ml-10 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/50 w-fit">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span>{formatToolLabel(msg.toolCall, lang)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Footer Note */}
              <div className="p-3 border-t border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 text-center text-xs text-zinc-500">
                {lang === "en" ? (
                  <>
                    Messages synced automatically for <strong>{tenant.name}</strong>.
                  </>
                ) : (
                  <>
                    Mensajes sincronizados automáticamente para <strong>{tenant.name}</strong>.
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 space-y-3">
              <MessageSquare className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm font-medium">
                {lang === "en"
                  ? "Select a conversation to view details."
                  : "Selecciona una conversación para ver los detalles."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
