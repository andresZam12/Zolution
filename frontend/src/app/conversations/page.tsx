"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, MessageSquare, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  Notice,
  PageHeader,
  PersonAvatar,
  Rise,
  StatusPill,
  useAutoScroll,
} from "@/components/zabio-ui";
import { apiFetch } from "@/lib/api";
import { formatTime12h } from "@/lib/time";
import {
  getAppLanguage,
  formatToolLabel,
  ConversationSummary,
  AppLanguage,
} from "@/lib/tenant";
import { cn } from "@/lib/utils";

export default function ConversationsPage() {
  const [lang, setLang] = useState<AppLanguage>("es");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const chatScrollRef = useAutoScroll(
    `${selectedConv?.id}-${selectedConv?.messages.length}`
  );

  const loadConversations = async () => {
    setIsLoading(true);
    setLang(getAppLanguage());

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
          time: formatTime12h(item.updated_at),
          status: item.status,
          messages: [],
        }));
        setConversations(mapped);

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
              time: formatTime12h(m.created_at),
            }));
          }
        } catch {
          // Keep empty if detail fails
        }
        setSelectedConv({ ...mapped[0] });
      } else {
        setConversations([]);
        setSelectedConv(null);
      }
      setLoadFailed(false);
    } catch {
      setConversations([]);
      setSelectedConv(null);
      setLoadFailed(true);
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
    setChatOpen(true);
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
          time: formatTime12h(m.created_at),
        }));
        setSelectedConv((prev) => (prev ? { ...prev, messages: formattedMessages } : null));
      }
    } catch {
      // Keep current messages
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={lang === "en" ? "Conversations" : "Conversaciones"}
        title={
          lang === "en" ? (
            <>
              Every chat, <em>moving forward.</em>
            </>
          ) : (
            <>
              Cada chat, <em>sí avanza.</em>
            </>
          )
        }
        description={
          lang === "en"
            ? "Everything your agent has talked about with your customers."
            : "Todo lo que tu agente ha hablado con tus clientes."
        }
        actions={
          <Button size="sm" variant="outline" onClick={loadConversations} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} />
            {lang === "en" ? "Refresh" : "Actualizar"}
          </Button>
        }
      />

      {loadFailed && (
        <Notice tone="danger">
          {lang === "en"
            ? "Conversations could not be loaded. Please try again."
            : "No se pudieron cargar las conversaciones. Intenta de nuevo."}
        </Notice>
      )}

      <Rise
        delay={80}
        className="z-card grid h-[calc(100vh-15rem)] min-h-[520px] overflow-hidden lg:grid-cols-[minmax(280px,5fr)_7fr]"
      >
        {/* Lista */}
        <div
          className={cn(
            "min-h-0 flex-col border-border lg:flex lg:border-r",
            chatOpen ? "hidden" : "flex"
          )}
        >
          <div className="z-tone-coffee p-3">
            <div className="relative">
              <Search className="absolute top-3 left-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label={lang === "en" ? "Search" : "Buscar"}
                placeholder={lang === "en" ? "Search customer or phone" : "Buscar cliente o teléfono"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-full pl-10 text-foreground"
              />
            </div>
            <p className="mt-2.5 px-1 font-mono text-[0.68rem] text-on-coffee-soft">
              {filteredConversations.length} {lang === "en" ? "conversations" : "conversaciones"}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {isLoading && conversations.length === 0 ? (
              <div className="space-y-2 p-1" aria-hidden="true">
                <div className="z-shimmer h-16" />
                <div className="z-shimmer h-16" />
                <div className="z-shimmer h-16" />
              </div>
            ) : filteredConversations.length === 0 ? (
              !loadFailed && (
                <EmptyState
                  icon={MessageSquare}
                  title={
                    searchTerm
                      ? lang === "en"
                        ? "No results"
                        : "Sin resultados"
                      : lang === "en"
                        ? "No conversations yet"
                        : "Aún no hay conversaciones"
                  }
                  description={
                    searchTerm
                      ? undefined
                      : lang === "en"
                        ? "They will appear here when your customers write."
                        : "Aparecerán aquí cuando tus clientes escriban."
                  }
                />
              )
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-left transition-colors",
                      isSelected ? "bg-brand-soft ring-2 ring-brand" : "hover:bg-muted"
                    )}
                  >
                    <PersonAvatar name={conv.customerName} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-bold">{conv.customerName}</span>
                        <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground">
                          {conv.time}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {conv.lastMessage}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat */}
        <div className={cn("min-h-0 flex-col lg:flex", chatOpen ? "flex" : "hidden")}>
          {selectedConv ? (
            <>
              <div className="z-tone-green flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  aria-label={lang === "en" ? "Back to list" : "Volver a la lista"}
                  className="-ml-1 cursor-pointer rounded-lg p-1.5 text-white hover:bg-white/15 lg:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <PersonAvatar name={selectedConv.customerName} />
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold">{selectedConv.customerName}</h2>
                  <p className="truncate font-mono text-[0.68rem] text-white/80">
                    {selectedConv.phone}
                  </p>
                </div>
              </div>

              <div
                ref={chatScrollRef}
                className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-muted p-4 sm:p-5"
              >
                {selectedConv.messages.map((msg) => (
                  <div key={msg.id}>
                    <div
                      className={`z-bubble ${
                        msg.role === "user" ? "z-bubble-customer" : "z-bubble-agent"
                      }`}
                    >
                      {msg.content}
                      {msg.time && (
                        <span className="mt-1 block text-right font-mono text-[0.62rem] text-muted-foreground">
                          {msg.time}
                        </span>
                      )}
                    </div>
                    {msg.toolCall && (
                      <StatusPill tone="success" className="mt-1.5">
                        <CheckCircle2 className="h-3 w-3" />
                        {formatToolLabel(msg.toolCall, lang)}
                      </StatusPill>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            !isLoading && (
              <EmptyState
                className="my-auto"
                icon={MessageSquare}
                title={lang === "en" ? "Pick a conversation" : "Elige una conversación"}
                description={
                  lang === "en"
                    ? "You will see the full chat here."
                    : "Aquí verás el chat completo."
                }
              />
            )
          )}
        </div>
      </Rise>
    </div>
  );
}
