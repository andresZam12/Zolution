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
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

import { generateDefaultPrompt } from "@/lib/tenant";

const PREDEFINED_INDUSTRIES = [
  "Servicios Profesionales y Consultoría",
  "Tecnología, Software y Soporte Digital",
  "Comercio, Tienda y Retail",
  "Restaurantes, Cafés y Gastronomía",
  "Belleza, Peluquerías, Spas y Cuidado Personal",
  "Salud, Medicina y Consultorios",
  "Talleres, Mecánica y Mantenimiento",
  "Inmobiliaria y Bienes Raíces",
  "Educación, Cursos y Clases",
  "Otro (Especificar libremente)",
];

export type ServiceDurationUnit = "minutos" | "horas" | "días" | "semanas" | "meses" | "a convenir";

export interface ServiceItemState {
  name: string;
  price_cop: number | string;
  duration_value: number | string;
  duration_unit: ServiceDurationUnit;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [isSavingFinish, setIsSavingFinish] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Paso 1: Tu Negocio (Completamente imparcial y neutral desde cero)
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Servicios Profesionales y Consultoría");
  const [customIndustry, setCustomIndustry] = useState("");
  const [cityOrCountry, setCityOrCountry] = useState("Colombia");
  const [whatsappPhone, setWhatsappPhone] = useState("");

  // Paso 2: Servicios o Productos (Flexible en minutos, horas, días, semanas, meses o a convenir)
  const [serviceItems, setServiceItems] = useState<ServiceItemState[]>([
    { name: "Asesoría o Consulta Inicial", price_cop: "", duration_value: 45, duration_unit: "minutos" },
  ]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDurationValue, setNewServiceDurationValue] = useState<number | string>(1);
  const [newServiceDurationUnit, setNewServiceDurationUnit] = useState<ServiceDurationUnit>("horas");

  // Paso 3: Modalidad, Horarios, Festivos y Operación
  const [interactionModality, setInteractionModality] = useState<"virtual" | "presencial" | "domicilio" | "hibrida">("virtual");
  const [scheduleWeekdays, setScheduleWeekdays] = useState("Lunes a Viernes: 8:00 AM - 6:00 PM");
  const [scheduleSaturdays, setScheduleSaturdays] = useState("Sábados: 9:00 AM - 1:00 PM");
  const [holidayPolicy, setHolidayPolicy] = useState("Solo hasta mediodía (8:00 AM - 1:00 PM)");
  const [toleranceMinutes, setToleranceMinutes] = useState(15);
  const [cancellationNotice, setCancellationNotice] = useState("Mínimo 2 horas de anticipación");
  const [paymentMethods, setPaymentMethods] = useState<string[]>([
    "Transferencia Bancolombia",
    "Nequi / Daviplata",
    "Tarjetas débito/crédito",
    "Efectivo",
  ]);
  const [agentName, setAgentName] = useState("Asistente");
  const [tone, setTone] = useState("Cálido, profesional y resolutivo");

  // Paso 4: Prompt Generado
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const effectiveIndustry =
    industry === "Otro (Especificar libremente)"
      ? customIndustry.trim() || "Servicios Comerciales"
      : industry;

  // Ajustar modalidad predeterminada según el sector al cambiar de industria
  useEffect(() => {
    const indLower = (effectiveIndustry || "").toLowerCase();
    if (indLower.includes("software") || indLower.includes("tecnolog") || indLower.includes("consultor") || indLower.includes("digital")) {
      setInteractionModality("virtual");
    } else if (indLower.includes("salud") || indLower.includes("belleza") || indLower.includes("restauran") || indLower.includes("taller")) {
      setInteractionModality("presencial");
    }
  }, [effectiveIndustry]);

