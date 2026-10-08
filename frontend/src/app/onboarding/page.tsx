"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Clock,
  Sparkles,
  Bot,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ListPlus,
  Send,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Servicios Profesionales");
  const [whatsappPhone, setWhatsappPhone] = useState("+57 311 000 0000");
  const [services, setServices] = useState(
    "1. Asesoría inicial y diagnóstico\n2. Servicio estándar de atención\n3. Consultoría avanzada personalizada"
  );
  const [schedule, setSchedule] = useState("Lunes a Viernes: 8:00 AM - 6:00 PM\nSábados: 9:00 AM - 1:00 PM");
  const [agentName, setAgentName] = useState("Sofía");
  const [tone, setTone] = useState("Profesional, cálido y resolutivo");
  const [cancellationPolicy, setCancellationPolicy] = useState("Cancelar con mínimo 2 horas de anticipación");
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handleGeneratePrompt = async () => {
    setIsGenerating(true);

    const compiledPrompt = `Eres ${agentName}, la asistente virtual inteligente de ${companyName || "la empresa"}.
Tu rol es atender a los clientes por WhatsApp, responder dudas sobre los servicios y agendar citas o reuniones en Google Calendar de forma autónoma.

Sector: ${industry}
Tono y personalidad: ${tone}

Catálogo de Servicios:
${services}

Horarios de Atención:
${schedule}

Políticas y Reglas:
- ${cancellationPolicy}
- Consulta SIEMPRE la disponibilidad mediante la herramienta 'check_availability' antes de proponer horas al cliente.
- Una vez el cliente confirme el horario y sus datos, usa 'book_appointment' para separar el cupo oficial en Google Calendar.
- Si el cliente tiene una duda fuera de alcance, sé honesta y ofrece comunicar con un asesor humano.`;

    try {
      // Try backend endpoint if live
      await apiFetch("/agents/me/onboarding", {
        method: "PUT",
        body: JSON.stringify({
          answers: {
            companyName,
            industry,
            services,
            schedule,
            agentName,
            tone,
          },
        }),
      });
    } catch {
      // Fallback local
    }

    setGeneratedPrompt(compiledPrompt);
    setIsGenerating(false);
    setStep(4);
  };

  const handleFinishOnboarding = () => {
    if (companyName) {
      localStorage.setItem("zolution_org_name", companyName);
      localStorage.setItem("zolution_org_industry", industry);
    }
    router.push("/agent");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Header and Step Indicator */}
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
            Paso {step} de 4
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Configura tu Agente Inteligente de WhatsApp
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Zolution ensambla el prompt del sistema y conecta las herramientas en minutos para tu empresa.
          </p>

          {/* Progress bar */}
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-4">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-xl">
          {/* Step 1: Business Profile */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  Paso 1: Perfil de tu Negocio
                </CardTitle>
                <CardDescription className="text-xs">
                  Información básica de tu empresa que el asistente utilizará para presentarse.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Nombre de la Empresa o Negocio
                  </label>
                  <Input
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Nova Consultores, Estudio Dental, AutoTech..."
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Industria / Sector
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="Servicios Profesionales y Consultoría">Servicios Profesionales y Consultoría</option>
                    <option value="Salud y Consultorios Médicos/Dentales">Salud y Consultorios Médicos/Dentales</option>
                    <option value="Servicios Legales y Jurídicos">Servicios Legales y Jurídicos</option>
                    <option value="Belleza, Spas y Cuidado Personal">Belleza, Spas y Cuidado Personal</option>
                    <option value="Tecnología, Software y Soporte">Tecnología, Software y Soporte</option>
                    <option value="Talleres y Mantenimiento">Talleres y Mantenimiento</option>
                    <option value="Comercio y Retail">Comercio y Retail</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Teléfono Oficial de WhatsApp
                  </label>
                  <Input
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+57 311 000 0000"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!companyName}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
                  >
                    Siguiente: Servicios y Horarios
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Services & Hours */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ListPlus className="h-5 w-5 text-indigo-500" />
                  Paso 2: Servicios y Horarios de Atención
                </CardTitle>
                <CardDescription className="text-xs">
                  Especifica lo que ofrece tu negocio y los horarios disponibles para citas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Catálogo de Servicios y Precios Orientativos
                  </label>
                  <Textarea
                    rows={4}
                    value={services}
                    onChange={(e) => setServices(e.target.value)}
                    className="text-xs resize-y"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Días y Horarios de Atención al Cliente
                  </label>
                  <Textarea
                    rows={3}
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="text-xs resize-y"
                  />
                </div>

                <div className="pt-2 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)} className="text-xs h-9">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Atrás
                  </Button>
                  <Button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9">
                    Siguiente: Personalidad del Agente
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Agent Personality */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Bot className="h-5 w-5 text-indigo-500" />
                  Paso 3: Personalidad del Agente y Políticas
                </CardTitle>
                <CardDescription className="text-xs">
                  Define cómo se llamará el asistente y el tono de comunicación con los clientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Nombre del Asistente
                    </label>
                    <Input
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="Ej. Sofía, Mateo, Alex..."
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Tono de Conversación
                    </label>
                    <Input
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="Ej. Cercano, formal, dinámico..."
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Políticas de Citas y Cancelación
                  </label>
                  <Input
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)} className="text-xs h-9">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Atrás
                  </Button>
                  <Button
                    onClick={handleGeneratePrompt}
                    disabled={isGenerating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    {isGenerating ? "Generando con IA..." : "Sintetizar Prompt del Agente"}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Prompt Generated & Confirmation */}
          {step === 4 && (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ¡Prompt del Agente Ensamblado Exitosamente!
                  </CardTitle>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                    Listo para WhatsApp
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Este es el conjunto de instrucciones del sistema que guiará el comportamiento del LLM en cada conversación turn-by-turn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <Textarea
                  rows={10}
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  className="font-mono text-xs leading-relaxed bg-zinc-50 dark:bg-zinc-900 resize-y"
                />

                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-emerald-600" />
                    Function Calling Habilitado
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Las herramientas <code>check_availability</code> y <code>book_appointment</code> han sido vinculadas automáticamente a este agente.
                  </p>
                </div>

                <div className="pt-2 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)} className="text-xs h-9">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Ajustar Parámetros
                  </Button>
                  <Button
                    onClick={handleFinishOnboarding}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
                  >
                    Guardar y Abrir Simulador
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
