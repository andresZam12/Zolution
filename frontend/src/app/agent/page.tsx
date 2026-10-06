"use client";

import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  Save,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Calendar,
  Send,
  User,
  Shield,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function AgentConfigPage() {
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.3);
  const [isActive, setIsActive] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [prompt, setPrompt] = useState(
    `Eres Sofía, la asistente virtual de la Clínica Dental Zolution.
Tu objetivo es atender a los pacientes por WhatsApp con calidez, responder dudas sobre tratamientos dentales y agendar sus citas de manera eficiente.

Horario de atención:
- Lunes a Viernes: 8:00 AM - 6:00 PM
- Sábados: 9:00 AM - 1:00 PM

Instrucciones:
1. Sé cordial, empática y profesional.
2. Si el paciente pregunta por citas, SIEMPRE consulta primero la disponibilidad con la herramienta check_availability antes de proponer horarios.
3. Una vez el paciente elija un horario válido y confirme sus datos (nombre completo y teléfono), usa book_appointment para agendarla en Google Calendar.
4. Nunca inventes disponibilidad si la herramienta indica que no hay espacio.`
  );

  // Playground chat state
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "¡Hola! Soy Sofía de Clínica Zolution. ¿En qué puedo ayudarte hoy?" },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const userMsg = inputMessage;
    setInputMessage("");

    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsSimulating(true);

    // Simulate agent response with tool calling simulation
    setTimeout(() => {
      let reply = "Entendido, con gusto te ayudo.";
      if (userMsg.toLowerCase().includes("cita") || userMsg.toLowerCase().includes("hora")) {
        reply = "Claro, permíteme consultar la agenda... Para este jueves tengo disponibilidad a las 10:00 AM y a las 3:30 PM. ¿Cuál de esos horarios te queda mejor?";
      } else if (userMsg.toLowerCase().includes("10") || userMsg.toLowerCase().includes("3")) {
        reply = "¡Excelente! He agendado tu cita en Google Calendar y te llegará un recordatorio por WhatsApp un día antes. ¿Deseas consultar algo más?";
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header with Save actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Configuración del Agente IA
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Personaliza la personalidad, instrucciones del sistema y modelos de lenguaje de tu clínica.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs font-medium text-zinc-500">Agente Activo:</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
            {savedSuccess ? (
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
                    Define cómo debe saludar, qué información pedir y las políticas del consultorio.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                  {prompt.length} caracteres
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={12}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="font-mono text-xs sm:text-sm leading-relaxed bg-zinc-50/50 dark:bg-zinc-900/50 resize-y border-zinc-200 dark:border-zinc-800"
                placeholder="Escribe las instrucciones para el asistente..."
              />
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Variables disponibles: &#123;&#123;nombre_cliente&#125;&#125;, &#123;&#123;telefono&#125;&#125;</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPrompt(
                      "Eres Sofía, asistente virtual de Zolution. Ayudas a pacientes a resolver dudas y agendar citas en Google Calendar."
                    )
                  }
                  className="text-xs h-7 text-zinc-400 hover:text-zinc-600"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Restaurar base
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
                  <span className="text-zinc-400">Recomendado: 0.2 - 0.4 para citas médicas</span>
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
                    Simulador en Vivo
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Prueba cómo responde tu agente en tiempo real antes de desplegarlo.
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
                    Sofía está consultando disponibilidad...
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
                  placeholder="Escribe como si fueras un paciente..."
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
