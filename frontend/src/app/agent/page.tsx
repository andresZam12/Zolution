"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Sparkles,
  Save,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Send,
  User,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.3);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [prompt, setPrompt] = useState("");

  // Playground chat state
  const [chatMessages, setChatMessages] = useState<SimMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

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
    } catch {
      // Fallback local
    } finally {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleResetToDefault = () => {
    const freshPrompt = generateDefaultPrompt(tenant.name, tenant.industry);
    setPrompt(freshPrompt);
    localStorage.setItem("zolution_agent_prompt", freshPrompt);
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
        used_provider?: string | null;
        llm_errors?: string[];
      }>("/conversations/simulate", {
        method: "POST",
        body: JSON.stringify({
          message: userMsg,
          customer_name: "Cliente Simulador WhatsApp",
          customer_phone: "+57 300 000 0000",
          system_prompt_override: prompt,
          llm_provider_override: provider,
          llm_model_override: model,
        }),
      });

      let providerLabel: string | undefined;
      if (simRes.used_provider) {
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
            return "OpenAI: Tu cuenta no tiene créditos o saldo disponible en platform.openai.com.";
          }
          if (err.includes("anthropic-workspace-id") || err.includes("not scoped to a workspace")) {
            return "Anthropic: Tu API key requiere configurar ANTHROPIC_WORKSPACE_ID o usar una key creada dentro de un Workspace.";
          }
          if (err.includes("no longer available") || err.includes("not found")) {
            return "Google Gemini: Modelo no disponible en la versión configurada.";
          }
          return err.slice(0, 150);
        });

        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `ℹ️ Diagnóstico de conexión de IA:\n• ${cleanedErrors.join("\n• ")}`,
          },
        ]);
      }
      const actionLabel = simRes.tool_called ? formatToolLabel(simRes.tool_called, lang) : undefined;
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: simRes.reply,
          actionBadge: actionLabel,
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
              ? `⚠️ I couldn't reach the assistant service right now. ${detail ? `(${detail})` : ""} Please try again in a few seconds.`
              : `⚠️ No pude conectar con el servicio del asistente en este momento. ${detail ? `(${detail})` : ""} Intenta de nuevo en unos segundos.`,
        },
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Save actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/70 dark:border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            {lang === "en" ? `My Agent · ${tenant.name}` : `Mi Agente · ${tenant.name}`}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {lang === "en"
              ? `Customize how your virtual assistant greets customers and manages appointments for ${tenant.name}.`
              : `Personaliza cómo saluda tu asistente, qué información solicita y cómo agenda las citas de ${tenant.name}.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs font-medium text-zinc-500">
              {lang === "en" ? "Agent Active:" : "Agente Activo:"}
            </span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {lang === "en" ? "Saving..." : "Guardando..."}
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-300" />
                {lang === "en" ? "Saved!" : "¡Guardado!"}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {lang === "en" ? "Save Changes" : "Guardar Cambios"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Instructions & Preferences */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prompt Editor */}
          <Card className="border-zinc-200/70 dark:border-zinc-800/80 shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {lang === "en" ? "Assistant Instructions" : "Instrucciones de tu Asistente"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {lang === "en"
                      ? `Write in plain language how the assistant should care for your customers at ${tenant.name}.`
                      : `Indica en lenguaje sencillo cómo debe atender tu asistente a los clientes de ${tenant.name}.`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={13}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="text-xs sm:text-sm leading-relaxed bg-zinc-50/50 dark:bg-zinc-900/50 resize-y border-zinc-200 dark:border-zinc-800"
                placeholder={
                  lang === "en"
                    ? "Write instructions for your assistant..."
                    : "Escribe las instrucciones para tu asistente..."
                }
              />
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {lang === "en"
                    ? "Tip: Include your business hours and tone of voice."
                    : "Consejo: Incluye tus horarios de atención y el tono de trato que prefieras."}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToDefault}
                  className="text-xs h-7 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  {lang === "en" ? "Restore suggested template" : "Restaurar plantilla sugerida"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Engine & Capabilities */}
          <Card className="border-zinc-200/70 dark:border-zinc-800/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-500" />
                {lang === "en" ? "Response Style & Capabilities" : "Estilo de Respuesta y Capacidades"}
              </CardTitle>
              <CardDescription className="text-xs">
                {lang === "en"
                  ? "Adjust the intelligence engine and automatic actions enabled for your business."
                  : "Ajusta el motor de inteligencia y las acciones automáticas habilitadas para tu negocio."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {lang === "en" ? "AI Engine" : "Motor de Inteligencia"}
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      if (e.target.value === "anthropic") setModel("claude-3-5-haiku-latest");
                      else if (e.target.value === "google") setModel("gemini-3.8-flash");
                      else setModel("gpt-4o-mini");
                    }}
                    className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"
                  >
                    <option value="google">Google Gemini (Gemini 3.8 Flash)</option>
                    <option value="openai">OpenAI (GPT-4o Mini)</option>
                    <option value="anthropic">Anthropic (Claude 3.5 Haiku)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {lang === "en" ? "Model / Version" : "Modelo / Versión"}
                  </label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={
                      provider === "google"
                        ? "gemini-3.8-flash"
                        : provider === "anthropic"
                        ? "claude-3-5-haiku-latest"
                        : "gpt-4o-mini"
                    }
                    className="h-9 text-sm font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {lang === "en"
                      ? `Flexibility / Tone Warmth: ${temperature}`
                      : `Naturalidad de la conversación: ${temperature}`}
                  </span>
                  <span className="text-zinc-400">
                    {lang === "en" ? "Recommended: 0.2 - 0.4" : "Recomendado: 0.2 - 0.4"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Natural Language Capabilities */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {lang === "en" ? "Active Capabilities" : "Acciones Automáticas Activas"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      {lang === "en" ? "Availability check" : "Consulta de disponibilidad"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{lang === "en" ? "Appointment booking" : "Cita agendada en calendario"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Testing Playground */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col border-zinc-200/70 dark:border-zinc-800/80 shadow-2xs">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    {lang === "en" ? "Simulate Chat" : "Simular Chat"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {lang === "en"
                      ? `Test how your assistant responds to ${tenant.name} customers.`
                      : `Prueba cómo responde tu asistente a los clientes de ${tenant.name}.`}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-zinc-100 dark:bg-zinc-800">
                  WhatsApp
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-4 space-y-4">
              {/* Message thread */}
              <div className="flex-1 min-h-[360px] max-h-[500px] overflow-y-auto space-y-3 p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 flex flex-col">
                {chatMessages.length === 0 && !isSimulating && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400 space-y-2.5 my-auto">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      {lang === "en" ? "Ready to test your agent" : "Listo para probar tu agente"}
                    </p>
                    <p className="text-xs max-w-xs text-zinc-400 dark:text-zinc-500">
                      {lang === "en"
                        ? "Type a greeting or question in the box below to start the conversation."
                        : "Escribe un saludo o pregunta en la barra inferior para iniciar la conversación."}
                    </p>
                  </div>
                )}
                {chatMessages.map((msg, index) => (
                  <div key={index} className="space-y-1">
                    {(msg.actionBadge || msg.providerBadge) && (
                      <div className="ml-9 flex items-center gap-1.5 flex-wrap">
                        {msg.actionBadge && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {msg.actionBadge}
                          </span>
                        )}
                        {msg.providerBadge && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                            <Sparkles className="h-2.5 w-2.5" />
                            {msg.providerBadge}
                          </span>
                        )}
                      </div>
                    )}
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
                        className={`p-3 rounded-2xl text-xs sm:text-sm max-w-[80%] leading-relaxed shadow-2xs ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60 rounded-tl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isSimulating && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 p-2 italic">
                    <Sparkles className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                    {lang === "en"
                      ? "Checking calendar and preparing reply..."
                      : "Revisando tu agenda y preparando respuesta..."}
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 pt-2"
              >
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    lang === "en"
                      ? "Write as if you were a customer..."
                      : "Escribe como si fueras un cliente..."
                  }
                  className="text-xs sm:text-sm h-10"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
