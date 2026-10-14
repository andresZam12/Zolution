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
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
import { getTenantContext, generateDefaultPrompt, TenantContext } from "@/lib/tenant";

export default function AgentConfigPage() {
  const [tenant, setTenant] = useState<TenantContext>({
    id: "dra-garcia-dental",
    slug: "dra-garcia-dental",
    name: "Cargando empresa...",
    industry: "Servicios",
    email: "admin@zolution.ai",
  });
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.3);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);

  const [prompt, setPrompt] = useState("");

  // Playground chat state
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  // Load configuration from backend if available, or fall back to tenant dynamic config
  const loadAgentConfig = async () => {
    const ctx = getTenantContext();
    setTenant(ctx);

    const initialPrompt = ctx.prompt || generateDefaultPrompt(ctx.name, ctx.industry);
    setPrompt(initialPrompt);

    setChatMessages([
      {
        role: "assistant",
        content: `¡Hola! Soy el asistente virtual de ${ctx.name}. ¿En qué podemos ayudarte hoy?`,
      },
    ]);

    try {
      const data = await apiFetch<{
        system_prompt_generated?: string | null;
        llm_provider?: string;
        llm_model?: string;
        status?: string;
      }>("/agents/me");

      if (data) {
        if (data.system_prompt_generated && !ctx.prompt) {
          setPrompt(data.system_prompt_generated);
        }
        if (data.llm_provider) setProvider(data.llm_provider);
        if (data.llm_model) setModel(data.llm_model);
        if (data.status) setIsActive(data.status === "active");
        setIsLiveApi(true);
      }
    } catch {
      setIsLiveApi(false);
    }
  };

  useEffect(() => {
    loadAgentConfig();
    window.addEventListener("storage", loadAgentConfig);
    return () => window.removeEventListener("storage", loadAgentConfig);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // Persist locally for immediate universal multi-tenant consistency
    localStorage.setItem("zolution_agent_prompt", prompt);

    try {
      if (isLiveApi) {
        await apiFetch("/agents/me/llm-provider", {
          method: "PATCH",
          body: JSON.stringify({
            llm_provider: provider,
            llm_model: model,
          }),
        });
      }
    } catch {
      // Fallback
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

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const userMsg = inputMessage;
    setInputMessage("");

    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsSimulating(true);

    // Simulate agent response with tool calling simulation tailored to company
    setTimeout(() => {
      let reply = `Entendido, en ${tenant.name} con gusto te ayudamos.`;
      const lower = userMsg.toLowerCase();
      if (lower.includes("cita") || lower.includes("hora") || lower.includes("reunión") || lower.includes("agendar") || lower.includes("disponib")) {
        reply = `Claro, permíteme consultar la agenda disponible en Google Calendar... Para este jueves tenemos espacio a las 10:00 AM y a las 3:30 PM. ¿Cuál horario te queda mejor?`;
      } else if (lower.includes("10") || lower.includes("3") || lower.includes("jueves") || lower.includes("perfecto") || lower.includes("sí")) {
        reply = `¡Excelente! He agendado formalmente tu cita en el calendario de ${tenant.name}. Te llegará un recordatorio por WhatsApp un día antes. ¿Deseas consultar algo más?`;
      } else if (lower.includes("costo") || lower.includes("precio") || lower.includes("tarifa") || lower.includes("servicio")) {
        reply = `En ${tenant.name} manejamos planes adaptados a tus requerimientos. Con mucho gusto podemos agendar una sesión inicial de diagnóstico sin costo para evaluar tu caso. ¿Te gustaría apartar un horario?`;
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setIsSimulating(false);
    }, 1100);
  };

  return (
    <div className="space-y-6">
      {/* Header with Save actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Configuración del Agente IA · {tenant.name}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Personaliza la personalidad, instrucciones del sistema y modelos de lenguaje de {tenant.name}.
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
                Backend Sync Activo
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-zinc-400" />
                Modo Demo
              </>
            )}
          </Badge>

          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs font-medium text-zinc-500">Agente Activo:</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-300" />
                ¡Guardado!
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prompt & Model Configuration */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prompt Editor */}
          <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Prompt del Sistema (System Instructions)</CardTitle>
                  <CardDescription className="text-xs">
                    Define cómo debe saludar, qué información pedir y las políticas de atención de {tenant.name}.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                  {prompt.length} caracteres
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={13}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="font-mono text-xs sm:text-sm leading-relaxed bg-zinc-50/50 dark:bg-zinc-900/50 resize-y border-zinc-200 dark:border-zinc-800"
                placeholder="Escribe las instrucciones para el asistente..."
              />
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Variables: &#123;&#123;nombre_cliente&#125;&#125;, &#123;&#123;telefono&#125;&#125;</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToDefault}
                  className="text-xs h-7 text-zinc-400 hover:text-zinc-600"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Restaurar para {tenant.name}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Model and Parameters */}
          <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-500" />
                Parámetros del Proveedor de LLM
              </CardTitle>
              <CardDescription className="text-xs">
                Soporte multi-proveedor desacoplado mediante el patrón Factory del Backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Proveedor de IA
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      if (e.target.value === "anthropic") setModel("claude-3-5-sonnet");
                      else if (e.target.value === "google") setModel("gemini-2.0-flash");
                      else setModel("gpt-4o-mini");
                    }}
                    className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="google">Google Gemini</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Modelo
                  </label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Creatividad / Temperatura: {temperature}
                  </span>
                  <span className="text-zinc-400">Recomendado: 0.2 - 0.4 para citas y atención</span>
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

              {/* Tools enabled */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Herramientas Habilitadas (Function Calling)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>check_availability (Google Cal)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>book_appointment (Google Cal)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Testing Playground */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    Simulador en Vivo · WhatsApp
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Prueba cómo responde el agente de {tenant.name} en tiempo real.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-zinc-100 dark:bg-zinc-800">
                  WhatsApp Preview
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-4 space-y-4">
              {/* Message thread */}
              <div className="flex-1 min-h-[360px] max-h-[500px] overflow-y-auto space-y-3 p-3 rounded-xl bg-zinc-100/60 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
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
                      className={`p-3 rounded-2xl text-xs sm:text-sm max-w-[80%] leading-relaxed shadow-2xs ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60 rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isSimulating && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 p-2 italic">
                    <Sparkles className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                    El agente está consultando disponibilidad...
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
                  placeholder="Escribe como si fueras un cliente..."
                  className="text-xs sm:text-sm h-10"
                />
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white">
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
