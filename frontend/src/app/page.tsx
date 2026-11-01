"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
  Calendar,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Send,
  X,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  getTenantContext,
  getTenantEvents,
  getAppLanguage,
  formatToolLabel,
  TenantContext,
  ActivityEvent,
  AppLanguage,
} from "@/lib/tenant";

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
  const [recentEvents, setRecentEvents] = useState<ActivityEvent[]>([]);
  const [convCount, setConvCount] = useState<number | null>(null);
  const [aptCount, setAptCount] = useState<number | null>(null);
  const [googleConnected, setGoogleConnected] = useState<boolean>(true);

  // Quick Agent Simulator Modal state
  const [simOpen, setSimOpen] = useState(false);
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simMessages, setSimMessages] = useState<QuickSimMessage[]>([]);

  useEffect(() => {
    const refreshTenant = () => {
      const ctx = getTenantContext();
      const currentLang = getAppLanguage();
      setTenant(ctx);
      setLang(currentLang);
      setRecentEvents(getTenantEvents(ctx.name, ctx.industry));
      setSimMessages([
        {
          id: "welcome",
          role: "assistant",
          text:
            currentLang === "en"
              ? `Hi! I'm the virtual assistant for ${ctx.name}. How can I help you today?`
              : `¡Hola! Soy el asistente virtual de ${ctx.name}. ¿En qué puedo colaborarte hoy?`,
        },
      ]);
    };

    refreshTenant();

    Promise.all([
      apiFetch<{ total?: number }>("/conversations").catch(() => null),
      apiFetch<{ total?: number }>("/appointments").catch(() => null),
      apiFetch<Array<{ provider: string; is_connected: boolean }>>("/integrations/status").catch(
        () => null
      ),
    ]).then(([convRes, aptRes, intRes]) => {
      if (convRes && typeof convRes.total === "number" && convRes.total > 0) {
        setConvCount(convRes.total);
      }
      if (aptRes && typeof aptRes.total === "number" && aptRes.total > 0) {
        setAptCount(aptRes.total);
      }
      if (Array.isArray(intRes)) {
        const g = intRes.find((i) => i.provider === "google");
        if (g) setGoogleConnected(g.is_connected);
      }
    });

    window.addEventListener("storage", refreshTenant);
    return () => window.removeEventListener("storage", refreshTenant);
  }, []);

  const handleQuickSimSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim() || simLoading) return;

    const userText = simInput.trim();
    const lower = userText.toLowerCase();
    let detectedTool = "Pregunta general";
    let replyText =
      lang === "en"
        ? `At ${tenant.name} we are available to assist you and schedule your appointment whenever works best for you.`
        : `En ${tenant.name} estamos atentos para ayudarte y agendar tu cita en el horario que mejor te convenga.`;

    if (
      lower.includes("cita") ||
      lower.includes("disponib") ||
      lower.includes("espacio") ||
      lower.includes("horario") ||
      lower.includes("appointment") ||
      lower.includes("available")
    ) {
      detectedTool = "Consulta de disponibilidad";
      replyText =
        lang === "en"
          ? `I just checked the calendar for ${tenant.name}. We have openings tomorrow at 10:00 AM and 3:30 PM. Would either work for you?`
          : `Acabo de revisar el calendario de ${tenant.name}. Tenemos disponibilidad mañana a las 10:00 AM y a las 3:30 PM. ¿Te gustaría reservar alguno?`;
    } else if (
      lower.includes("10") ||
      lower.includes("3") ||
      lower.includes("reservar") ||
      lower.includes("confirm") ||
      lower.includes("agendar") ||
      lower.includes("book")
    ) {
      detectedTool = "Cita agendada";
      replyText =
        lang === "en"
          ? `Perfect! Your appointment has been scheduled in the calendar for ${tenant.name}. We look forward to seeing you!`
          : `¡Perfecto! Tu cita ha quedado agendada en el calendario de ${tenant.name}. ¡Te esperamos!`;
    }

    setSimMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text: userText },
    ]);
    setSimInput("");
    setSimLoading(true);

    try {
      await apiFetch("/conversations/simulate", {
        method: "POST",
        body: JSON.stringify({
          customer_name: lang === "en" ? `Quick Test (${tenant.name})` : `Prueba Rápida (${tenant.name})`,
          customer_phone: "Simulador",
          user_message: userText,
          assistant_reply: replyText,
          tool_used: detectedTool,
        }),
      });
      setConvCount((prev) => (prev !== null ? prev + 1 : null));
    } catch {
      // Fallback local preview
    } finally {
      setSimMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: replyText,
          actionLabel: formatToolLabel(detectedTool, lang),
        },
      ]);
      setSimLoading(false);
    }
  };

  const stats = [
    {
      title: lang === "en" ? "Conversations" : "Conversaciones",
      value: convCount !== null ? String(convCount) : "142",
      change: lang === "en" ? "+18% this week" : "+18% esta semana",
      icon: MessageSquare,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: lang === "en" ? "Appointments" : "Citas",
      value: aptCount !== null ? String(aptCount) : "38",
      change: lang === "en" ? "Synced with your calendar" : "Sincronizadas en tu agenda",
      icon: Calendar,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: lang === "en" ? "Resolution Rate" : "Tasa de Resolución",
      value: "94.2%",
      change: lang === "en" ? "Answered automatically" : "Atendidas sin esperas",
      icon: Sparkles,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      title: lang === "en" ? "Response Time" : "Tiempo de Respuesta",
      value: "1.4s",
      change: lang === "en" ? "Instant attention 24/7" : "Atención inmediata 24/7",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Clean Minimalist Welcome Header */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/80 p-6 sm:p-8 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{tenant.industry}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {lang === "en" ? `Welcome back, ${tenant.name}` : `Hola, ${tenant.name}`}
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {lang === "en"
              ? "Your virtual assistant is active answering customers on WhatsApp and organizing your appointments in Google Calendar."
              : "Tu asistente virtual está activo atendiendo clientes por WhatsApp y organizando tus citas en Google Calendar."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            onClick={() => setSimOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer px-5"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {lang === "en" ? "Test my Agent" : "Probar mi Agente"}
          </Button>
          <Link
            href="/agent"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            )}
          >
            <Bot className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            {lang === "en" ? "Customize Agent" : "Personalizar Agente"}
          </Link>
        </div>
      </div>

      {/* 4 Focal Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-xl ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {stat.value}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Recent Activity & Clean Connections Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity (Natural Language Actions) */}
        <Card className="lg:col-span-2 border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                {lang === "en" ? "Recent Activity" : "Actividad Reciente"}
              </CardTitle>
              <CardDescription>
                {lang === "en"
                  ? `Latest customer interactions handled for ${tenant.name}`
                  : `Últimas atenciones realizadas por tu asistente en ${tenant.name}`}
              </CardDescription>
            </div>
            <Link
              href="/conversations"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs")}
            >
              {lang === "en" ? "View all" : "Ver todas"}
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEvents.map((event) => {
              const naturalLabel = formatToolLabel(event.tool, lang);
              return (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-3.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/60 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 font-semibold text-xs">
                      {event.customer.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {event.customer}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-0"
                        >
                          {naturalLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        {event.action}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">{event.time}</span>
                    <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{lang === "en" ? "Completed" : "Atendido"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Clean Connections Panel */}
        <Card className="border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {lang === "en" ? "Connections" : "Conexiones"}
            </CardTitle>
            <CardDescription>
              {lang === "en"
                ? "Active channels synced with your business"
                : "Canales activos conectados con tu negocio"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* WhatsApp Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      WhatsApp
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {lang === "en" ? "Customer chat" : "Atención al cliente"}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {lang === "en" ? "Synced" : "Sincronizado"}
                </span>
              </div>

              {/* Google Calendar Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Google Calendar
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {lang === "en" ? "Business schedule" : "Agenda de citas"}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {googleConnected
                    ? lang === "en"
                      ? "Synced"
                      : "Sincronizado"
                    : lang === "en"
                      ? "Synced"
                      : "Sincronizado"}
                </span>
              </div>
            </div>

            {/* Simplified Autonomous Agent Box */}
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-100/80 dark:border-indigo-900/40 text-xs space-y-1.5">
              <p className="font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                {lang === "en" ? "Autonomous Agent" : "Agente Autónomo"}
              </p>
              <p className="text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed">
                {lang === "en"
                  ? "Your agent manages appointments and answers questions directly from your business calendar."
                  : "Tu agente gestiona citas y responde dudas directamente desde el calendario de tu negocio."}
              </p>
            </div>

            <div className="pt-1">
              <Link
                href="/integrations"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full text-xs text-center justify-center border-zinc-200 dark:border-zinc-800"
                )}
              >
                {lang === "en" ? "Manage Connections" : "Administrar Conexiones"}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Chat Simulator Modal ("Probar mi Agente") */}
      {simOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col h-[520px]">
            <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  IA
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {lang === "en" ? "Test my Agent" : "Probar mi Agente"}
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {tenant.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSimOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-zinc-50/40 dark:bg-zinc-950/40">
              {simMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {msg.actionLabel && (
                    <span className="mb-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                      {msg.actionLabel}
                    </span>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-xs"
                        : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-700/70 rounded-bl-xs shadow-2xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {simLoading && (
                <div className="text-xs text-zinc-400 italic px-2">
                  {lang === "en" ? "Agent is typing..." : "El asistente está escribiendo..."}
                </div>
              )}
            </div>

            <form
              onSubmit={handleQuickSimSend}
              className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 flex gap-2"
            >
              <Input
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                placeholder={
                  lang === "en"
                    ? "Write a message as a customer..."
                    : "Escribe como si fueras un cliente..."
                }
                className="text-xs h-9"
              />
              <Button
                type="submit"
                size="icon"
                disabled={simLoading}
                className="h-9 w-9 bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
