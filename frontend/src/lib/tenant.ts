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

export interface ActivityEvent {
  id: string;
  customer: string;
  action: string;
  time: string;
  tool: string;
  status: "success" | "info" | "warning";
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
      id: "dra-garcia-dental",
      slug: "dra-garcia-dental",
      name: "Clínica Dental & Estética Santa María",
      industry: "Salud y Cuidado Dental",
      email: "contacto@dentalcare.com",
    };
  }

  const id = localStorage.getItem("zolution_org_id") || "dra-garcia-dental";
  const slug = localStorage.getItem("zolution_org_slug") || id;
  const name = localStorage.getItem("zolution_org_name") || "Clínica Dental & Estética Santa María";
  const industry = localStorage.getItem("zolution_org_industry") || "Salud y Cuidado Dental";
  const email = localStorage.getItem("zolution_user_email") || `contacto@${slug || "empresa"}.com`;
  const prompt = localStorage.getItem("zolution_agent_prompt") || undefined;

  return { id, slug, name, industry, email, prompt };
}

export function detectIndustryCategory(industryStr: string, nameStr: string): "dental" | "legal" | "tech" | "spa" | "general" {
  const combined = `${industryStr} ${nameStr}`.toLowerCase();
  if (combined.includes("dental") || combined.includes("odontol") || combined.includes("médic") || combined.includes("salud")) {
    return "dental";
  }
  if (combined.includes("legal") || combined.includes("jurídic") || combined.includes("abogad") || combined.includes("ley")) {
    return "legal";
  }
  if (combined.includes("tech") || combined.includes("cloud") || combined.includes("soft") || combined.includes("tecnolog") || combined.includes("sistemas")) {
    return "tech";
  }
  if (combined.includes("spa") || combined.includes("wellness") || combined.includes("belleza") || combined.includes("estétic") || combined.includes("masaje")) {
    return "spa";
  }
  return "general";
}

export function generateDefaultPrompt(orgName: string, industry: string): string {
  const category = detectIndustryCategory(industry, orgName);

  if (category === "legal") {
    return `Eres Martín, el asistente virtual y recepcionista de ${orgName}.
Tu objetivo es atender a los clientes por WhatsApp con seriedad, empatía y confidencialidad, brindar información sobre las áreas de práctica y agendar consultas en Google Calendar.

Horario de atención del despacho:
- Lunes a Viernes: 8:00 AM - 6:00 PM
- Sábados: 9:00 AM - 1:00 PM

Instrucciones:
1. Comunícate en un tono formal, profesional y confiable.
2. Si el cliente solicita una consulta o asesoría, verifica primero la disponibilidad en el calendario antes de proponer horarios.
3. Cuando el cliente confirme la hora, solicita su nombre completo, correo y número de teléfono para dejar agendada la sesión en el calendario del despacho.
4. Recuerda que no emites conceptos jurídicos vinculantes sin previa revisión de los abogados del despacho.`;
  }

  if (category === "tech") {
    return `Eres Alex, el consultor y asistente virtual de ${orgName}.
Tu objetivo es atender prospectos por WhatsApp, resolver dudas sobre nuestros servicios tecnológicos y coordinar reuniones de diagnóstico en Google Calendar.

Horario de atención:
- Lunes a Viernes: 8:30 AM - 6:30 PM

Instrucciones:
1. Responde de manera ágil, clara y estructurada según la necesidad del cliente.
2. Verifica siempre los horarios disponibles en el calendario antes de proponer fechas para reuniones.
3. Una vez acordado el espacio y recopilados los datos del cliente, agenda la reunión directamente en el calendario del equipo.
4. Si la consulta involucra soporte urgente, indica los canales de atención prioritaria.`;
  }

  if (category === "spa") {
    return `Eres Camila, la anfitriona de bienestar y asistente virtual de ${orgName}.
Tu objetivo es guiar a nuestros clientes por WhatsApp con calidez, responder preguntas sobre rituales de spa, masajes y tratamientos faciales, y reservar sus citas en Google Calendar.

Horario de atención del spa:
- Martes a Domingo: 9:00 AM - 8:00 PM

Instrucciones:
1. Mantén una comunicación serena, elegante, cálida y acogedora.
2. Consulta siempre los turnos disponibles en el calendario antes de ofrecer horarios.
3. Al confirmar el servicio y los datos del cliente, registra la reserva en el calendario del spa.
4. Recomienda llegar 15 minutos antes de la sesión para disfrutar de una experiencia relajante.`;
  }

  if (category === "dental") {
    return `Eres Sofía, la asistente virtual de ${orgName}.
Tu objetivo es atender a los pacientes por WhatsApp con calidez, responder dudas sobre tratamientos dentales y agendar sus citas de manera sencilla.

Horario de atención:
- Lunes a Viernes: 8:00 AM - 6:00 PM
- Sábados: 9:00 AM - 1:00 PM

Instrucciones:
1. Sé cordial, empática y profesional.
2. Si el paciente pregunta por citas, revisa primero la disponibilidad en el calendario antes de ofrecer horarios.
3. Una vez el paciente elija un horario válido y confirme sus datos (nombre completo y teléfono), agenda la cita en Google Calendar.
4. Nunca ofrezcas un horario que ya esté ocupado en la agenda.`;
  }

  return `Eres el asistente virtual de ${orgName}.
Tu objetivo es atender a los clientes por WhatsApp con rapidez, resolver inquietudes sobre nuestros servicios (${industry}) y agendar citas o reuniones en Google Calendar.

Horario de atención:
- Lunes a Viernes: 8:00 AM - 6:00 PM
- Sábados: 9:00 AM - 1:00 PM

Instrucciones:
1. Comunícate en un tono profesional, cercano y claro.
2. Revisa la disponibilidad en tiempo real en el calendario antes de ofrecer horarios al cliente.
3. Al acordar la fecha y confirmar los datos de contacto, agenda la cita directamente en Google Calendar.
4. Proporciona siempre información transparente y ofrece comunicar con una persona del equipo cuando se requiera.`;
}

