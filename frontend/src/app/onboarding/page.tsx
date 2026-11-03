"use client";

import React, { useState, useEffect } from "react";
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
  Plus,
  Trash2,
  Clock,
  DollarSign,
  Calendar,
  CreditCard,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

const PREDEFINED_INDUSTRIES = [
  "Salud y Consultorios Médicos/Dentales",
  "Belleza, Spas y Cuidado Personal",
  "Servicios Profesionales y Consultoría",
  "Servicios Legales y Jurídicos",
  "Restaurantes, Cafés y Gastronomía",
  "Talleres Automotrices y Mantenimiento",
  "Tecnología, Software y Soporte",
  "Inmobiliaria y Bienes Raíces",
  "Comercio y Retail",
];

interface ServiceItemState {
  name: string;
  price_cop: number | string;
  duration_minutes: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isSavingFinish, setIsSavingFinish] = useState(false);
  const [enrichmentNotice, setEnrichmentNotice] = useState<string | null>(null);

  // Form State - Step 1: Negocio
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Salud y Consultorios Médicos/Dentales");
  const [customIndustry, setCustomIndustry] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("+57 311 000 0000");

  // Form State - Step 2: Servicios
  const [serviceItems, setServiceItems] = useState<ServiceItemState[]>([
    { name: "Valoración y Diagnóstico Inicial", price_cop: 30000, duration_minutes: 30 },
    { name: "Limpieza Dental Profunda (Profilaxis)", price_cop: 80000, duration_minutes: 45 },
    { name: "Control de Ortodoncia", price_cop: 55000, duration_minutes: 30 },
  ]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState(45);

  // Form State - Step 3: Horarios, Festivos y Políticas
  const [scheduleWeekdays, setScheduleWeekdays] = useState("Lunes a Viernes: 8:00 AM - 6:00 PM");
  const [scheduleSaturdays, setScheduleSaturdays] = useState("Sábados: 8:00 AM - 1:00 PM");
  const [holidayPolicy, setHolidayPolicy] = useState("Solo hasta mediodía (8:00 AM - 1:00 PM)");
  const [toleranceMinutes, setToleranceMinutes] = useState(15);
  const [cancellationNotice, setCancellationNotice] = useState("Mínimo 2 horas de anticipación");
  const [paymentMethods, setPaymentMethods] = useState<string[]>([
    "Nequi / Daviplata",
    "Transferencia Bancolombia",
    "Tarjetas débito/crédito",
    "Efectivo",
  ]);
  const [agentName, setAgentName] = useState("Sofía");
  const [tone, setTone] = useState("Cálido, profesional y resolutivo");

  // Step 4: Prompt
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const effectiveIndustry =
    industry === "Otro" ? customIndustry.trim() || "Servicios Profesionales" : industry;

  // Initial load
  useEffect(() => {
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
            if (PREDEFINED_INDUSTRIES.includes(dbInd)) setIndustry(dbInd);
            else {
              setIndustry("Otro");
              setCustomIndustry(dbInd);
            }
          }
          if (typeof ans.agentName === "string" && ans.agentName) setAgentName(ans.agentName);
          if (typeof ans.agent_name === "string" && ans.agent_name) setAgentName(ans.agent_name);
          if (typeof ans.tone === "string" && ans.tone) setTone(ans.tone);
          if (typeof ans.holiday_policy === "string" && ans.holiday_policy) setHolidayPolicy(ans.holiday_policy);
          if (typeof ans.tolerance_minutes === "number") setToleranceMinutes(ans.tolerance_minutes);
        }
        if (agentData?.system_prompt_generated) {
          setGeneratedPrompt(agentData.system_prompt_generated);
        }
      } catch {
        // Keep initial state
      }
    };

    fetchBackendData();
  }, []);

  // AI Enrichment Trigger
  const handleAIEnrich = async () => {
    if (!companyName.trim()) return;
    setIsEnriching(true);
    setEnrichmentNotice(null);

    try {
      const res = await apiFetch<{
        agent_name: string;
        tone: string;
        services: { name: string; price_cop?: number; duration_minutes: number; description?: string }[];
        schedule_weekdays: string;
        schedule_saturdays: string;
        holiday_policy: string;
        cancellation_policy: string;
        tolerance_minutes: number;
        payment_methods: string[];
        faqs: { question: string; answer: string }[];
        recommended_system_prompt: string;
      }>("/agents/ai-enrich", {
        method: "POST",
        body: JSON.stringify({
          business_name: companyName.trim(),
          industry: effectiveIndustry,
          city_or_country: "Colombia",
        }),
      });

      if (res) {
        if (res.agent_name) setAgentName(res.agent_name);
        if (res.tone) setTone(res.tone);
        if (res.services && res.services.length > 0) {
          setServiceItems(
            res.services.map((s) => ({
              name: s.name,
              price_cop: s.price_cop ?? "",
              duration_minutes: s.duration_minutes || 45,
            }))
          );
        }
        if (res.schedule_weekdays) setScheduleWeekdays(res.schedule_weekdays);
        if (res.schedule_saturdays) setScheduleSaturdays(res.schedule_saturdays);
        if (res.holiday_policy) setHolidayPolicy(res.holiday_policy);
        if (res.tolerance_minutes) setToleranceMinutes(res.tolerance_minutes);
        if (res.cancellation_policy) setCancellationNotice(res.cancellation_policy);
        if (res.payment_methods && res.payment_methods.length > 0) {
          setPaymentMethods(res.payment_methods);
        }
        if (res.recommended_system_prompt) {
          setGeneratedPrompt(res.recommended_system_prompt);
        }

        setEnrichmentNotice(`¡Sugerencias lógicas aplicadas para ${effectiveIndustry}!`);
        setStep(2); // Auto navigate to review catalog
      }
    } catch {
      setEnrichmentNotice("No pudimos consultar la IA temporalmente. Puedes continuar manualmente.");
    } finally {
      setIsEnriching(false);
    }
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    setServiceItems((prev) => [
      ...prev,
      {
        name: newServiceName.trim(),
        price_cop: newServicePrice ? Number(newServicePrice.replace(/\D/g, "")) : "",
        duration_minutes: newServiceDuration,
      },
    ]);
    setNewServiceName("");
    setNewServicePrice("");
    setNewServiceDuration(45);
  };

  const handleRemoveService = (index: number) => {
    setServiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const togglePaymentMethod = (method: string) => {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  // Compile final Master System Prompt
  const compileSystemPrompt = () => {
    const servicesBlock = serviceItems
      .map((s) => {
        const priceStr = s.price_cop ? ` ($${Number(s.price_cop).toLocaleString("es-CO")} COP)` : "";
        return `- ${s.name}${priceStr} — ${s.duration_minutes} min`;
      })
      .join("\n");

    const fullSchedule = `${scheduleWeekdays}\n${scheduleSaturdays}`;
    const paymentText = paymentMethods.length > 0 ? paymentMethods.join(", ") : "Efectivo y Transferencias";

    return `## 1. ROL Y ALCANCE
Eres ${agentName}, el asistente virtual de ${companyName || "nuestro negocio"}. Tu objetivo es atender a los clientes por WhatsApp con calidez, resolver dudas sobre nuestros servicios y agendar sus citas en Google Calendar. Eres especialista en ${effectiveIndustry}.

## 2. DATOS DEL NEGOCIO
**Nombre:** ${companyName || "Nuestro Negocio"}
**Sector:** ${effectiveIndustry}

**Catálogo de Servicios y Tarifas (en pesos colombianos COP):**
${servicesBlock || "- Atención y valoración general"}

**Horario de Atención:**
${fullSchedule}
- **Días Festivos:** ${holidayPolicy}

**Políticas de Operación y Pagos:**
- **Cancelaciones y Cambios:** ${cancellationNotice}
- **Tolerancia de Llegada:** ${toleranceMinutes} minutos de espera antes de liberar el turno.
- **Medios de Pago Aceptados:** ${paymentText}
- **Urgencias:** No atendemos urgencias críticas sin cita previa.

## 3. REGLAS DE ATENCIÓN Y GUARDRAILS
1. NUNCA inventes precios, horarios o servicios que no estén listados en el catálogo. Si no sabes un dato, dilo con amabilidad y ofrece consultar con el equipo humano.
2. Comunícate en un tono ${tone}. Máximo 2 a 3 oraciones breves por mensaje, ideal para lectura ágil en WhatsApp.
3. Usa emojis con moderación (máximo 1 o 2 por mensaje).
4. Si el cliente pregunta por horarios en días festivos, recuerda amablemente: "${holidayPolicy}".

## 4. PROTOCOLO OBLIGATORIO DE AGENDAMIENTO (GOOGLE CALENDAR)
- Si el cliente pregunta horarios, ofrece opciones concretas dentro del horario laboral (ej: 10:00 AM o 3:30 PM).
- En cuanto el cliente elija o confirme la fecha y hora de su cita, confirma con entusiasmo la reserva y coloca SIEMPRE al final exacto de tu mensaje el comando:
[[AGENDAR|YYYY-MM-DD|HH:MM|Nombre del cliente|Servicio]]

## 5. ESCALACIÓN HUMANA
Escala al equipo si el cliente tiene una consulta fuera de catálogo o solicita hablar con una persona de nuestro equipo. Contacto: ${whatsappPhone}.`;
  };

  const handleGoToStep4 = () => {
    const prompt = compileSystemPrompt();
    setGeneratedPrompt(prompt);
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

    const servicesBlock = serviceItems
      .map((s) => {
        const priceStr = s.price_cop ? ` ($${Number(s.price_cop).toLocaleString("es-CO")} COP)` : "";
        return `- ${s.name}${priceStr} — ${s.duration_minutes} min`;
      })
      .join("\n");

    const fullSchedule = `${scheduleWeekdays}\n${scheduleSaturdays}`;

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
            services: servicesBlock,
            schedule: fullSchedule,
            holiday_policy: holidayPolicy,
            tolerance_minutes: toleranceMinutes,
            payment_methods: paymentMethods,
            agentName,
            agent_name: agentName,
            tone,
            cancellationPolicy: cancellationNotice,
          },
        }),
      });
    } catch {
      // Local fallback
    } finally {
      setIsSavingFinish(false);
      window.dispatchEvent(new Event("storage"));
      router.push("/agent");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header and Step Indicator */}
        <div className="text-center space-y-2">
          <Badge
            variant="outline"
            className="text-xs bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
          >
            Paso {step} de 4
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Configuración Inteligente de tu Agente
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            Configura en segundos la lógica de tu negocio. Con IA creamos un perfil operativo completo para que atienda y agende por WhatsApp sin que tengas que redactar prompts complicados.
          </p>

          {/* Progress bar */}
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-4">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {enrichmentNotice && (
          <div className="flex items-center justify-between text-xs px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              {enrichmentNotice}
            </span>
            <button
              type="button"
              onClick={() => setEnrichmentNotice(null)}
              className="text-emerald-600 hover:text-emerald-900 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <Card className="border-zinc-200/70 dark:border-zinc-800/80 shadow-lg">
          {/* STEP 1: BUSINESS PROFILE & AI MAGIC */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  Paso 1: Tu Negocio y Nicho
                </CardTitle>
                <CardDescription className="text-xs">
                  Indica el nombre y sector. Nuestra IA inferirá precios recomendados, horarios habituales y políticas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Nombre de tu Negocio o Empresa
                  </label>
                  <Input
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Odontología Sonrisas, Barbería Imperial, Nova Abogados..."
                    className="h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Sector o Industria
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm"
                  >
                    {PREDEFINED_INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                    <option value="Otro">Otro (Especificar)</option>
                  </select>
                </div>

                {industry === "Otro" && (
                  <div className="space-y-1.5">
                    <label className="font-medium text-indigo-600 dark:text-indigo-400">
                      ¿A qué se dedica tu negocio?
                    </label>
                    <Input
                      required
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      placeholder="Ej. Veterinaria, Gimnasio, Lavandería, Escuela de Conducción..."
                      className="h-10 text-xs border-indigo-300 dark:border-indigo-800"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    WhatsApp de Atención al Cliente
                  </label>
                  <Input
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+57 311 000 0000"
                    className="h-10 text-xs"
                  />
                </div>

                {/* AI ENRICHMENT HERO BANNER */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                        ¿Quieres ahorrar tiempo y evitar redactar todo a mano?
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed mt-0.5">
                        Nuestra IA estructurará tus servicios con precios reales en COP, horarios típicos para Colombia (incluyendo festivos) y políticas de cancelación con un solo clic.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAIEnrich}
                    disabled={isEnriching || !companyName.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-10 shadow-xs cursor-pointer font-medium"
                  >
                    {isEnriching ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Analizando tu sector y generando catálogo...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        ✨ Autocompletar y Enriquecer con IA
                      </>
                    )}
                  </Button>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!companyName.trim() || (industry === "Otro" && !customIndustry.trim())}
                    className="bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-zinc-900 text-xs h-9 cursor-pointer"
                  >
                    Continuar Manualmente
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 2: SERVICES & PRICING IN COP */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ListPlus className="h-5 w-5 text-indigo-500" />
                  Paso 2: Catálogo de Servicios y Precios (COP)
                </CardTitle>
                <CardDescription className="text-xs">
                  Tu asistente informará estos precios y agendará turnos según la duración de cada servicio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Active Services List */}
                <div className="space-y-2">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Servicios Configurados ({serviceItems.length})
                  </label>
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {serviceItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                              <DollarSign className="w-3 h-3" />
                              {item.price_cop
                                ? `$${Number(item.price_cop).toLocaleString("es-CO")} COP`
                                : "A cotizar / Gratuita"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.duration_minutes} min
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveService(idx)}
                          className="h-7 w-7 text-zinc-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Service Row */}
                <div className="p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    + Agregar otro servicio
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <Input
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="Nombre del servicio (ej: Blanqueamiento)"
                        className="h-8 text-xs bg-white dark:bg-zinc-950"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        type="number"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        placeholder="Precio COP (ej: 80000)"
                        className="h-8 text-xs bg-white dark:bg-zinc-950"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <select
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                        className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                      >
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                        <option value={90}>90 min</option>
                        <option value={120}>120 min</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddService}
                    disabled={!newServiceName.trim()}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs h-7.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Añadir al catálogo
                  </Button>
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
                    disabled={serviceItems.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 cursor-pointer"
                  >
                    Siguiente: Horarios y Políticas
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 3: SCHEDULES, HOLIDAYS, TOLERANCE & POLICIES (CHIPS) */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  Paso 3: Horarios, Festivos y Reglas del Negocio
                </CardTitle>
                <CardDescription className="text-xs">
                  Configura con un clic cómo opera tu negocio en festivos, tiempos de tolerancia y medios de pago.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Horarios habituales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Horario Lunes a Viernes
                    </label>
                    <Input
                      value={scheduleWeekdays}
                      onChange={(e) => setScheduleWeekdays(e.target.value)}
                      placeholder="Lunes a Viernes: 8:00 AM - 6:00 PM"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Horario Sábados
                    </label>
                    <Input
                      value={scheduleSaturdays}
                      onChange={(e) => setScheduleSaturdays(e.target.value)}
                      placeholder="Sábados: 8:00 AM - 1:00 PM"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Días Festivos (Chips) */}
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    ¿Cómo atienden los días festivos?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      "Solo hasta mediodía (8:00 AM - 1:00 PM)",
                      "Cerrado en días festivos",
                      "Atención en jornada habitual",
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setHolidayPolicy(opt)}
                        className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-colors cursor-pointer ${
                          holidayPolicy === opt
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-500 dark:text-indigo-300"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tolerancia y Cancelación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Tolerancia de espera al cliente
                    </label>
                    <div className="flex gap-2">
                      {[10, 15, 20].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setToleranceMinutes(mins)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                            toleranceMinutes === mins
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {mins} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Aviso previo para cancelar/reprogramar
                    </label>
                    <select
                      value={cancellationNotice}
                      onChange={(e) => setCancellationNotice(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                    >
                      <option value="Mínimo 2 horas de anticipación">Mínimo 2 horas antes</option>
                      <option value="Mínimo 4 horas de anticipación">Mínimo 4 horas antes</option>
                      <option value="Mismo día con aviso oportuno">Mismo día con aviso</option>
                      <option value="Mínimo 24 horas de anticipación">24 horas de anticipación</option>
                    </select>
                  </div>
                </div>

                {/* Medios de Pago Aceptados (Chips Toggles) */}
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                    Medios de pago aceptados (Selecciona los que recibes)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Nequi / Daviplata",
                      "Transferencia Bancolombia",
                      "Tarjetas débito/crédito",
                      "Efectivo",
                      "PSE",
                    ].map((method) => {
                      const isSelected = paymentMethods.includes(method);
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => togglePaymentMethod(method)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-zinc-50 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {method}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Asistente y Tono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Nombre del Asistente
                    </label>
                    <Input
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="Ej. Sofía, Carlos, Valentina..."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Tono de Conversación
                    </label>
                    <Input
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="Ej. Cálido, formal, empático..."
                      className="h-8 text-xs"
                    />
                  </div>
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
                    onClick={handleGoToStep4}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 cursor-pointer"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Generar Master Context
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 4: PROMPT GENERATED & READY */}
          {step === 4 && (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ¡Master Context y Asistente Listos!
                  </CardTitle>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                    Optimizado con IA
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Tu asistente ya tiene el contexto completo: servicios con precios en COP, reglas de festivos y conexión con Google Calendar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <Textarea
                  rows={12}
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  className="text-xs leading-relaxed font-mono bg-zinc-50 dark:bg-zinc-900 resize-y"
                />

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Sincronización con Google Calendar Activa
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Tu agente consultará disponibilidad y reservará turnos usando el protocolo oficial de Zolution con Google Calendar.
                  </p>
                </div>

                <div className="pt-2 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="text-xs h-9 cursor-pointer"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Volver a Editar
                  </Button>
                  <Button
                    onClick={handleFinishOnboarding}
                    disabled={isSavingFinish}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 cursor-pointer font-medium"
                  >
                    {isSavingFinish ? (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Guardando y Activando...
                      </>
                    ) : (
                      <>
                        Guardar y Probar en el Simulador
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
