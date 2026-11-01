"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Sparkles,
  Bot,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ListPlus,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

const PREDEFINED_INDUSTRIES = [
  "Servicios Profesionales y Consultoría",
  "Salud y Consultorios Médicos/Dentales",
  "Servicios Legales y Jurídicos",
  "Belleza, Spas y Cuidado Personal",
  "Tecnología, Software y Soporte",
  "Talleres y Mantenimiento",
  "Comercio y Retail",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingFinish, setIsSavingFinish] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Servicios Profesionales y Consultoría");
  const [customIndustry, setCustomIndustry] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("+57 311 000 0000");
  const [services, setServices] = useState(
    "1. Asesoría inicial y diagnóstico\n2. Servicio estándar de atención\n3. Consultoría personalizada"
  );
  const [schedule, setSchedule] = useState(
    "Lunes a Viernes: 8:00 AM - 6:00 PM\nSábados: 9:00 AM - 1:00 PM"
  );
  const [agentName, setAgentName] = useState("Asistente Virtual");
  const [tone, setTone] = useState("Profesional, cálido y resolutivo");
  const [cancellationPolicy, setCancellationPolicy] = useState(
    "Cancelar o reprogramar con mínimo 2 horas de anticipación"
  );
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const effectiveIndustry =
    industry === "Otro" ? customIndustry.trim() || "Servicios Profesionales" : industry;

  const applyIndustryDefaults = (ind: string) => {
    const lower = ind.toLowerCase();
    if (lower.includes("legal") || lower.includes("jurídic")) {
      setAgentName("Martín");
      setServices(
        "1. Revisión y redacción de contratos\n2. Diagnóstico jurídico\n3. Asesoría laboral y societaria"
      );
    } else if (
      lower.includes("tech") ||
      lower.includes("cloud") ||
      lower.includes("sistemas") ||
      lower.includes("software")
    ) {
      setAgentName("Alex");
      setServices(
        "1. Sesión de diagnóstico tecnológico\n2. Soporte y consultoría de proyectos\n3. Implementación de soluciones digitales"
      );
    } else if (
      lower.includes("spa") ||
      lower.includes("bienestar") ||
      lower.includes("belleza")
    ) {
      setAgentName("Camila");
      setServices(
        "1. Masaje relajante y descontracturante\n2. Circuito de hidroterapia termal\n3. Tratamiento facial rejuvenecedor"
      );
    } else if (lower.includes("dental") || lower.includes("salud") || lower.includes("médic")) {
      setAgentName("Sofía");
      setServices(
        "1. Valoración Odontológica General\n2. Limpieza Dental Profesional\n3. Valoración de Ortodoncia"
      );
    }
  };

  React.useEffect(() => {
    const savedName = localStorage.getItem("zolution_org_name");
    const savedIndustry = localStorage.getItem("zolution_org_industry");
    if (savedName) setCompanyName(savedName);
    if (savedIndustry) {
      if (PREDEFINED_INDUSTRIES.includes(savedIndustry)) {
        setIndustry(savedIndustry);
      } else {
        setIndustry("Otro");
        setCustomIndustry(savedIndustry);
      }
      applyIndustryDefaults(savedIndustry);
    }

    const fetchBackendData = async () => {
      try {
        const [orgData, agentData] = await Promise.all([
          apiFetch<{ name?: string }>("/organizations/me").catch(() => null),
          apiFetch<{
            onboarding_answers?: Record<string, unknown> | null;
            system_prompt_generated?: string | null;
          }>("/agents/me").catch(() => null),
        ]);

        if (orgData?.name && !savedName) {
          setCompanyName(orgData.name);
        }

        const ans = agentData?.onboarding_answers;
        if (ans && typeof ans === "object") {
          const dbName = (ans.companyName || ans.business_name) as string | undefined;
          const dbInd = (ans.industry || ans.business_type) as string | undefined;
          if (dbName) setCompanyName(dbName);
          if (dbInd) {
            if (PREDEFINED_INDUSTRIES.includes(dbInd)) {
              setIndustry(dbInd);
            } else {
              setIndustry("Otro");
              setCustomIndustry(dbInd);
            }
          }
          if (typeof ans.whatsappPhone === "string" && ans.whatsappPhone)
            setWhatsappPhone(ans.whatsappPhone);
          if (typeof ans.services === "string" && ans.services) setServices(ans.services);
          if (typeof ans.schedule === "string" && ans.schedule) setSchedule(ans.schedule);
          if (typeof ans.agentName === "string" && ans.agentName) setAgentName(ans.agentName);
          if (typeof ans.tone === "string" && ans.tone) setTone(ans.tone);
          if (typeof ans.cancellationPolicy === "string" && ans.cancellationPolicy) {
            setCancellationPolicy(ans.cancellationPolicy);
          }
        }
        if (agentData?.system_prompt_generated) {
          setGeneratedPrompt(agentData.system_prompt_generated);
        }
      } catch {
        // Keep local values
      }
    };

    fetchBackendData();
  }, []);

  const handleGeneratePrompt = async () => {
    setIsGenerating(true);

    const compiledPrompt = `Eres ${agentName}, el asistente virtual de ${companyName || "nuestro negocio"}.
Tu objetivo es atender a los clientes por WhatsApp, responder sus dudas sobre nuestros servicios y agendar sus citas en Google Calendar de forma amable y ordenada.

Sector: ${effectiveIndustry}
Tono y trato: ${tone}

Servicios disponibles:
${services}

Horarios de atención:
${schedule}

Políticas de atención:
- ${cancellationPolicy}
- Revisa siempre la disponibilidad en el calendario antes de proponer horarios al cliente.
- Una vez el cliente confirme el horario y sus datos de contacto, registra la cita en Google Calendar.
- Si el cliente tiene una consulta especial, ofrece comunicarlo con una persona de nuestro equipo.`;

    try {
      await apiFetch("/agents/me/onboarding", {
        method: "PUT",
        body: JSON.stringify({
          answers: {
            companyName: companyName.trim(),
            business_name: companyName.trim(),
            industry: effectiveIndustry,
            business_type: effectiveIndustry,
            whatsappPhone,
            services,
            schedule,
            agentName,
            agent_name: agentName,
            tone,
            cancellationPolicy,
            system_prompt_generated: compiledPrompt,
          },
        }),
      });
    } catch {
      // Fallback local if offline
    }

    setGeneratedPrompt(compiledPrompt);
    setIsGenerating(false);
    setStep(4);
  };

  const handleFinishOnboarding = async () => {
    setIsSavingFinish(true);
    const cleanName = companyName.trim();

    if (cleanName) {
      localStorage.setItem("zolution_org_name", cleanName);
      localStorage.setItem("zolution_org_industry", effectiveIndustry);
    }
    if (generatedPrompt) {
      localStorage.setItem("zolution_agent_prompt", generatedPrompt);
    }

    try {
      await apiFetch("/agents/me", {
        method: "PATCH",
        body: JSON.stringify({
          company_name: cleanName || undefined,
          system_prompt_generated: generatedPrompt,
          status: "active",
          onboarding_answers: {
            companyName: cleanName,
            business_name: cleanName,
            industry: effectiveIndustry,
            business_type: effectiveIndustry,
            whatsappPhone,
            services,
            schedule,
            agentName,
            agent_name: agentName,
            tone,
            cancellationPolicy,
          },
        }),
      });
    } catch {
      // Keep local storage sync if offline
    } finally {
      setIsSavingFinish(false);
      window.dispatchEvent(new Event("storage"));
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Header and Step Indicator */}
        <div className="text-center space-y-2">
          <Badge
            variant="outline"
            className="text-xs bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
          >
            Paso {step} de 4
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Personaliza el Asistente de tu Negocio
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Cuéntanos sobre tu negocio para que tu asistente atienda clientes y agende citas como parte de tu equipo.
          </p>

          {/* Progress bar */}
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-4">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <Card className="border-zinc-200/70 dark:border-zinc-800/80 shadow-lg">
          {/* Step 1: Business Profile */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  Paso 1: Datos de tu Negocio
                </CardTitle>
                <CardDescription className="text-xs">
                  Información básica con la que tu asistente saludará a tus clientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Nombre de tu Negocio o Empresa
                  </label>
                  <Input
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Clínica Santa María, Nova Consultores..."
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Sector o Actividad
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => {
                      setIndustry(e.target.value);
                      if (e.target.value !== "Otro") {
                        applyIndustryDefaults(e.target.value);
                      }
                    }}
                    className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                  >
                    {PREDEFINED_INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                    <option value="Otro">Otro (Especificar sector)</option>
                  </select>
                </div>

                {industry === "Otro" && (
                  <div className="space-y-1">
                    <label className="font-medium text-indigo-600 dark:text-indigo-400">
                      ¿A qué se dedica tu negocio?
                    </label>
                    <Input
                      required
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      placeholder="Ej. Veterinaria, Inmobiliaria, Academia, Restaurante..."
                      className="h-9 text-xs border-indigo-300 dark:border-indigo-800"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Teléfono de WhatsApp
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
                    disabled={!companyName.trim() || (industry === "Otro" && !customIndustry.trim())}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 cursor-pointer"
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
                  Indica qué servicios ofreces y en qué horarios atiendes citas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Servicios Principales
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
                    Días y Horarios de Atención
                  </label>
                  <Textarea
                    rows={3}
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="text-xs resize-y"
                  />
                </div>

                <div className="pt-2 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="text-xs h-9 cursor-pointer"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Atrás
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 cursor-pointer"
                  >
                    Siguiente: Estilo de Atención
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
                  Paso 3: Estilo de Atención
                </CardTitle>
                <CardDescription className="text-xs">
                  Elige el nombre de tu asistente y cómo quieres que trate a tus clientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Nombre de tu Asistente
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
                      Trato con el Cliente
                    </label>
                    <Input
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="Ej. Cercano, formal, amable..."
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Reglas para Citas o Cancelaciones
                  </label>
                  <Input
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="text-xs h-9 cursor-pointer"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Atrás
                  </Button>
                  <Button
                    onClick={handleGeneratePrompt}
                    disabled={isGenerating}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 cursor-pointer"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    {isGenerating ? "Preparando Asistente..." : "Crear Instrucciones"}
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
                    ¡Tu Asistente está Listo!
                  </CardTitle>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                    Configurado
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Revisa o ajusta la guía de atención que seguirá tu asistente con cada cliente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <Textarea
                  rows={10}
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  className="text-xs leading-relaxed bg-zinc-50 dark:bg-zinc-900 resize-y"
                />

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Agenda Conectada
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Tu agente gestiona citas y responde dudas directamente desde el calendario de tu negocio.
                  </p>
                </div>

                <div className="pt-2 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="text-xs h-9 cursor-pointer"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Volver
                  </Button>
                  <Button
                    onClick={handleFinishOnboarding}
                    disabled={isSavingFinish}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 cursor-pointer"
                  >
                    {isSavingFinish ? (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        Ir al Resumen
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </>
                    )}
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