export function getTenantEvents(orgName: string, industry: string): ActivityEvent[] {
  const cat = detectIndustryCategory(industry, orgName);

  if (cat === "legal") {
    return [
      {
        id: "1",
        customer: "Dra. Carolina Méndez",
        action: "Cita confirmada para Revisión de Contrato Mercantil",
        time: "Hace 10 min",
        tool: "Cita agendada",
        status: "success",
      },
      {
        id: "2",
        customer: "Inversiones Bogotá SAS",
        action: "Consulta de horarios disponibles para asesoría",
        time: "Hace 28 min",
        tool: "Consulta de disponibilidad",
        status: "success",
      },
      {
        id: "3",
        customer: "Ricardo Alarcón",
        action: "Consulta sobre tarifas para trámite societario",
        time: "Hace 1 hora",
        tool: "Pregunta general",
        status: "info",
      },
      {
        id: "4",
        customer: "Valeria Duque",
        action: "Reagendamiento de sesión de asesoría laboral",
        time: "Hace 2 horas",
        tool: "Cita agendada",
        status: "success",
      },
    ];
  }

  if (cat === "tech") {
    return [
      {
        id: "1",
        customer: "Esteban Quiroga (PayTech)",
        action: "Reunión agendada para Diagnóstico de Servicios",
        time: "Hace 8 min",
        tool: "Cita agendada",
        status: "success",
      },
      {
        id: "2",
        customer: "Mariana Silva",
        action: "Consulta de horarios disponibles para demostración",
        time: "Hace 22 min",
        tool: "Consulta de disponibilidad",
        status: "success",
      },
      {
        id: "3",
        customer: "Andrés Velásquez",
        action: "Consulta sobre planes de soporte y tiempos de atención",
        time: "Hace 50 min",
        tool: "Pregunta general",
        status: "info",
      },
      {
        id: "4",
        customer: "Grupo Logística Global",
        action: "Reunión inicial reagendada en el calendario",
        time: "Hace 3 horas",
        tool: "Cita agendada",
        status: "success",
      },
    ];
  }

  if (cat === "spa") {
    return [
      {
        id: "1",
        customer: "Juliana Caicedo",
        action: "Reserva confirmada para Ritual Termal & Masaje Relajante",
        time: "Hace 15 min",
        tool: "Cita agendada",
        status: "success",
      },
      {
        id: "2",
        customer: "Mateo Cárdenas",
        action: "Consulta de disponibilidad de cabina doble para el sábado",
        time: "Hace 35 min",
        tool: "Consulta de disponibilidad",
        status: "success",
      },
      {
        id: "3",
        customer: "Daniela Osorio",
        action: "Pregunta sobre paquete especial y exfoliación",
        time: "Hace 1 hora",
        tool: "Pregunta general",
        status: "info",
      },
      {
        id: "4",
        customer: "Santiago Botero",
        action: "Turno confirmado para Tratamiento Facial Anti-stress",
        time: "Hace 2 horas",
        tool: "Cita agendada",
        status: "success",
      },
    ];
  }

  if (cat === "dental") {
    return [
      {
        id: "1",
        customer: "María Gómez",
        action: "Cita confirmada para Valoración Odontológica General",
        time: "Hace 12 min",
        tool: "Cita agendada",
        status: "success",
      },
      {
        id: "2",
        customer: "Carlos Rodríguez",
        action: "Consulta de horarios disponibles para el viernes",
        time: "Hace 34 min",
        tool: "Consulta de disponibilidad",
        status: "success",
      },
      {
        id: "3",
        customer: "Laura Restrepo",
        action: "Pregunta sobre tarifas de ortodoncia invisible",
        time: "Hace 1 hora",
        tool: "Pregunta general",
        status: "info",
      },
      {
        id: "4",
        customer: "Felipe Morales",
        action: "Cita reagendada para Limpieza Dental",
        time: "Hace 2 horas",
        tool: "Cita agendada",
        status: "success",
      },
    ];
  }

  return [
    {
      id: "1",
      customer: "Juan Camilo Rojas",
      action: `Cita confirmada para Asesoría con ${orgName}`,
      time: "Hace 14 min",
      tool: "Cita agendada",
      status: "success",
    },
    {
      id: "2",
      customer: "Empresa Aliada SAS",
      action: "Consulta de espacios disponibles en el calendario",
      time: "Hace 40 min",
      tool: "Consulta de disponibilidad",
      status: "success",
    },
    {
      id: "3",
      customer: "Diana Salazar",
      action: `Pregunta sobre servicios y tarifas de ${orgName}`,
      time: "Hace 1 hora",
      tool: "Pregunta general",
      status: "info",
    },
    {
      id: "4",
      customer: "Nicolás Pineda",
      action: "Reunión inicial agendada por WhatsApp",
      time: "Hace 2 horas",
      tool: "Cita agendada",
      status: "success",
    },
  ];
}

