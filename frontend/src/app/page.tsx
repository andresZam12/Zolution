"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Cable,
  Calendar,
  Clock,
  MessagesSquare,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/brand-icons";
import { ZabioMark, ZabioPageWatermark } from "@/components/zabio-logo";
import {
  AnimatedValue,
  EmptyState,
  Modal,
  PageHeader,
  PersonAvatar,
  Rise,
  SectionCard,
  StatusPill,
  TypingDots,
  useAutoScroll,
} from "@/components/zabio-ui";
import { apiFetch } from "@/lib/api";
import { formatTime12h } from "@/lib/time";
import {
  getTenantContext,
  getAppLanguage,
  formatToolLabel,
  TenantContext,
  AppLanguage,
} from "@/lib/tenant";

interface OverviewMetrics {
  new_conversations_7d: number;
  measured_replies: number;
  resolution_rate: number | null;
  avg_response_seconds: number | null;
}

interface RecentConversation {
  id: string;
  customer: string;
  lastMessage: string;
  time: string;
}

interface QuickSimMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  actionLabel?: string;
}

export default function OverviewPage() {
  const [lang, setLang] = useState<AppLanguage>("es");
  const [tenant, setTenant] = useState<TenantContext>({
    id: "dra-garcia-dental",
    slug: "dra-garcia-dental",
    name: "Mi Negocio",
    industry: "Servicios",
    email: "admin@zolution.ai",
  });
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [convCount, setConvCount] = useState<number | null>(null);
  const [aptCount, setAptCount] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [overviewLoaded, setOverviewLoaded] = useState(false);

  // Quick Agent Simulator Modal state
  const [simOpen, setSimOpen] = useState(false);
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simMessages, setSimMessages] = useState<QuickSimMessage[]>([]);
  const simScrollRef = useAutoScroll(simMessages.length + (simLoading ? 1 : 0));

  useEffect(() => {
    const refreshTenant = () => {
      const ctx = getTenantContext();
      const currentLang = getAppLanguage();
      setTenant(ctx);
      setLang(currentLang);
      setSimMessages([]);
    };

    refreshTenant();

    Promise.all([
      apiFetch<{
        total?: number;
        items?: Array<{
          id: string;
          customer_name: string | null;
          customer_phone: string;
          updated_at: string;
          last_message: { content: string; created_at: string } | null;
        }>;
      }>("/conversations").catch(() => null),
      apiFetch<{ total?: number }>("/appointments").catch(() => null),
      apiFetch<Array<{ provider: string; is_connected: boolean }>>("/integrations/status").catch(
        () => null
      ),
      apiFetch<OverviewMetrics>("/analytics/overview").catch(() => null),
    ]).then(([convRes, aptRes, intRes, metricsRes]) => {
      setMetrics(metricsRes);
      setOverviewLoaded(true);
      if (convRes && typeof convRes.total === "number") {
        setConvCount(convRes.total);
        setRecentConversations(
          (convRes.items || []).slice(0, 5).map((item) => ({
            id: item.id,
            customer: item.customer_name || item.customer_phone,
            lastMessage: item.last_message?.content || "",
            time: formatTime12h(item.last_message?.created_at || item.updated_at),
          }))
        );
      }
      if (aptRes && typeof aptRes.total === "number") {
        setAptCount(aptRes.total);
      }
      if (Array.isArray(intRes)) {
        const g = intRes.find((i) => i.provider === "google");
        setGoogleConnected(g ? g.is_connected : false);
      }
    });

    window.addEventListener("storage", refreshTenant);
    return () => window.removeEventListener("storage", refreshTenant);
  }, []);

  const handleQuickSimSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim() || simLoading) return;

    const userText = simInput.trim();
    setSimMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text: userText },
    ]);
    setSimInput("");
    setSimLoading(true);

    try {
      const res = await apiFetch<{ reply: string; tool_called?: string | null }>(
        "/conversations/simulate",
        {
          method: "POST",
          body: JSON.stringify({
            message: userText,
            customer_name: lang === "en" ? "Quick Test" : "Prueba Rápida",
            customer_phone: "+57 300 000 0001",
            llm_provider_override: "google",
            llm_model_override: "gemini-3.8-flash",
          }),
        }
      );
      setConvCount((prev) => (prev !== null ? prev + 1 : null));
      setSimMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: res.reply,
          actionLabel: res.tool_called ? formatToolLabel(res.tool_called, lang) : undefined,
        },
      ]);
    } catch {
      setSimMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text:
            lang === "en"
              ? "I couldn't reach your agent right now. Please try again."
              : "No pude conectar con tu agente en este momento. Intenta de nuevo.",
        },
      ]);
    } finally {
      setSimLoading(false);
    }
  };

  const measuredLabel = metrics?.measured_replies
    ? lang === "en"
      ? `Out of ${metrics.measured_replies} replies, last 30 days`
      : `De ${metrics.measured_replies} respuestas, últimos 30 días`
    : lang === "en"
      ? "Measured from your next messages"
      : "Se mide desde tus próximos mensajes";

  const stats = [
    {
      title: lang === "en" ? "Conversations" : "Conversaciones",
      value: convCount !== null ? String(convCount) : "—",
      change: metrics
        ? lang === "en"
          ? `${metrics.new_conversations_7d} new this week`
          : `${metrics.new_conversations_7d} nuevas esta semana`
        : lang === "en"
          ? "Customers who wrote to you"
          : "Clientes que te han escrito",
      icon: MessageSquare,
      tone: "z-tone-orange",
    },
    {
      title: lang === "en" ? "Appointments" : "Citas",
      value: aptCount !== null ? String(aptCount) : "—",
      change: lang === "en" ? "Registered in your agenda" : "Registradas en tu agenda",
      icon: Calendar,
      tone: "z-tone-green",
    },
    {
      title: lang === "en" ? "Resolution rate" : "Tasa de resolución",
      value: metrics?.resolution_rate != null ? `${metrics.resolution_rate}%` : "—",
      change: measuredLabel,
      icon: Sparkles,
      tone: "z-tone-purple",
    },
    {
      title: lang === "en" ? "Response time" : "Tiempo de respuesta",
      value: metrics?.avg_response_seconds != null ? `${metrics.avg_response_seconds} s` : "—",
      change: lang === "en" ? "Average, last 30 days" : "Promedio, últimos 30 días",
      icon: Clock,
      tone: "z-tone-coffee",
    },
  ];

  return (
    <div className="space-y-6">
      <ZabioPageWatermark />

      {/* Bienvenida: la banda café de la landing */}
      <PageHeader
        kicker={tenant.industry}
        title={
          <>
            {lang === "en" ? "Hello, " : "Hola, "}
            <em>{tenant.name}.</em>
          </>
        }
        description={
          lang === "en"
            ? "Your agent answers on WhatsApp and organizes your appointments in Google Calendar."
            : "Tu agente atiende por WhatsApp y organiza tus citas en Google Calendar."
        }
        actions={
          <>
            <Button size="lg" onClick={() => setSimOpen(true)}>
              {lang === "en" ? "Test my agent" : "Probar mi agente"}
              <ArrowUpRight />
            </Button>
            <Link
              href="/agent"
              className="text-sm font-bold text-on-coffee underline-offset-4 hover:underline"
            >
              {lang === "en" ? "Customize" : "Personalizar"}
            </Link>
          </>
        }
      />

      {/* Métricas medidas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Rise key={stat.title} delay={80 + index * 70}>
              <article className="z-card z-card-hover h-full p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 text-muted-foreground">
                  <span className="text-xs font-semibold">{stat.title}</span>
                  <span className={`z-icon-solid ${stat.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="z-title mt-4 text-4xl sm:text-5xl">
                  <AnimatedValue value={stat.value} />
                </p>
                <p className="mt-2 text-xs leading-snug text-muted-foreground">{stat.change}</p>
              </article>
            </Rise>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Actividad reciente */}
        <Rise delay={320} className="lg:col-span-2">
          <SectionCard
            tone="orange"
            icon={MessagesSquare}
            kicker={lang === "en" ? "Recent" : "Reciente"}
            title={lang === "en" ? "Latest conversations" : "Últimas conversaciones"}
            bodyClassName="py-3 sm:py-3"
            action={
              <Link
                href="/conversations"
                className="inline-flex shrink-0 items-center gap-1 text-[0.8rem] font-bold text-white underline-offset-4 hover:underline"
              >
                {lang === "en" ? "View all" : "Ver todas"}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          >

            {!overviewLoaded ? (
              <div className="mt-5 space-y-3" aria-hidden="true">
                <div className="z-shimmer h-12" />
                <div className="z-shimmer h-12" />
                <div className="z-shimmer h-12" />
              </div>
            ) : recentConversations.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={lang === "en" ? "No conversations yet" : "Aún no hay conversaciones"}
                description={
                  lang === "en"
                    ? "Your customers' conversations will appear here."
                    : "Aquí aparecerán las conversaciones de tus clientes."
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentConversations.map((conversation) => (
                  <li key={conversation.id}>
                    <Link
                      href="/conversations"
                      className="group flex items-center gap-3 py-3.5 transition-transform hover:translate-x-1"
                    >
                      <PersonAvatar name={conversation.customer} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">
                          {conversation.customer}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {conversation.lastMessage}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[0.68rem] text-muted-foreground">
                        {conversation.time}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </Rise>

        {/* Conexiones */}
        <Rise delay={400}>
          <SectionCard
            tone="green"
            icon={Cable}
            kicker={lang === "en" ? "Connections" : "Conexiones"}
            title={lang === "en" ? "Your channels" : "Tus canales"}
            bodyClassName="flex flex-col py-3 sm:py-3"
          >
            <div className="flex-1 divide-y divide-border">
              <div className="flex items-center gap-3 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-whatsapp text-white">
                  <WhatsAppIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">WhatsApp</span>
                  <span className="block text-xs text-muted-foreground">
                    {lang === "en" ? "We connect it with you" : "Te acompañamos a conectarlo"}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-text">
                  <Calendar className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">Google Calendar</span>
                  <span className="block text-xs text-muted-foreground">
                    {lang === "en" ? "Your schedule" : "Tu agenda"}
                  </span>
                </span>
                {googleConnected !== null && (
                  <StatusPill tone={googleConnected ? "success" : "warning"}>
                    {googleConnected
                      ? lang === "en"
                        ? "Connected"
                        : "Conectado"
                      : lang === "en"
                        ? "Pending"
                        : "Pendiente"}
                  </StatusPill>
                )}
              </div>
            </div>

            <Link
              href="/integrations"
              className="my-2 inline-flex items-center gap-1 text-[0.8rem] font-bold text-brand-text underline-offset-4 hover:underline"
            >
              {lang === "en" ? "Manage connections" : "Administrar conexiones"}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </SectionCard>
        </Rise>
      </div>

      {/* Simulador rápido */}
      {simOpen && (
        <Modal
          onClose={() => setSimOpen(false)}
          labelledBy="sim-title"
          className="flex h-[min(560px,calc(100vh-2rem))] flex-col overflow-hidden rounded-3xl"
        >
          <div className="flex items-center gap-3 bg-coffee px-4 py-3 text-on-coffee">
            <ZabioMark size={28} tone="white" />
            <div className="min-w-0 flex-1">
              <h2 id="sim-title" className="truncate text-sm font-bold">
                {lang === "en" ? "Test my agent" : "Probar mi agente"}
              </h2>
              <p className="truncate font-mono text-[0.65rem] text-on-coffee-soft">{tenant.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setSimOpen(false)}
              aria-label={lang === "en" ? "Close" : "Cerrar"}
              className="cursor-pointer rounded-lg p-1.5 text-on-coffee-soft transition-colors hover:text-on-coffee"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={simScrollRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-muted p-4">
            {simMessages.length === 0 && !simLoading && (
              <EmptyState
                className="my-auto"
                icon={Sparkles}
                title={lang === "en" ? "Say hello" : "Salúdalo"}
                description={
                  lang === "en"
                    ? "Write as if you were a customer. Nothing is sent to anyone."
                    : "Escribe como si fueras un cliente. Esto no le llega a nadie."
                }
              />
            )}
            {simMessages.map((msg) => (
              <div key={msg.id}>
                {msg.actionLabel && (
                  <StatusPill tone="success" className="mb-1.5">
                    {msg.actionLabel}
                  </StatusPill>
                )}
                <div
                  className={`z-bubble ${msg.role === "user" ? "z-bubble-customer" : "z-bubble-agent"}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {simLoading && (
              <div className="z-bubble z-bubble-agent">
                <TypingDots label={lang === "en" ? "Agent is typing" : "El agente está escribiendo"} />
              </div>
            )}
          </div>

          <form onSubmit={handleQuickSimSend} className="flex gap-2 border-t border-border p-3">
            <Input
              autoFocus
              value={simInput}
              onChange={(e) => setSimInput(e.target.value)}
              aria-label={lang === "en" ? "Your message" : "Tu mensaje"}
              placeholder={lang === "en" ? "Write a message..." : "Escribe un mensaje..."}
              className="rounded-full"
            />
            <Button
              type="submit"
              size="icon"
              disabled={simLoading || !simInput.trim()}
              aria-label={lang === "en" ? "Send" : "Enviar"}
            >
              <Send />
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
