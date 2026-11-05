export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  industry: string;
  email: string;
  prompt?: string;
}

export type AppLanguage = "es" | "en";

export function getAppLanguage(): AppLanguage {
  if (typeof window === "undefined") return "es";
  const saved = localStorage.getItem("zolution_lang");
  return saved === "en" ? "en" : "es";
}

export function formatToolLabel(tool: string, lang: AppLanguage = "es"): string {
  const clean = (tool || "").toLowerCase();
  if (clean.includes("cancel_appointment") || clean.includes("cancel")) {
    return lang === "en" ? "Appointment cancelled" : "Cita cancelada";
  }
  if (clean.includes("reschedule_appointment") || clean.includes("reprogram") || clean.includes("reschedule")) {
    return lang === "en" ? "Appointment rescheduled" : "Cita reprogramada";
  }
  if (clean.includes("book_appointment") || clean.includes("cita agendada") || clean.includes("appointment")) {
    return lang === "en" ? "Appointment booked" : "Cita agendada";
  }
  if (clean.includes("check_availability") || clean.includes("disponibilidad") || clean.includes("availability")) {
    return lang === "en" ? "Availability check" : "Consulta de disponibilidad";
  }
  if (clean.includes("llm_answer") || clean.includes("pregunta") || clean.includes("general")) {
    return lang === "en" ? "General inquiry" : "Pregunta general";
  }
  return lang === "en" ? "General inquiry" : "Pregunta general";
}

export interface AppointmentItem {
  id: string;
  patientName: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: "confirmed" | "completed" | "cancelled";
  googleEventId: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  time?: string;
  toolCall?: string;
}

export interface ConversationSummary {
  id: string;
  customerName: string;
  phone: string;
  lastMessage: string;
  time: string;
  status: string;
  messages: ConversationMessage[];
}

export function getTenantContext(): TenantContext {
  if (typeof window === "undefined") {
    return {
      id: "mi-empresa",
      slug: "mi-empresa",
      name: "Mi Empresa",
      industry: "Servicios y Consultoría",
      email: "contacto@miempresa.com",
    };
  }

  const id = localStorage.getItem("zolution_org_id") || "mi-empresa";
  const slug = localStorage.getItem("zolution_org_slug") || id;
  const name = localStorage.getItem("zolution_org_name") || "Mi Empresa";
  const industry = localStorage.getItem("zolution_org_industry") || "Servicios y Consultoría";
  const email = localStorage.getItem("zolution_user_email") || `contacto@${slug || "empresa"}.com`;
  const prompt = localStorage.getItem("zolution_agent_prompt") || undefined;

  return { id, slug, name, industry, email, prompt };
}

export function detectIndustryCategory(industryStr: string, nameStr: string): "dental" | "legal" | "tech" | "spa" | "general" {
  const combined = `${industryStr} ${nameStr}`.toLowerCase();
  if (combined.includes("dental") || combined.includes("odontol") || combined.includes("ortodon")) {
    return "dental";
  }
  if (combined.includes("legal") || combined.includes("jurídic") || combined.includes("abogad") || combined.includes("ley")) {
    return "legal";
  }
  if (combined.includes("tech") || combined.includes("cloud") || combined.includes("soft") || combined.includes("tecnolog") || combined.includes("sistemas") || combined.includes("digital") || combined.includes("desarrollo")) {
    return "tech";
  }
  if (combined.includes("spa") || combined.includes("wellness") || combined.includes("belleza") || combined.includes("estétic") || combined.includes("masaje") || combined.includes("peluquer")) {
    return "spa";
  }
  return "general";
}

export interface PromptBuildOptions {
  agentName?: string;
  modality?: "virtual" | "presencial" | "domicilio" | "hibrida";
  servicesList?: string;
  scheduleWeekdays?: string;
  scheduleSaturdays?: string;
  holidayPolicy?: string;
  paymentMethods?: string[];
  toleranceMinutes?: number;
  cancellationNotice?: string;
  whatsappPhone?: string;
  cityOrCountry?: string;
  tone?: string;
}