export function getTenantAppointments(orgName: string, industry: string): AppointmentItem[] {
  const cat = detectIndustryCategory(industry, orgName);

  if (cat === "legal") {
    return [
      {
        id: "apt-1",
        patientName: "Dr. Hernando Castro",
        phone: "+57 310 987 6543",
        service: "Asesoría Legal Corporativa & Contratos",
        date: "Jueves, 15 de Octubre 2026",
        time: "10:00 AM - 10:45 AM",
        status: "confirmed",
        googleEventId: "gc_evt_leg_01",
      },
      {
        id: "apt-2",
        patientName: "Claudia Patricia Marín",
        phone: "+57 314 888 1234",
        service: "Diagnóstico Jurídico y Trámite Notarial",
        date: "Viernes, 16 de Octubre 2026",
        time: "3:00 PM - 3:45 PM",
        status: "confirmed",
        googleEventId: "gc_evt_leg_02",
      },
      {
        id: "apt-3",
        patientName: "Consorcio Andino",
        phone: "+57 312 456 7890",
        service: "Revisión Contractual",
        date: "Lunes, 19 de Octubre 2026",
        time: "11:30 AM - 12:15 PM",
        status: "confirmed",
        googleEventId: "gc_evt_leg_03",
      },
    ];
  }

  if (cat === "tech") {
    return [
      {
        id: "apt-1",
        patientName: "Esteban Quiroga",
        phone: "+57 310 987 6543",
        service: "Sesión de Diagnóstico Tecnológico",
        date: "Jueves, 15 de Octubre 2026",
        time: "10:00 AM - 10:45 AM",
        status: "confirmed",
        googleEventId: "gc_evt_tch_01",
      },
      {
        id: "apt-2",
        patientName: "Mariana Silva",
        phone: "+57 314 888 1234",
        service: "Demostración de Soluciones Digitales",
        date: "Viernes, 16 de Octubre 2026",
        time: "2:00 PM - 2:45 PM",
        status: "confirmed",
        googleEventId: "gc_evt_tch_02",
      },
      {
        id: "apt-3",
        patientName: "Julián Morales",
        phone: "+57 312 456 7890",
        service: "Consultoría de Proyectos",
        date: "Lunes, 19 de Octubre 2026",
        time: "4:00 PM - 5:00 PM",
        status: "confirmed",
        googleEventId: "gc_evt_tch_03",
      },
    ];
  }

  if (cat === "spa") {
    return [
      {
        id: "apt-1",
        patientName: "Juliana Caicedo",
        phone: "+57 310 987 6543",
        service: "Ritual Termal & Masaje Descontracturante",
        date: "Jueves, 15 de Octubre 2026",
        time: "10:00 AM - 11:00 AM",
        status: "confirmed",
        googleEventId: "gc_evt_spa_01",
      },
      {
        id: "apt-2",
        patientName: "Mateo Cárdenas",
        phone: "+57 314 888 1234",
        service: "Circuito de Hidroterapia en Cabina Doble",
        date: "Viernes, 16 de Octubre 2026",
        time: "3:30 PM - 4:30 PM",
        status: "confirmed",
        googleEventId: "gc_evt_spa_02",
      },
      {
        id: "apt-3",
        patientName: "Daniela Osorio",
        phone: "+57 312 456 7890",
        service: "Tratamiento Facial Rejuvenecedor",
        date: "Sábado, 17 de Octubre 2026",
        time: "11:00 AM - 12:00 PM",
        status: "confirmed",
        googleEventId: "gc_evt_spa_03",
      },
    ];
  }

  if (cat === "dental") {
    return [
      {
        id: "apt-1",
        patientName: "María Gómez",
        phone: "+57 310 987 6543",
        service: "Valoración Odontológica General",
        date: "Jueves, 15 de Octubre 2026",
        time: "10:00 AM - 10:45 AM",
        status: "confirmed",
        googleEventId: "gc_evt_den_01",
      },
      {
        id: "apt-2",
        patientName: "Felipe Morales",
        phone: "+57 314 888 1234",
        service: "Limpieza Dental Profesional",
        date: "Viernes, 16 de Octubre 2026",
        time: "3:00 PM - 3:45 PM",
        status: "confirmed",
        googleEventId: "gc_evt_den_02",
      },
      {
        id: "apt-3",
        patientName: "Carlos Rodríguez",
        phone: "+57 312 456 7890",
        service: "Ortodoncia - Control Mensual",
        date: "Lunes, 19 de Octubre 2026",
        time: "11:30 AM - 12:15 PM",
        status: "confirmed",
        googleEventId: "gc_evt_den_03",
      },
    ];
  }

  return [
    {
      id: "apt-1",
      patientName: "Juan Camilo Rojas",
      phone: "+57 310 987 6543",
      service: `Reunión de Asesoría Inicial con ${orgName}`,
      date: "Jueves, 15 de Octubre 2026",
      time: "10:00 AM - 10:45 AM",
      status: "confirmed",
      googleEventId: "gc_evt_gen_01",
    },
    {
      id: "apt-2",
      patientName: "Paola Andrea Muñoz",
      phone: "+57 314 888 1234",
      service: "Presentación de Propuesta Comercial",
      date: "Viernes, 16 de Octubre 2026",
      time: "3:00 PM - 3:45 PM",
      status: "confirmed",
      googleEventId: "gc_evt_gen_02",
    },
    {
      id: "apt-3",
      patientName: "Empresa Asociada",
      phone: "+57 312 456 7890",
      service: "Sesión de Seguimiento",
      date: "Lunes, 19 de Octubre 2026",
      time: "11:30 AM - 12:15 PM",
      status: "confirmed",
      googleEventId: "gc_evt_gen_03",
    },
  ];
}

