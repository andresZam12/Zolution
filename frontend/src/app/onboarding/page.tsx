"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ZabioLogo } from "@/components/zabio-logo";
import { Field, Notice, Rise } from "@/components/zabio-ui";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

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
    setFeedbackNotice(null);
    setIsGeneratingWithAI(false);
    setStep(4);
  };

  const handleFinishOnboarding = async () => {
    setIsSavingFinish(true);
    setFeedbackNotice(null);
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
      window.dispatchEvent(new Event("storage"));
      router.push("/agent");
    } catch {
      setFeedbackNotice("No se pudo guardar tu agente. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setIsSavingFinish(false);
    }
  };

  const stepCopy: Record<number, { kicker: string; title: string; text: string }> = {
    1: {
      kicker: "Tu negocio",
      title: "¿Cuál es tu negocio?",
      text: "Con esto tu agente sabrá a quién representa.",
    },
    2: {
      kicker: "Tus servicios",
      title: "¿Qué ofreces?",
      text: "Agrega lo que tus clientes pueden preguntar o agendar.",
    },
    3: {
      kicker: "Tu forma de atender",
      title: "¿Cómo atiendes?",
      text: "Para que tu agente agende con exactitud.",
    },
    4: {
      kicker: "Pruébalo",
      title: "Tu agente está listo",
      text: "Armamos estas instrucciones con tus respuestas. Puedes ajustarlas antes de guardar.",
    },
  };
  const current = stepCopy[step];

  const chipClass = (selected: boolean) =>
    cn(
      "cursor-pointer rounded-xl border p-3 text-left transition-all",
      selected
        ? "border-brand bg-brand-soft text-foreground"
        : "border-input bg-card text-muted-foreground hover:border-brand/50"
    );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <ZabioLogo size={28} />
        <span className="font-mono text-[0.72rem] text-muted-foreground">
          Paso {step} de 4
        </span>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className="h-1 overflow-hidden rounded-full bg-border">
            <span
              className={cn(
                "block h-full bg-brand transition-all duration-500 ease-out",
                n <= step ? "w-full" : "w-0"
              )}
            />
          </span>
        ))}
      </div>

      <div key={step} className="mt-10 flex-1">
        <Rise>
          <p className="z-kicker">/ {current.kicker}</p>
          <h1 className="z-title mt-2.5 text-4xl sm:text-5xl">{current.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{current.text}</p>
        </Rise>

        {feedbackNotice && (
          <Notice
            tone={step === 4 && !isSavingFinish ? "brand" : "danger"}
            onDismiss={() => setFeedbackNotice(null)}
            className="mt-5"
          >
            {feedbackNotice}
          </Notice>
        )}

        <Rise delay={100} className="z-card mt-7 space-y-5 p-5 sm:p-6">
          {/* PASO 1 */}
          {step === 1 && (
            <>
              <Field label="Nombre de tu negocio">
                <Input
                  required
                  autoFocus
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Asesorías Martínez, Café La Terraza..."
                />
              </Field>

              <Field label="Sector">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="z-select"
                >
                  {PREDEFINED_INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </Field>

              {industry === "Otro (Especificar libremente)" && (
                <Field label="¿A qué se dedica tu negocio?">
                  <Input
                    required
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    placeholder="Veterinaria, Academia de baile..."
                  />
                </Field>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Ciudad o país">
                  <Input
                    value={cityOrCountry}
                    onChange={(e) => setCityOrCountry(e.target.value)}
                    placeholder="Bogotá, Colombia"
                  />
                </Field>
                <Field label="WhatsApp de atención">
                  <Input
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+57 300 000 0000"
                  />
                </Field>
              </div>
            </>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <>
              <ul className="space-y-2">
                {serviceItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="z-rise flex items-center justify-between gap-3 rounded-xl bg-muted p-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{item.name}</span>
                      <span className="mt-0.5 flex items-center gap-2 font-mono text-[0.68rem] text-muted-foreground">
                        {item.price_cop
                          ? `$${Number(item.price_cop).toLocaleString("es-CO")} COP`
                          : "Precio a convenir"}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.duration_unit === "a convenir"
                            ? "A convenir"
                            : `${item.duration_value} ${item.duration_unit}`}
                        </span>
                      </span>
                    </span>
                    {serviceItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveService(idx)}
                        aria-label={`Quitar ${item.name}`}
                        className="hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>

              <div className="space-y-3 border-t border-border pt-5">
                <Field label="Agregar otro">
                  <Input
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="Nombre del servicio o producto"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Input
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    aria-label="Precio en pesos"
                    placeholder="Precio COP"
                    className="col-span-2"
                  />
                  {newServiceDurationUnit !== "a convenir" ? (
                    <Input
                      type="number"
                      min={1}
                      value={newServiceDurationValue}
                      onChange={(e) => setNewServiceDurationValue(e.target.value)}
                      aria-label="Duración"
                      className="text-center"
                    />
                  ) : (
                    <span className="grid h-10 place-items-center text-xs text-muted-foreground">
                      Libre
                    </span>
                  )}
                  <select
                    value={newServiceDurationUnit}
                    onChange={(e) => setNewServiceDurationUnit(e.target.value as ServiceDurationUnit)}
                    aria-label="Unidad de duración"
                    className="z-select"
                  >
                    <option value="minutos">minutos</option>
                    <option value="horas">horas</option>
                    <option value="días">días</option>
                    <option value="semanas">semanas</option>
                    <option value="meses">meses</option>
                    <option value="a convenir">A convenir</option>
                  </select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddService}
                  disabled={!newServiceName.trim()}
                >
                  <Plus />
                  Agregar a la lista
                </Button>
              </div>
            </>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <>
              <div className="space-y-1.5">
                <p className="text-[0.8rem] font-semibold">Modalidad</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    { id: "virtual" as const, title: "Virtual", desc: "Google Meet o Zoom" },
                    { id: "presencial" as const, title: "Presencial", desc: "En tu sede o local" },
                    { id: "domicilio" as const, title: "A domicilio", desc: "Visitas o trabajo en terreno" },
                    { id: "hibrida" as const, title: "Híbrida", desc: "El cliente elige" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={interactionModality === m.id}
                      onClick={() => setInteractionModality(m.id)}
                      className={chipClass(interactionModality === m.id)}
                    >
                      <span className="block text-sm font-bold text-foreground">{m.title}</span>
                      <span className="mt-0.5 block text-xs">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Lunes a viernes">
                  <Input
                    value={scheduleWeekdays}
                    onChange={(e) => setScheduleWeekdays(e.target.value)}
                    placeholder="Lunes a Viernes: 8:00 AM - 6:00 PM"
                  />
                </Field>
                <Field label="Fines de semana">
                  <Input
                    value={scheduleSaturdays}
                    onChange={(e) => setScheduleSaturdays(e.target.value)}
                    placeholder="Sábados: 9:00 AM - 1:00 PM"
                  />
                </Field>
              </div>

              <div className="space-y-1.5">
                <p className="text-[0.8rem] font-semibold">Días festivos</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    "Cerrado en días festivos",
                    "Solo hasta mediodía (8:00 AM - 1:00 PM)",
                    "Atención en jornada habitual",
                  ].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={holidayPolicy === opt}
                      onClick={() => setHolidayPolicy(opt)}
                      className={cn(chipClass(holidayPolicy === opt), "text-xs font-semibold")}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-[0.8rem] font-semibold">
                    {interactionModality === "virtual"
                      ? "Tolerancia para conectarse"
                      : "Tolerancia de espera"}
                  </p>
                  <div className="flex gap-2">
                    {[10, 15, 20].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        aria-pressed={toleranceMinutes === mins}
                        onClick={() => setToleranceMinutes(mins)}
                        className={cn(
                          chipClass(toleranceMinutes === mins),
                          "flex-1 px-1 py-2 text-center text-xs font-bold"
                        )}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="Aviso para cancelar">
                  <select
                    value={cancellationNotice}
                    onChange={(e) => setCancellationNotice(e.target.value)}
                    className="z-select"
                  >
                    <option value="Mínimo 2 horas de anticipación">2 horas antes</option>
                    <option value="Mínimo 4 horas de anticipación">4 horas antes</option>
                    <option value="Mismo día con aviso oportuno">Mismo día</option>
                    <option value="Mínimo 24 horas de anticipación">24 horas antes</option>
                  </select>
                </Field>
              </div>

              <div className="space-y-1.5">
                <p className="text-[0.8rem] font-semibold">Medios de pago</p>
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
                        aria-pressed={isSelected}
                        onClick={() => togglePaymentMethod(method)}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                          isSelected
                            ? "border-transparent bg-success-soft text-success"
                            : "border-input bg-card text-muted-foreground hover:border-brand/50"
                        )}
                      >
                        {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        {method}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nombre de tu agente">
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Sofía, Mateo, Alex..."
                  />
                </Field>
                <Field label="Tono">
                  <Input
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="Cercano, profesional, cálido..."
                  />
                </Field>
              </div>
            </>
          )}

          {/* PASO 4 */}
          {step === 4 && (
            <Textarea
              rows={14}
              value={generatedPrompt}
              onChange={(e) => setGeneratedPrompt(e.target.value)}
              aria-label="Instrucciones de tu agente"
              className="max-h-[28rem] min-h-72! resize-y leading-relaxed"
            />
          )}
        </Rise>

        <div className="mt-6 flex items-center justify-between gap-3 pb-6">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft />
              Atrás
            </Button>
          ) : (
            <span />
          )}

          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={
                !companyName.trim() ||
                (industry === "Otro (Especificar libremente)" && !customIndustry.trim())
              }
            >
              Siguiente
              <ArrowRight />
            </Button>
          )}
          {step === 2 && (
            <Button onClick={() => setStep(3)} disabled={serviceItems.length === 0}>
              Siguiente
              <ArrowRight />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleGenerateWithAI} disabled={isGeneratingWithAI}>
              Preparar mi agente
              <ArrowRight />
            </Button>
          )}
          {step === 4 && (
            <Button onClick={handleFinishOnboarding} disabled={isSavingFinish}>
              {isSavingFinish ? <RefreshCw className="animate-spin" /> : null}
              {isSavingFinish ? "Guardando..." : "Guardar y probarlo"}
              {!isSavingFinish && <ArrowRight />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
