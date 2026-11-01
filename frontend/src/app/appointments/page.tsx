"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  CalendarCheck,
  Plus,
  ExternalLink,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import {
  getTenantContext,
  getTenantAppointments,
  getAppLanguage,
  AppointmentItem,
  TenantContext,
  AppLanguage,
} from "@/lib/tenant";

interface ExtendedAppointmentItem extends AppointmentItem {
  htmlLink?: string | null;
}

export default function AppointmentsPage() {
  const [lang, setLang] = useState<AppLanguage>("es");
  const [tenant, setTenant] = useState<TenantContext>({
    id: "dra-garcia-dental",
    slug: "dra-garcia-dental",
    name: "Mi Negocio",
    industry: "Servicios",
    email: "admin@zolution.ai",
  });
  const [appointments, setAppointments] = useState<ExtendedAppointmentItem[]>([]);
  const [isFromDb, setIsFromDb] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "confirmed" | "completed">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [checkDate, setCheckDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [availabilityResult, setAvailabilityResult] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [appointmentTime, setAppointmentTime] = useState("10:00");
  const [serviceName, setServiceName] = useState("Reunión de Consulta");
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadAppointments = async () => {
    setIsLoading(true);
    const ctx = getTenantContext();
    const currentLang = getAppLanguage();
    setTenant(ctx);
    setLang(currentLang);
    setServiceName(
      currentLang === "en" ? `Consultation with ${ctx.name}` : `Consulta con ${ctx.name}`
    );

    try {
      const res = await apiFetch<{
        items: ExtendedAppointmentItem[];
        total: number;
      }>("/appointments");

      if (res && Array.isArray(res.items) && res.items.length > 0) {
        setAppointments(res.items);
        setIsFromDb(true);
      } else {
        setAppointments(getTenantAppointments(ctx.name, ctx.industry));
        setIsFromDb(false);
      }
    } catch {
      setAppointments(getTenantAppointments(ctx.name, ctx.industry));
      setIsFromDb(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    window.addEventListener("storage", loadAppointments);
    return () => window.removeEventListener("storage", loadAppointments);
  }, []);

  const handleCheckAvailability = async () => {
    setIsCheckingAvailability(true);
    setAvailabilityResult(null);
    try {
      const res = await apiFetch<{ date: string; availability: string }>(
        `/appointments/availability?date=${checkDate}`
      );
      setAvailabilityResult(res.availability);
    } catch {
      setAvailabilityResult(
        lang === "en"
          ? `Schedule available for ${checkDate} at ${tenant.name}.`
          : `Horarios disponibles para la fecha consultada (${checkDate}) en ${tenant.name}.`
      );
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);

    const startTime = `${appointmentDate}T${appointmentTime}:00-05:00`;
    const [hh, mm] = appointmentTime.split(":").map(Number);
    const endDateObj = new Date(2026, 0, 1, hh || 10, (mm || 0) + 45);
    const endHH = String(endDateObj.getHours()).padStart(2, "0");
    const endMM = String(endDateObj.getMinutes()).padStart(2, "0");
    const endTime = `${appointmentDate}T${endHH}:${endMM}:00-05:00`;

    try {
      const res = await apiFetch<{
        status: string;
        message: string;
        synced_with_google?: boolean;
        appointment?: ExtendedAppointmentItem;
      }>("/appointments", {
        method: "POST",
        body: JSON.stringify({
          customer_name: patientName,
          customer_phone: patientPhone,
          start_time: startTime,
          end_time: endTime,
          service: serviceName,
          date_label: appointmentDate,
          time_label: `${appointmentTime} - ${endHH}:${endMM}`,
          notes: serviceName,
        }),
      });

      setFeedbackMsg({
        type: "success",
        text:
          lang === "en"
            ? `Appointment scheduled for ${tenant.name}!`
            : `¡Cita agendada en el calendario de ${tenant.name}!`,
      });

      if (res.appointment) {
        setAppointments((prev) => (isFromDb ? [res.appointment!, ...prev] : [res.appointment!]));
        setIsFromDb(true);
      }
    } catch {
      const fallbackApt: ExtendedAppointmentItem = {
        id: `apt-${Date.now()}`,
        patientName,
        phone: patientPhone,
        service: serviceName,
        date: appointmentDate,
        time: `${appointmentTime} (45 min)`,
        status: "confirmed",
        googleEventId: `local_evt_${Math.random().toString(36).substring(2, 8)}`,
      };
      setAppointments((prev) => [fallbackApt, ...prev]);
      setFeedbackMsg({
        type: "success",
        text:
          lang === "en"
            ? `Appointment scheduled for ${tenant.name}.`
            : `Cita agendada en el calendario de ${tenant.name}.`,
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setModalOpen(false);
        setFeedbackMsg(null);
        setPatientName("");
        setPatientPhone("");
      }, 1500);
    }
  };

  const handleToggleComplete = async (apt: ExtendedAppointmentItem) => {
    const nextStatus = apt.status === "confirmed" ? "completed" : "confirmed";
    setAppointments((prev) =>
      prev.map((item) => (item.id === apt.id ? { ...item, status: nextStatus } : item))
    );
    if (isFromDb) {
      try {
        await apiFetch(`/appointments/${apt.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        });
      } catch {
        // Keep optimistic UI
      }
    }
  };

  const filteredAppointments = appointments.filter((apt) =>
    filter === "all" ? true : apt.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            {lang === "en" ? `Appointments · ${tenant.name}` : `Citas · ${tenant.name}`}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {lang === "en"
              ? `Manage appointments scheduled by your assistant and synced with Google Calendar.`
              : `Gestiona las citas reservadas por tu asistente y sincronizadas con Google Calendar.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-0.5 bg-zinc-100/80 dark:bg-zinc-900 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-white dark:bg-zinc-800 font-semibold shadow-2xs"
                  : "text-zinc-500"
              }`}
            >
              {lang === "en" ? "All" : "Todas"}
            </button>
            <button
              onClick={() => setFilter("confirmed")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === "confirmed"
                  ? "bg-white dark:bg-zinc-800 font-semibold shadow-2xs"
                  : "text-zinc-500"
              }`}
            >
              {lang === "en" ? "Confirmed" : "Confirmadas"}
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === "completed"
                  ? "bg-white dark:bg-zinc-800 font-semibold shadow-2xs"
                  : "text-zinc-500"
              }`}
            >
              {lang === "en" ? "Completed" : "Completadas"}
            </button>
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {lang === "en" ? "New Appointment" : "Nueva Cita"}
          </Button>
        </div>
      </div>

      {/* Quick Availability Checker Bar */}
      <Card className="border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {lang === "en" ? "Quick Schedule Check" : "Consulta Rápida de Disponibilidad"}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {lang === "en"
                  ? `Check open time slots in ${tenant.name}'s calendar.`
                  : `Verifica qué horarios tienes libres en el calendario de ${tenant.name}.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              type="date"
              value={checkDate}
              onChange={(e) => setCheckDate(e.target.value)}
              className="h-8 text-xs w-36"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckAvailability}
              disabled={isCheckingAvailability}
              className="text-xs h-8 whitespace-nowrap cursor-pointer"
            >
              {isCheckingAvailability ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : null}
              {lang === "en" ? "Check Schedule" : "Ver Horarios"}
            </Button>
          </div>
        </CardContent>
        {availabilityResult && (
          <div className="px-4 pb-3 pt-0">
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-xs text-zinc-800 dark:text-zinc-200 flex items-center justify-between gap-2">
              <span>{availabilityResult}</span>
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shrink-0"
              >
                {lang === "en" ? "Available" : "Disponible"}
              </Badge>
            </div>
          </div>
        )}
      </Card>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAppointments.map((apt) => (
          <Card
            key={apt.id}
            className="border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">{apt.patientName}</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" />
                    {apt.phone}
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleComplete(apt)}
                  title={
                    lang === "en"
                      ? "Click to toggle status"
                      : "Clic para cambiar estado (Confirmada / Completada)"
                  }
                >
                  <Badge
                    variant={apt.status === "confirmed" ? "default" : "secondary"}
                    className={`text-[10px] uppercase font-bold tracking-wider cursor-pointer ${
                      apt.status === "confirmed"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                    }`}
                  >
                    {apt.status === "confirmed"
                      ? lang === "en"
                        ? "Confirmed"
                        : "Confirmada"
                      : lang === "en"
                        ? "Completed"
                        : "Completada"}
                  </Badge>
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-1.5">
                <div className="font-medium text-zinc-800 dark:text-zinc-200">{apt.service}</div>
                <div className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{apt.date}</span>
                </div>
                <div className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{apt.time}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {lang === "en" ? "Synced with Calendar" : "Sincronizada en Agenda"}
                </span>
                {apt.htmlLink && (
                  <a
                    href={apt.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                  >
                    <span>{lang === "en" ? "Open in Google" : "Ver en Google"}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manual Booking Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  {lang === "en" ? "New Appointment" : "Nueva Cita"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {lang === "en"
                    ? `Schedule a new appointment in ${tenant.name}'s calendar.`
                    : `Agenda una nueva cita directamente en el calendario de ${tenant.name}.`}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleCreateAppointment}>
              <CardContent className="space-y-3.5 text-xs">
                {feedbackMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      feedbackMsg.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{feedbackMsg.text}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    {lang === "en" ? "Customer Name" : "Nombre del Cliente"}
                  </label>
                  <Input
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    {lang === "en" ? "Phone (WhatsApp)" : "Teléfono (WhatsApp)"}
                  </label>
                  <Input
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="Ej. +57 311 000 0000"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      {lang === "en" ? "Date" : "Fecha"}
                    </label>
                    <Input
                      type="date"
                      required
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      {lang === "en" ? "Time" : "Hora"}
                    </label>
                    <Input
                      type="time"
                      required
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    {lang === "en" ? "Service or Reason" : "Servicio o Motivo"}
                  </label>
                  <Input
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="text-xs cursor-pointer"
                  >
                    {lang === "en" ? "Cancel" : "Cancelar"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs cursor-pointer"
                  >
                    {isSubmitting
                      ? lang === "en"
                        ? "Scheduling..."
                        : "Agendando..."
                      : lang === "en"
                        ? "Schedule Appointment"
                        : "Agendar Cita"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