export function generateDefaultPrompt(
  orgName: string,
  industry: string,
  opts?: PromptBuildOptions
): string {
  const cleanName = orgName?.trim() || "Nuestro Negocio";
  const cleanInd = industry?.trim() || "Servicios Comerciales y Profesionales";
  const agentName = opts?.agentName || "el Asistente";
  const modality = opts?.modality || (detectIndustryCategory(cleanInd, cleanName) === "tech" ? "virtual" : "presencial");

  const servicesBlock = opts?.servicesList || `
- Consulta o Asesoría Inicial personalizada
- Servicio Estándar según requerimiento del cliente
- Proyecto o Solución Integral a la medida`.trim();

  const weekdays = opts?.scheduleWeekdays || "Lunes a Viernes: 8:00 AM - 6:00 PM";
  const saturdays = opts?.scheduleSaturdays || "Sábados: 9:00 AM - 1:00 PM";
  const holiday = opts?.holidayPolicy || "Atención en días festivos solo hasta mediodía (8:00 AM - 1:00 PM) o con previa reserva";
  const payments = opts?.paymentMethods?.length
    ? opts.paymentMethods.join(", ")
    : "Transferencias bancarias, Nequi, Daviplata, Tarjetas y Efectivo";
  const tolerance = opts?.toleranceMinutes ?? 15;
  const cancellation = opts?.cancellationNotice || "Avisar con al menos 2 horas de anticipación";
  const location = opts?.cityOrCountry ? `**Ubicación:** ${opts.cityOrCountry}\n` : "";
  const phone = opts?.whatsappPhone ? ` Canal oficial: ${opts.whatsappPhone}.` : "";
  const tone = opts?.tone || "Cálido, profesional y resolutivo";

  const modalityDescriptions = {
    virtual: "Modalidad: 100% Virtual / Remota (Reuniones por Google Meet / Zoom)",
    presencial: "Modalidad: Presencial en nuestras instalaciones / oficinas",
    domicilio: "Modalidad: A Domicilio / En terreno con visita técnica previa",
    hibrida: "Modalidad: Híbrida (Virtual o Presencial a elección del cliente)",
  };

  const meetingActionRules = {
    virtual: `- Tipo de agendamiento: REUNIÓN VIRTUAL / DEMO (Google Meet).
- Al confirmar la reunión, solicita amablemente el correo electrónico del cliente para enviarle el link de Google Meet.
- Tolerancia de conexión a la videollamada: ${tolerance} minutos antes de reprogramar.`,
    presencial: `- Tipo de agendamiento: CITA PRESENCIAL en nuestras instalaciones.
- Tolerancia de espera en sede: ${tolerance} minutos.`,
    domicilio: `- Tipo de agendamiento: VISITA A DOMICILIO / EN TERRENO.
- Confirma siempre la dirección exacta y punto de referencia.`,
    hibrida: `- Tipo de agendamiento: REUNIÓN O CITA (Pregunta al cliente si prefiere Virtual por Google Meet o Presencial).
- Tolerancia de espera / conexión: ${tolerance} minutos.`,
  };

  return `## 1. ROL Y ALCANCE
Eres ${agentName}, el asistente virtual oficial de ${cleanName}. Tu función principal es atender a prospectos y clientes por WhatsApp con cercanía, resolver dudas sobre nuestros servicios o productos (${cleanInd}), brindar información de tarifas o tiempos de entrega y agendar reuniones o citas en Google Calendar.

## 2. DATOS DEL NEGOCIO
**Nombre de la Empresa:** ${cleanName}
**Sector / Actividad:** ${cleanInd}
${location}**${modalityDescriptions[modality]}**

**Catálogo de Servicios / Productos y Tiempos:**
${servicesBlock}

**Horarios de Atención:**
- ${weekdays}
- ${saturdays}
- **Días Festivos:** ${holiday}

**Políticas de Operación y Pagos:**
- **Cancelaciones / Cambios:** ${cancellation}
${meetingActionRules[modality]}
- **Medios de Pago Aceptados:** ${payments}

## 3. REGLAS DE ATENCIÓN Y TONO
1. Hablas directamente por WhatsApp en un tono ${tone}.
2. Sé conciso: máximo 2 a 3 oraciones breves por mensaje, facilitando una lectura ágil en dispositivos móviles.
3. Si el cliente saluda (ej: 'hola', 'buenas'), salúdalo amablemente, preséntate brevemente y pregúntale en qué le puedes colaborar hoy.
4. Responde estrictamente sobre la actividad y servicios de ${cleanName}. Si te preguntan por temas no relacionados, aclara con educación que estás enfocado en la atención de este negocio.
5. Si el cliente pregunta por disponibilidad en días festivos, responde aplicando la regla: "${holiday}".

## 4. PROTOCOLO OBLIGATORIO DE AGENDAMIENTO (GOOGLE CALENDAR)
- Cuando el cliente solicite disponibilidad o una cita/reunión, propón 2 opciones lógicas dentro del horario de atención (ej: 10:00 AM o 3:30 PM).
- En cuanto el cliente elija o confirme la fecha y hora, confirma con entusiasmo la reserva y coloca SIEMPRE al final exacto de tu respuesta el comando:
[[AGENDAR|YYYY-MM-DD|HH:MM|Nombre del cliente|Servicio o Asunto]]

## 5. ESCALACIÓN HUMANA
Si el cliente tiene un caso complejo fuera del catálogo estándar o solicita hablar con una persona, escálalo cordialmente indicando que un asesor del equipo se comunicará en breve.${phone}`.trim();
}