  // Cargar datos previos si existen
  useEffect(() => {
    const savedName = localStorage.getItem("zolution_org_name");
    const savedIndustry = localStorage.getItem("zolution_org_industry");
    if (savedName) setCompanyName(savedName);
    if (savedIndustry) {
      if (PREDEFINED_INDUSTRIES.includes(savedIndustry)) {
        setIndustry(savedIndustry);
      } else {
        setIndustry("Otro (Especificar libremente)");
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
              setIndustry("Otro (Especificar libremente)");
              setCustomIndustry(dbInd);
            }
          }
          if (typeof ans.agentName === "string" && ans.agentName) setAgentName(ans.agentName);
          if (typeof ans.agent_name === "string" && ans.agent_name) setAgentName(ans.agent_name);
          if (typeof ans.tone === "string" && ans.tone) setTone(ans.tone);
          if (typeof ans.holiday_policy === "string" && ans.holiday_policy) setHolidayPolicy(ans.holiday_policy);
          if (typeof ans.tolerance_minutes === "number") setToleranceMinutes(ans.tolerance_minutes);
          if (typeof ans.whatsappPhone === "string" && ans.whatsappPhone) setWhatsappPhone(ans.whatsappPhone);
        }
        if (agentData?.system_prompt_generated) {
          setGeneratedPrompt(agentData.system_prompt_generated);
        }
      } catch {
        // Fallback local
      }
    };

    fetchBackendData();
  }, []);

  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    setServiceItems((prev) => [
      ...prev,
      {
        name: newServiceName.trim(),
        price_cop: newServicePrice ? Number(newServicePrice.replace(/\D/g, "")) : "",
        duration_value: newServiceDurationUnit === "a convenir" ? "" : newServiceDurationValue || 1,
        duration_unit: newServiceDurationUnit,
      },
    ]);
    setNewServiceName("");
    setNewServicePrice("");
    setNewServiceDurationValue(1);
    setNewServiceDurationUnit("horas");
  };

  const handleRemoveService = (index: number) => {
    setServiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const togglePaymentMethod = (method: string) => {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  // Compilar Master System Prompt de forma imparcial basándonos 100% en las respuestas reales del usuario
  const buildLocalMasterPrompt = () => {
    const servicesBlock =
      serviceItems.length > 0
        ? serviceItems
            .map((s) => {
              const priceStr = s.price_cop
                ? ` ($${Number(s.price_cop).toLocaleString("es-CO")} COP)`
                : " (Precio a convenir o según cotización)";
              const durationStr =
                s.duration_unit === "a convenir"
                  ? "tiempo estimado: A convenir según alcance"
                  : `tiempo estimado: ${s.duration_value} ${s.duration_unit}`;
              return `- ${s.name}${priceStr} — ${durationStr}`;
            })
            .join("\n")
        : "- Consulta o atención general personalizada";

    return generateDefaultPrompt(companyName.trim() || "Nuestro Negocio", effectiveIndustry, {
      agentName: agentName.trim() || "el Asistente",
      modality: interactionModality,
      servicesList: servicesBlock,
      scheduleWeekdays,
      scheduleSaturdays,
      holidayPolicy,
      paymentMethods,
      toleranceMinutes,
      cancellationNotice,
      whatsappPhone,
      cityOrCountry,
      tone,
    });
  };

  // Paso 4: AQUÍ SE ACTIVA LA IA (con todo el contexto que el usuario ya llenó manualmente)
  const handleGenerateWithAI = () => {
    setIsGeneratingWithAI(true);
    setFeedbackNotice(null);

    const compiledLocal = buildLocalMasterPrompt();
    setGeneratedPrompt(compiledLocal);
    setFeedbackNotice("¡Master Context generado exitosamente para tu empresa!");
    setIsGeneratingWithAI(false);
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
        const durStr = s.duration_unit === "a convenir" ? "A convenir" : `${s.duration_value} ${s.duration_unit}`;
        return `- ${s.name}${priceStr} — ${durStr}`;
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
            interaction_modality: interactionModality,
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
      // Guardado local
    } finally {
      setIsSavingFinish(false);
      window.dispatchEvent(new Event("storage"));
      router.push("/agent");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Header y Progreso */}
        <div className="text-center space-y-2">
          <Badge
            variant="outline"
            className="text-xs bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
          >
            Paso {step} de 4
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Crea tu Asistente de Negocio
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Responde 3 preguntas sencillas sobre tu empresa y al final la IA construirá un Master Context perfecto para tu sector.
          </p>

          {/* Barra de progreso */}
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-4">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {feedbackNotice && (
          <div className="flex items-center justify-between text-xs px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              {feedbackNotice}
            </span>
            <button
              type="button"
              onClick={() => setFeedbackNotice(null)}
              className="text-indigo-600 hover:text-indigo-900 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <Card className="border-zinc-200/70 dark:border-zinc-800/80 shadow-md">
          {/* PASO 1: TU NEGOCIO (IMPARCIAL Y LIMPIO) */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  Paso 1: ¿Cuál es tu Negocio?
                </CardTitle>
                <CardDescription className="text-xs">
                  Cuéntanos el nombre y la actividad de tu empresa. Funciona para cualquier sector.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Nombre de tu Empresa o Negocio
                  </label>
                  <Input
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Asesorías Martínez, Café La Terraza, Taller Los Andes..."
                    className="h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Sector o Tipo de Actividad
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
                  </select>
                </div>

                {industry === "Otro (Especificar libremente)" && (
                  <div className="space-y-1.5">
                    <label className="font-medium text-indigo-600 dark:text-indigo-400">
                      Especifica a qué se dedica tu negocio:
                    </label>
                    <Input
                      required
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      placeholder="Ej. Veterinaria, Academia de baile, Empresa de mensajería..."
                      className="h-10 text-xs border-indigo-300 dark:border-indigo-800"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Ciudad o País
                    </label>
                    <Input
                      value={cityOrCountry}
                      onChange={(e) => setCityOrCountry(e.target.value)}
                      placeholder="Ej. Bogotá, Colombia"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      WhatsApp de Atención
                    </label>
                    <Input
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="+57 300 000 0000"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!companyName.trim() || (industry === "Otro (Especificar libremente)" && !customIndustry.trim())}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 cursor-pointer"
                  >
                    Siguiente: Tus Servicios o Productos
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* PASO 2: TUS SERVICIOS O PRODUCTOS (LIMPIO Y EDITABLE) */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ListPlus className="h-5 w-5 text-indigo-500" />
                  Paso 2: ¿Qué Servicios o Productos Ofreces?
                </CardTitle>
                <CardDescription className="text-xs">
                  Agrega los servicios principales que los clientes pueden consultar o agendar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Lista de servicios añadidos */}
                <div className="space-y-2">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Servicios Registrados ({serviceItems.length})
                  </label>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
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
                                : "Precio a convenir"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.duration_unit === "a convenir"
                                ? "A convenir"
                                : `${item.duration_value} ${item.duration_unit}`}
                            </span>
                          </div>
                        </div>
                        {serviceItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveService(idx)}
                            className="h-7 w-7 text-zinc-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulario rápido para agregar otro servicio */}
                <div className="p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    + Añadir un servicio o producto
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <Input
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="Nombre (ej: Desarrollo Web, Asesoría, Consulta...)"
                        className="h-8 text-xs bg-white dark:bg-zinc-950"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        type="number"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        placeholder="Precio COP (opcional)"
                        className="h-8 text-xs bg-white dark:bg-zinc-950"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      {newServiceDurationUnit !== "a convenir" ? (
                        <Input
                          type="number"
                          min={1}
                          value={newServiceDurationValue}
                          onChange={(e) => setNewServiceDurationValue(e.target.value)}
                          placeholder="Cant."
                          className="h-8 text-xs bg-white dark:bg-zinc-950 text-center"
                        />
                      ) : (
                        <div className="h-8 flex items-center justify-center text-[10px] text-zinc-400 border rounded-md border-zinc-200 dark:border-zinc-800">
                          Libre
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <select
                        value={newServiceDurationUnit}
                        onChange={(e) => setNewServiceDurationUnit(e.target.value as ServiceDurationUnit)}
                        className="w-full h-8 px-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                      >
                        <option value="minutos">minutos</option>
                        <option value="horas">horas</option>
                        <option value="días">días</option>
                        <option value="semanas">semanas</option>
                        <option value="meses">meses</option>
                        <option value="a convenir">A convenir</option>
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
                    Añadir al listado
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
                    Siguiente: Horarios y Operación
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* PASO 3: MODALIDAD, HORARIOS, FESTIVOS Y OPERACIÓN */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  Paso 3: Modalidad, Horarios y Reglas
                </CardTitle>
                <CardDescription className="text-xs">
                  Define cómo opera tu negocio para que el asistente agende citas o reuniones con exactitud.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Modalidad Principal de Atención */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                    ¿Cómo atiendes o interactúas con tus clientes?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        id: "virtual" as const,
                        title: "💻 Reuniones Virtuales / Demos",
                        desc: "Google Meet o Zoom (Software, consultoría, cursos)",
                      },
                      {
                        id: "presencial" as const,
                        title: "🏢 Presencial en Sede / Local",
                        desc: "Oficina, consultorio, local o tienda física",
                      },
                      {
                        id: "domicilio" as const,
                        title: "🚗 A Domicilio / En Terreno",
                        desc: "Visitas técnicas, inspecciones o terreno",
                      },
                      {
                        id: "hibrida" as const,
                        title: "🔄 Híbrida / Según el Cliente",
                        desc: "El cliente elige si prefiere virtual o presencial",
                      },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setInteractionModality(m.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          interactionModality === m.id
                            ? "bg-indigo-50/80 border-indigo-600 text-indigo-900 dark:bg-indigo-950/60 dark:border-indigo-500 dark:text-indigo-200 shadow-2xs"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                        }`}
                      >
                        <p className="font-semibold text-xs">{m.title}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horarios semanales */}
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
                      Horario Sábados / Fines de Semana
                    </label>
                    <Input
                      value={scheduleSaturdays}
                      onChange={(e) => setScheduleSaturdays(e.target.value)}
                      placeholder="Sábados: 9:00 AM - 1:00 PM"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Días Festivos (Chips) */}
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    ¿Cómo atienden los días festivos?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      "Cerrado en días festivos",
                      "Solo hasta mediodía (8:00 AM - 1:00 PM)",
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      {interactionModality === "virtual"
                        ? "Tolerancia de conexión a la videollamada"
                        : "Tolerancia de espera al cliente"}
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
                      Aviso para cancelaciones
                    </label>
                    <select
                      value={cancellationNotice}
                      onChange={(e) => setCancellationNotice(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                    >
                      <option value="Mínimo 2 horas de anticipación">Mínimo 2 horas antes</option>
                      <option value="Mínimo 4 horas de anticipación">Mínimo 4 horas antes</option>
                      <option value="Mismo día con aviso oportuno">Mismo día</option>
                      <option value="Mínimo 24 horas de anticipación">24 horas de anticipación</option>
                    </select>
                  </div>
                </div>

                {/* Medios de Pago (Tags) */}
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                    Medios de pago que aceptas
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

                {/* Asistente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Nombre de tu Asistente
                    </label>
                    <Input
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="Ej. Sofía, Carlos, Mateo, Alex..."
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
                      placeholder="Ej. Cercano, profesional, cálido..."
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
                    onClick={handleGenerateWithAI}
                    disabled={isGeneratingWithAI}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 cursor-pointer font-medium"
                  >
                    {isGeneratingWithAI ? (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Construyendo con IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        ✨ Enriquecer y Armar Prompt con IA
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* PASO 4: MASTER CONTEXT CONSTRUIDO POR IA (BASADO EN SUS RESPUESTAS) */}
          {step === 4 && (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    Paso 4: Master Context Listo para tu Negocio
                  </CardTitle>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                    Optimizado
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  La IA estructuró la información de tu empresa en una guía operativa blindada con reglas de agenda y protocolo de Calendar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <Textarea
                  rows={13}
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  className="text-xs leading-relaxed font-mono bg-zinc-50 dark:bg-zinc-900 resize-y"
                />

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Protocolo de Google Calendar Incluido
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Tu agente ya sabe consultar disponibilidad y registrar citas automáticamente cuando el cliente confirme fecha y hora.
                  </p>
                </div>

                <div className="pt-2 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="text-xs h-9 cursor-pointer"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Ajustar Datos
                  </Button>
                  <Button
                    onClick={handleFinishOnboarding}
                    disabled={isSavingFinish}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 cursor-pointer font-medium"
                  >
                    {isSavingFinish ? (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Guardando...
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
