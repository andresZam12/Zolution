"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarSync,
  CheckCircle2,
  PenLine,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { WhatsAppIcon } from "@/components/brand-icons";
import { ZabioMark } from "@/components/zabio-logo";
import {
  EmptyState,
  Notice,
  PageHeader,
  Rise,
  SectionCard,
  StatusPill,
  TypingDots,
  useAutoScroll,
} from "@/components/zabio-ui";
import { apiFetch } from "@/lib/api";
import {
  getTenantContext,
  generateDefaultPrompt,
  getAppLanguage,
  formatToolLabel,
  TenantContext,
  AppLanguage,
} from "@/lib/tenant";

interface SimMessage {
  role: string;
  content: string;
  actionBadge?: string;
  actionType?: "success" | "warning";
  providerBadge?: string;
}

export default function AgentConfigPage() {
  const [lang, setLang] = useState<AppLanguage>("es");
  const [tenant, setTenant] = useState<TenantContext>({
    id: "dra-garcia-dental",
    slug: "dra-garcia-dental",
    name: "Mi Negocio",
    industry: "Servicios",
    email: "admin@zolution.ai",
  });
  const [provider, setProvider] = useState("google");
  const [model, setModel] = useState("gemini-3.8-flash");
  const [temperature, setTemperature] = useState(0.3);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [templateRestored, setTemplateRestored] = useState(false);

  const [prompt, setPrompt] = useState("");

  // Playground chat state
  const [chatMessages, setChatMessages] = useState<SimMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [llmNotice, setLlmNotice] = useState<string | null>(null);
  const simScrollRef = useAutoScroll(chatMessages.length + (isSimulating ? 1 : 0));

  const loadAgentConfig = async () => {
    const ctx = getTenantContext();
    const currentLang = getAppLanguage();
    setTenant(ctx);
    setLang(currentLang);

    const initialPrompt = ctx.prompt || generateDefaultPrompt(ctx.name, ctx.industry);
    setPrompt(initialPrompt);

    setChatMessages([]);

    try {
      const [data, orgData] = await Promise.all([
        apiFetch<{
          system_prompt_generated?: string | null;
          llm_provider?: string;
          llm_model?: string;
          status?: string;
          onboarding_answers?: Record<string, unknown> | null;
        }>("/agents/me"),
        apiFetch<{
          id?: string;
          name?: string;
          slug?: string;
        }>("/organizations/me").catch(() => null),
      ]);

      if (orgData?.name) {
        localStorage.setItem("zolution_org_name", orgData.name);
        setTenant((prev) => ({
          ...prev,
          id: orgData.id || prev.id,
          name: orgData.name || prev.name,
          slug: orgData.slug || prev.slug,
        }));
      }

      if (data) {
        if (data.system_prompt_generated) {
          setPrompt(data.system_prompt_generated);
          localStorage.setItem("zolution_agent_prompt", data.system_prompt_generated);
        }
        if (data.llm_provider) setProvider(data.llm_provider);
        if (data.llm_model) setModel(data.llm_model);
        if (data.status) setIsActive(data.status === "active");
        const dbIndustry = (data.onboarding_answers?.industry ||
          data.onboarding_answers?.business_type) as string | undefined;
        if (dbIndustry) {
          localStorage.setItem("zolution_org_industry", dbIndustry);
          setTenant((prev) => ({ ...prev, industry: dbIndustry }));
        }
      }
    } catch {
      // Uses local state fallback
    }
  };

  useEffect(() => {
    loadAgentConfig();
    window.addEventListener("storage", loadAgentConfig);
    return () => window.removeEventListener("storage", loadAgentConfig);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveFailed(false);
    localStorage.setItem("zolution_agent_prompt", prompt);

    try {
      await apiFetch("/agents/me", {
        method: "PATCH",
        body: JSON.stringify({
          system_prompt_generated: prompt,
          llm_provider: provider,
          llm_model: model,
          status: isActive ? "active" : "draft",
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSaveFailed(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    const freshPrompt = generateDefaultPrompt(tenant.name, tenant.industry);
    setPrompt(freshPrompt);
    localStorage.setItem("zolution_agent_prompt", freshPrompt);
    setTemplateRestored(true);
  };

  const [simulatorSessionId, setSimulatorSessionId] = useState<string>(() =>
    typeof window !== "undefined" ? "sim_" + Math.random().toString(36).substring(2, 9) : "sim_default"
  );

  const handleResetChat = async () => {
    const newSession = "sim_" + Math.random().toString(36).substring(2, 9);
    setSimulatorSessionId(newSession);
    setChatMessages([]);
    setLlmNotice(null);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSimulating) return;
    const userMsg = inputMessage;
    setInputMessage("");

    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsSimulating(true);

    try {
      const simRes = await apiFetch<{
        conversation_id: string;
        reply: string;
        tool_called?: string | null;
        appointment_created?: boolean;
        google_calendar_synced?: boolean;
        used_provider?: string | null;
        llm_errors?: string[];
      }>("/conversations/simulate", {
        method: "POST",
        body: JSON.stringify({
          message: userMsg,
          session_id: simulatorSessionId,
          customer_name:
            (typeof window !== "undefined" &&
              (localStorage.getItem("zolution_user_name") ||
                localStorage.getItem("zolution_user_email")?.split("@")[0])) ||
            "Andrés",
          customer_phone: `+57-sim-${simulatorSessionId}`,
          system_prompt_override: prompt,
          llm_provider_override: provider,
          llm_model_override: model,
        }),
      });

      let providerLabel: string | undefined;
      if (simRes.used_provider) {
        setLlmNotice(null);
        if (simRes.used_provider.includes("google")) {
          providerLabel = "Google Gemini";
        } else if (simRes.used_provider.includes("anthropic")) {
          providerLabel = "Claude (Anthropic)";
        } else if (simRes.used_provider.includes("openai")) {
          providerLabel = "OpenAI GPT";
        } else {
          providerLabel = simRes.used_provider;
        }
      }

      if (!simRes.used_provider && simRes.llm_errors && simRes.llm_errors.length > 0) {
        const cleanedErrors = simRes.llm_errors.map((err) => {
          if (err.includes("insufficient_quota") || err.includes("no credits")) {
            return "OpenAI sin créditos disponibles.";
          }
          if (err.includes("429") || err.includes("quota") || err.includes("ResourceExhausted") || err.includes("RateLimit")) {
            return "Google Gemini: Cuota temporal alcanzada (429). Espera 1 minuto o crea una nueva key en aistudio.google.com.";
          }
          if (err.includes("anthropic-workspace-id") || err.includes("not scoped to a workspace")) {
            return "Anthropic requiere configurar Workspace ID.";
          }
          if (err.includes("no longer available") || err.includes("not found")) {
            return "Google Gemini: modelo alternado automáticamente.";
          }
          if (err.includes("timed out") || err.includes("DeadlineExceeded")) {
            return "El proveedor tardó demasiado en responder.";
          }
          return err.slice(0, 120);
        });
        setLlmNotice(cleanedErrors[0] || null);
      }

      let actionLabel = simRes.tool_called ? formatToolLabel(simRes.tool_called, lang) : undefined;
      let actionType: "success" | "warning" = "success";
      if (simRes.tool_called?.includes("cancel_appointment")) {
        actionLabel = lang === "en" ? "Cancelled in Google Calendar" : "Cita cancelada en Google Calendar";
        actionType = "warning";
      } else if (simRes.tool_called?.includes("reschedule_appointment")) {
        actionLabel = lang === "en" ? "Rescheduled in Google Calendar" : "Cita actualizada en Google Calendar";
        actionType = "success";
      } else if (simRes.appointment_created) {
        if (simRes.google_calendar_synced) {
          actionLabel = lang === "en" ? "Booked in Google Calendar" : "Cita creada en Google Calendar";
          actionType = "success";
        } else {
          actionLabel = lang === "en" ? "Saved in Zabio (not in Calendar)" : "Guardada en Zabio (no llegó a Calendar)";
          actionType = "warning";
          const calErr = simRes.llm_errors?.find((e) => e.includes("Google Calendar"));
          if (calErr) {
            setLlmNotice(calErr);
          } else {
            setLlmNotice("Google Calendar no sincronizó. En la pantalla de Google debes marcar la casilla de verificación para dar acceso a tu calendario.");
          }
        }
      }
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: simRes.reply,
          actionBadge: actionLabel,
          actionType,
          providerBadge: providerLabel,
        },
      ]);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "";
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            lang === "en"
              ? `I couldn't reach your agent right now. ${detail ? `(${detail})` : ""} Please try again in a few seconds.`
              : `No pude conectar con tu agente en este momento. ${detail ? `(${detail})` : ""} Intenta de nuevo en unos segundos.`,
        },
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  const capabilities = [
    {
      icon: WhatsAppIcon,
      tone: "z-tone-orange",
      title: lang === "en" ? "Answers for you" : "Responde por ti",
      text:
        lang === "en"
          ? "Questions, services and prices, in your business tone, even when you are busy."
          : "Dudas, servicios y precios, con el tono de tu negocio, incluso cuando estás ocupado.",
    },
    {
      icon: CalendarCheck2,
      tone: "z-tone-green",
      title: lang === "en" ? "Books without clashes" : "Agenda sin choques",
      text:
        lang === "en"
          ? "Checks your calendar first. If it is not on your schedule, the agent does not confirm it."
          : "Revisa tu calendario primero. Si no quedó en tu agenda, el agente no lo confirma.",
    },
    {
      icon: CalendarSync,
      tone: "z-tone-purple",
      title: lang === "en" ? "Moves and cancels" : "Cambia y cancela",
      text:
        lang === "en"
          ? "Customers change their appointment on WhatsApp, without calls or waiting."
          : "Tus clientes mueven o cancelan su cita por WhatsApp, sin llamadas ni esperas.",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={lang === "en" ? "My agent" : "Mi agente"}
        title={
          <>
            {lang === "en" ? "Your agent, " : "Tu agente, "}
            <em>{tenant.name}.</em>
          </>
        }
        description={
          lang === "en"
            ? "Tell it how to treat your customers and try it before going live."
            : "Dile cómo atender a tus clientes y pruébalo antes de que hable con ellos."
        }
        actions={
          <>
            <label className="flex cursor-pointer items-center gap-2 text-[0.8rem] font-semibold text-on-coffee">
              {isActive
                ? lang === "en"
                  ? "Active"
                  : "Activo"
                : lang === "en"
                  ? "Paused"
                  : "En pausa"}
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </label>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="animate-spin" />
              ) : savedSuccess ? (
                <CheckCircle2 />
              ) : (
                <Save />
              )}
              {isSaving
                ? lang === "en"
                  ? "Saving..."
                  : "Guardando..."
                : savedSuccess
                  ? lang === "en"
                    ? "Saved"
                    : "Guardado"
                  : lang === "en"
                    ? "Save changes"
                    : "Guardar cambios"}
            </Button>
          </>
        }
      />

      {saveFailed && (
        <Notice tone="danger" onDismiss={() => setSaveFailed(false)}>
          {lang === "en"
            ? "Your changes could not be saved. Please try again."
            : "No se pudieron guardar los cambios. Intenta de nuevo."}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Rise delay={80}>
            <SectionCard
              tone="coffee"
              icon={PenLine}
              kicker={lang === "en" ? "Instructions" : "Instrucciones"}
              title={lang === "en" ? "How it should attend" : "Cómo debe atender"}
            >
              <p className="text-sm text-muted-foreground">
                {lang === "en"
                  ? "Write it in plain language. Include your hours and your tone."
                  : "Escríbelo en lenguaje sencillo. Incluye tus horarios y tu tono."}
              </p>

              <Textarea
                rows={14}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setTemplateRestored(false);
                }}
                aria-label={lang === "en" ? "Agent instructions" : "Instrucciones del agente"}
                className="mt-4 max-h-[28rem] min-h-72! resize-y leading-relaxed"
                placeholder={
                  lang === "en"
                    ? "Write instructions for your agent..."
                    : "Escribe las instrucciones para tu agente..."
                }
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <Button type="button" variant="ghost" size="xs" onClick={handleResetToDefault}>
                  <RotateCcw />
                  {lang === "en" ? "Restore suggested template" : "Restaurar plantilla sugerida"}
                </Button>
                {templateRestored && (
                  <span className="text-xs font-semibold text-brand-text">
                    {lang === "en" ? "Save to apply it." : "Guarda para aplicarla."}
                  </span>
                )}
              </div>
            </SectionCard>
          </Rise>

          <Rise delay={160}>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {capabilities.map(({ icon: Icon, tone, title, text }, index) => (
                <article key={title} className={`z-feature ${tone}`}>
                  <div className="flex items-center justify-between">
                    <span className="z-icon-chip h-12! w-12!">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="font-mono text-xs opacity-80">/ 0{index + 1}</span>
                  </div>
                  <h3 className="z-title mt-8 text-2xl">{title}</h3>
                  <p className="mt-2 text-[0.8rem] leading-relaxed text-white/85">{text}</p>
                </article>
              ))}
            </section>
          </Rise>
        </div>

        {/* Simulador: mismo teléfono de la landing */}
        <Rise delay={120} className="lg:col-span-5">
          <section className="z-card flex h-[640px] flex-col overflow-hidden rounded-3xl lg:sticky lg:top-6">
            <div className="flex items-center gap-3 bg-coffee px-4 py-3 text-on-coffee">
              <ZabioMark size={28} tone="white" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-bold">{tenant.name}</h2>
                <p className="font-mono text-[0.65rem] text-on-coffee-soft">
                  {lang === "en" ? "Test chat" : "Chat de prueba"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetChat}
                title={lang === "en" ? "Start a new chat" : "Empezar un chat nuevo"}
                aria-label={lang === "en" ? "Start a new chat" : "Empezar un chat nuevo"}
                className="cursor-pointer rounded-lg p-1.5 text-on-coffee-soft transition-colors hover:text-on-coffee"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            <div
              ref={simScrollRef}
              className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-muted p-4"
            >
              {chatMessages.length === 0 && !isSimulating && (
                <EmptyState
                  className="my-auto"
                  icon={Sparkles}
                  title={lang === "en" ? "Say hello" : "Salúdalo"}
                  description={
                    lang === "en"
                      ? "Write as if you were a customer. It uses the instructions on this page, even unsaved ones."
                      : "Escribe como si fueras un cliente. Usa las instrucciones de esta página, aunque no las hayas guardado."
                  }
                />
              )}
              {chatMessages.map((msg, index) => (
                <div key={index}>
                  {msg.actionBadge && (
                    <StatusPill
                      tone={msg.actionType === "warning" ? "warning" : "success"}
                      className="mb-1.5"
                    >
                      {msg.actionType === "warning" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {msg.actionBadge}
                    </StatusPill>
                  )}
                  <div
                    className={`z-bubble ${
                      msg.role === "user" ? "z-bubble-customer" : "z-bubble-agent"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.providerBadge && (
                    <p className="mt-1 font-mono text-[0.62rem] text-muted-foreground">
                      {msg.providerBadge}
                    </p>
                  )}
                </div>
              ))}
              {isSimulating && (
                <div className="z-bubble z-bubble-agent">
                  <TypingDots
                    label={
                      lang === "en"
                        ? "Checking your calendar and preparing a reply"
                        : "Revisando tu agenda y preparando la respuesta"
                    }
                  />
                </div>
              )}
            </div>

            {llmNotice && (
              <Notice
                tone="warning"
                onDismiss={() => setLlmNotice(null)}
                className="mx-3 mt-3 text-xs"
              >
                {llmNotice}
              </Notice>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 py-3 pr-20 pl-3"
            >
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                aria-label={lang === "en" ? "Your message" : "Tu mensaje"}
                placeholder={lang === "en" ? "Write a message..." : "Escribe un mensaje..."}
                className="rounded-full"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSimulating || !inputMessage.trim()}
                aria-label={lang === "en" ? "Send" : "Enviar"}
              >
                <Send />
              </Button>
            </form>
          </section>
        </Rise>
      </div>
    </div>
  );
}