export function getTenantConversations(orgName: string, industry: string): ConversationSummary[] {
  const cat = detectIndustryCategory(industry, orgName);

  if (cat === "legal") {
    return [
      {
        id: "conv-1",
        customerName: "Dra. Carolina Méndez",
        phone: "+57 310 987 6543",
        lastMessage: "Confirmada la cita para el jueves a las 10:00 AM en el despacho.",
        time: "10:42 AM",
        status: "active",
        messages: [
          {
            id: "m1",
            role: "user",
            content: `Hola, buenos días. ¿Tienen disponibilidad en ${orgName} para una consulta sobre un contrato mercantil esta semana?`,
            time: "10:38 AM",
          },
          {
            id: "m2",
            role: "assistant",
            content: `¡Hola Carolina! Con gusto te colaboro. Déjame revisar la agenda de nuestros abogados para esta semana...`,
            time: "10:39 AM",
            toolCall: "Consulta de disponibilidad",
          },
          {
            id: "m3",
            role: "assistant",
            content: "Para este jueves tenemos espacio disponible a las 10:00 AM o a las 3:30 PM. ¿Cuál horario te conviene mejor?",
            time: "10:39 AM",
          },
          {
            id: "m4",
            role: "user",
            content: "Las 10:00 AM me queda muy bien, por favor.",
            time: "10:41 AM",
          },
          {
            id: "m5",
            role: "assistant",
            content: `¡Excelente! He agendado tu asesoría legal para el jueves a las 10:00 AM en el calendario de ${orgName}.`,
            time: "10:41 AM",
            toolCall: "Cita agendada",
          },
        ],
      },
    ];
  }

  if (cat === "tech") {
    return [
      {
        id: "conv-1",
        customerName: "Esteban Quiroga",
        phone: "+57 310 987 6543",
        lastMessage: "Listo, nos vemos en la reunión este jueves a las 10:00 AM.",
        time: "11:15 AM",
        status: "active",
        messages: [
          {
            id: "m1",
            role: "user",
            content: `Hola equipo de ${orgName}, buscamos asesoría para modernizar nuestra plataforma digital.`,
            time: "11:10 AM",
          },
          {
            id: "m2",
            role: "assistant",
            content: `¡Hola Esteban! Con gusto. Permíteme consultar la disponibilidad de nuestro equipo en el calendario...`,
            time: "11:11 AM",
            toolCall: "Consulta de disponibilidad",
          },
          {
            id: "m3",
            role: "assistant",
            content: "Podemos agendar una sesión este jueves a las 10:00 AM o el viernes a las 2:00 PM. ¿Qué opción prefieres?",
            time: "11:12 AM",
          },
          {
            id: "m4",
            role: "user",
            content: "Jueves a las 10:00 AM nos funciona muy bien.",
            time: "11:14 AM",
          },
          {
            id: "m5",
            role: "assistant",
            content: `¡Perfecto! He programado la sesión en Google Calendar para el jueves a las 10:00 AM. ¡Hablamos pronto!`,
            time: "11:14 AM",
            toolCall: "Cita agendada",
          },
        ],
      },
    ];
  }

  if (cat === "spa") {
    return [
      {
        id: "conv-1",
        customerName: "Juliana Caicedo",
        phone: "+57 310 987 6543",
        lastMessage: "¡Muchísimas gracias, allá estaré!",
        time: "09:30 AM",
        status: "active",
        messages: [
          {
            id: "m1",
            role: "user",
            content: `Hola, buenos días. Quisiera reservar un masaje relajante y circuito termal en ${orgName} para esta semana.`,
            time: "09:25 AM",
          },
          {
            id: "m2",
            role: "assistant",
            content: `¡Hola Juliana! Qué gusto saludarte. Permíteme revisar los turnos disponibles en nuestras cabinas...`,
            time: "09:26 AM",
            toolCall: "Consulta de disponibilidad",
          },
          {
            id: "m3",
            role: "assistant",
            content: "Para este jueves tenemos espacio disponible a las 10:00 AM o a las 4:00 PM. ¿Cuál prefieres para tu descanso?",
            time: "09:26 AM",
          },
          {
            id: "m4",
            role: "user",
            content: "A las 10:00 AM me encantaría.",
            time: "09:28 AM",
          },
          {
            id: "m5",
            role: "assistant",
            content: `¡Maravilloso! Tu reserva ha quedado confirmada en nuestro calendario para el jueves a las 10:00 AM. Te recomendamos llegar 15 minutos antes.`,
            time: "09:29 AM",
            toolCall: "Cita agendada",
          },
        ],
      },
    ];
  }

  if (cat === "dental") {
    return [
      {
        id: "conv-1",
        customerName: "María Gómez",
        phone: "+57 310 987 6543",
        lastMessage: "¡Perfecto, nos vemos el jueves a las 10:00 AM!",
        time: "10:42 AM",
        status: "active",
        messages: [
          {
            id: "m1",
            role: "user",
            content: "Hola, buenos días. ¿Tienen citas disponibles para valoración dental esta semana?",
            time: "10:38 AM",
          },
          {
            id: "m2",
            role: "assistant",
            content: "¡Hola María! Con mucho gusto te ayudo. Permíteme revisar la agenda disponible para esta semana...",
            time: "10:39 AM",
            toolCall: "Consulta de disponibilidad",
          },
          {
            id: "m3",
            role: "assistant",
            content: "Para este jueves tenemos espacio a las 10:00 AM o a las 3:30 PM. ¿Cuál de esos horarios se te acomoda mejor?",
            time: "10:39 AM",
          },
          {
            id: "m4",
            role: "user",
            content: "El de las 10:00 AM me queda perfecto.",
            time: "10:41 AM",
          },
          {
            id: "m5",
            role: "assistant",
            content: `¡Excelente! He confirmado tu cita para el jueves a las 10:00 AM en el calendario de ${orgName}.`,
            time: "10:41 AM",
            toolCall: "Cita agendada",
          },
        ],
      },
    ];
  }

  return [
    {
      id: "conv-1",
      customerName: "Juan Camilo Rojas",
      phone: "+57 310 987 6543",
      lastMessage: `Excelente, confirmada la reunión con ${orgName} para este jueves.`,
      time: "10:42 AM",
      status: "active",
      messages: [
        {
          id: "m1",
          role: "user",
          content: `Hola, buenos días. Quisiera conocer más información sobre sus servicios en ${orgName} y agendar una cita esta semana.`,
          time: "10:38 AM",
        },
        {
          id: "m2",
          role: "assistant",
          content: `¡Hola Juan Camilo! Con todo gusto te asesoramos. Permíteme revisar nuestra disponibilidad en el calendario...`,
          time: "10:39 AM",
          toolCall: "Consulta de disponibilidad",
        },
        {
          id: "m3",
          role: "assistant",
          content: "Tenemos espacio disponible para este jueves a las 10:00 AM o a las 3:30 PM. ¿Cuál horario te queda mejor?",
          time: "10:39 AM",
        },
        {
          id: "m4",
          role: "user",
          content: "A las 10:00 AM me parece ideal.",
          time: "10:41 AM",
        },
        {
          id: "m5",
          role: "assistant",
          content: `¡Listo! He agendado tu cita en el calendario de ${orgName} para el jueves a las 10:00 AM.`,
          time: "10:41 AM",
          toolCall: "Cita agendada",
        },
      ],
    },
  ];
}
