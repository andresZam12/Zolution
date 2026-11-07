"use client";

import React, { useState, useEffect } from "react";
import {
  Ban,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  Notice,
  PageHeader,
  Rise,
  Segmented,
} from "@/components/zabio-ui";
import { apiFetch } from "@/lib/api";
import { fromTime12h, Time12h, toTime12h } from "@/lib/time";
import {
  getTenantContext,
  getAppLanguage,
  AppointmentItem,
  TenantContext,
  AppLanguage,
} from "@/lib/tenant";

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => index * 5);
const TIME_SELECT_CLASS =
  "z-select px-1.5";

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
  const [loadFailed, setLoadFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "confirmed" | "completed">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [checkDate, setCheckDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [availabilityResult, setAvailabilityResult] = useState<string | null>(null);
  const [availabilityFailed, setAvailabilityFailed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: "cancel" | "delete";
    apt: ExtendedAppointmentItem;
  } | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [appointmentTime, setAppointmentTime] = useState("10:00");
  const selectedTime = toTime12h(appointmentTime);
  const updateTime = (change: Partial<Time12h>) =>
    setAppointmentTime(fromTime12h({ ...selectedTime, ...change }));
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

      setAppointments(res.items);
      setLoadFailed(false);
    } catch {
      setAppointments([]);
      setLoadFailed(true);
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
    setAvailabilityFailed(false);
    try {
      const res = await apiFetch<{ date: string; availability: string }>(
        `/appointments/availability?date=${checkDate}`
      );
      setAvailabilityResult(res.availability);
    } catch {
      setAvailabilityFailed(true);
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
        setAppointments((prev) => [res.appointment!, ...prev]);
      }

      setTimeout(() => {
        setModalOpen(false);
        setFeedbackMsg(null);
        setPatientName("");
        setPatientPhone("");
      }, 1500);
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : lang === "en"
              ? "The appointment could not be scheduled."
              : "No se pudo agendar la cita.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showActionError = (err: unknown, fallback: { en: string; es: string }) => {
    setActionError(err instanceof Error ? err.message : lang === "en" ? fallback.en : fallback.es);
  };

  const updateStatus = async (
    apt: ExtendedAppointmentItem,
    status: ExtendedAppointmentItem["status"]
  ) => {
    try {
      await apiFetch(`/appointments/${apt.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setAppointments((prev) =>
        prev.map((item) => (item.id === apt.id ? { ...item, status } : item))
      );
    } catch (err: unknown) {
      showActionError(err, {
        en: "The appointment could not be updated.",
        es: "No se pudo actualizar la cita.",
      });
    }
  };

  const handleToggleComplete = (apt: ExtendedAppointmentItem) =>
    updateStatus(apt, apt.status === "confirmed" ? "completed" : "confirmed");

  const handleDeleteAppointment = async (apt: ExtendedAppointmentItem) => {
    try {
      await apiFetch(`/appointments/${apt.id}`, { method: "DELETE" });
      setAppointments((prev) => prev.filter((item) => item.id !== apt.id));
    } catch (err: unknown) {
      showActionError(err, {
        en: "The appointment could not be deleted.",
        es: "No se pudo eliminar la cita.",
      });
    }
  };

  const handleConfirmPendingAction = () => {
    if (!pendingAction) return;
    const { type, apt } = pendingAction;
    setPendingAction(null);
    setActionError(null);
    if (type === "cancel") updateStatus(apt, "cancelled");
    else handleDeleteAppointment(apt);
  };

  const filteredAppointments = appointments.filter((apt) =>
    filter === "all" ? true : apt.status === filter
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={lang === "en" ? "Appointments" : "Citas"}
        title={
          lang === "en" ? (
            <>
              Your schedule, <em>in order.</em>
            </>
          ) : (
            <>
              Tu agenda, <em>en orden.</em>
            </>
          )
        }
        description={
          lang === "en"
            ? "What your agent booked, and what you add yourself."
            : "Lo que tu agente agendó y lo que agregues tú."
        }
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus />
            {lang === "en" ? "New appointment" : "Nueva cita"}
          </Button>
        }
      />

      {actionError && (
        <Notice tone="danger" onDismiss={() => setActionError(null)}>
          {actionError}
        </Notice>
      )}

      {/* Barra de herramientas */}
      <Rise delay={80} className="z-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={filter}
          onChange={setFilter}
          className="sm:w-fit"
          options={[
            { value: "all", label: lang === "en" ? "All" : "Todas" },
            { value: "confirmed", label: lang === "en" ? "Confirmed" : "Confirmadas" },
            { value: "completed", label: lang === "en" ? "Completed" : "Completadas" },
          ]}
        />

        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">
            {lang === "en" ? "Free slots on" : "Horarios libres el"}
          </span>
          <Input
            type="date"
            value={checkDate}
            onChange={(e) => setCheckDate(e.target.value)}
            aria-label={lang === "en" ? "Date to check" : "Fecha a consultar"}
            className="h-9 w-auto min-w-0 flex-1 rounded-full sm:flex-none"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCheckAvailability}
            disabled={isCheckingAvailability}
          >
            {isCheckingAvailability && <RefreshCw className="animate-spin" />}
            {lang === "en" ? "Check" : "Consultar"}
          </Button>
        </div>
      </Rise>

      {availabilityResult && (
        <Notice tone="brand" onDismiss={() => setAvailabilityResult(null)}>
          {availabilityResult}
        </Notice>
      )}
      {availabilityFailed && (
        <Notice tone="danger" onDismiss={() => setAvailabilityFailed(false)}>
          {lang === "en"
            ? "Availability could not be checked. Please try again."
            : "No se pudo consultar la disponibilidad. Intenta de nuevo."}
        </Notice>
      )}

      {loadFailed && (
        <Notice tone="danger">
          {lang === "en"
            ? "Appointments could not be loaded. Please try again."
            : "No se pudieron cargar las citas. Intenta de nuevo."}
        </Notice>
      )}

      {isLoading && appointments.length === 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          <div className="z-shimmer h-44 rounded-2xl" />
          <div className="z-shimmer h-44 rounded-2xl" />
          <div className="z-shimmer h-44 rounded-2xl" />
        </div>
      )}

      {filteredAppointments.length === 0 && !isLoading && !loadFailed && (
        <EmptyState
          icon={CalendarCheck}
          title={lang === "en" ? "Nothing here yet" : "Todavía no hay citas aquí"}
          description={
            lang === "en"
              ? "When your agent books one, you will see it here."
              : "Cuando tu agente agende una, la verás aquí."
          }
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAppointments.map((apt, index) => {
          const isCancelled = apt.status === "cancelled";
          const inCalendar = Boolean(apt.googleEventId);
          return (
            <Rise key={apt.id} delay={Math.min(index, 8) * 50}>
              <article
                className="z-card z-card-hover flex h-full flex-col overflow-hidden p-5"
              >
                <div
                  className={`-mx-5 -mt-5 flex items-start justify-between gap-3 px-5 py-4 ${
                    apt.status === "confirmed"
                      ? "z-tone-green"
                      : apt.status === "completed"
                        ? "z-tone-coffee"
                        : "z-tone-stone"
                  }`}
                >
                  <div className="min-w-0">
                    <h2 className="z-title truncate text-xl">{apt.patientName}</h2>
                    <p className="mt-1 flex items-center gap-1.5 font-mono text-[0.7rem] opacity-85">
                      <Phone className="h-3 w-3" />
                      <span className="truncate">{apt.phone}</span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
                    {apt.status === "confirmed"
                      ? lang === "en"
                        ? "Confirmed"
                        : "Confirmada"
                      : apt.status === "completed"
                        ? lang === "en"
                          ? "Completed"
                          : "Completada"
                        : lang === "en"
                          ? "Cancelled"
                          : "Cancelada"}
                  </span>
                </div>

                <p className="mt-4 font-bold">{apt.service}</p>
                <div className="mt-3 grid flex-1 grid-cols-1 content-start gap-2 text-sm">
                  <p className="flex items-center gap-2.5 rounded-xl bg-muted px-3 py-2 font-semibold">
                    <Calendar className="h-4 w-4 text-brand" />
                    {apt.date}
                  </p>
                  <p className="flex items-center gap-2.5 rounded-xl bg-muted px-3 py-2 font-semibold">
                    <Clock className="h-4 w-4 text-brand" />
                    {apt.time}
                  </p>
                </div>

                {!isCancelled && (
                  <p className="mt-3 text-xs">
                    {apt.htmlLink ? (
                      <a
                        href={apt.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-success underline-offset-4 hover:underline"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {lang === "en" ? "In Google Calendar" : "En Google Calendar"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : inCalendar ? (
                      <span className="inline-flex items-center gap-1 font-bold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {lang === "en" ? "In Google Calendar" : "En Google Calendar"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {lang === "en" ? "Only saved in Zabio" : "Guardada solo en Zabio"}
                      </span>
                    )}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                  {isCancelled ? (
                    <span />
                  ) : (
                    <Button size="xs" variant="ghost" onClick={() => handleToggleComplete(apt)}>
                      {apt.status === "confirmed" ? <CheckCircle2 /> : <RotateCcw />}
                      {apt.status === "confirmed"
                        ? lang === "en"
                          ? "Mark completed"
                          : "Marcar completada"
                        : lang === "en"
                          ? "Back to confirmed"
                          : "Volver a confirmada"}
                    </Button>
                  )}
                  <span className="flex items-center gap-0.5">
                    {!isCancelled && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setPendingAction({ type: "cancel", apt })}
                        title={lang === "en" ? "Cancel appointment" : "Cancelar cita"}
                        aria-label={lang === "en" ? "Cancel appointment" : "Cancelar cita"}
                        className="hover:bg-danger-soft hover:text-danger"
                      >
                        <Ban className="size-5" />
                      </Button>
                    )}
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setPendingAction({ type: "delete", apt })}
                      title={lang === "en" ? "Delete appointment" : "Eliminar cita"}
                      aria-label={lang === "en" ? "Delete appointment" : "Eliminar cita"}
                      className="hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </span>
                </div>
              </article>
            </Rise>
          );
        })}
      </div>

      {pendingAction && (
        <ConfirmDialog
          title={
            pendingAction.type === "cancel"
              ? lang === "en"
                ? "Cancel this appointment?"
                : "¿Cancelar esta cita?"
              : lang === "en"
                ? "Delete this appointment?"
                : "¿Eliminar esta cita?"
          }
          description={
            pendingAction.type === "cancel"
              ? lang === "en"
                ? `The time of ${pendingAction.apt.patientName} will be freed and removed from Google Calendar.`
                : `El horario de ${pendingAction.apt.patientName} quedará libre y se quitará de Google Calendar.`
              : lang === "en"
                ? "It will be removed permanently, also from Google Calendar."
                : "Se borrará definitivamente, también de Google Calendar."
          }
          confirmLabel={
            pendingAction.type === "cancel"
              ? lang === "en"
                ? "Yes, cancel"
                : "Sí, cancelar"
              : lang === "en"
                ? "Yes, delete"
                : "Sí, eliminar"
          }
          cancelLabel={lang === "en" ? "Keep it" : "Mantener"}
          onCancel={() => setPendingAction(null)}
          onConfirm={handleConfirmPendingAction}
        />
      )}

      {/* Nueva cita */}
      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} labelledBy="new-appointment-title" className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="z-kicker">/ {lang === "en" ? "Schedule" : "Agenda"}</p>
              <h2 id="new-appointment-title" className="z-title mt-1.5 text-3xl">
                {lang === "en" ? "New appointment" : "Nueva cita"}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setModalOpen(false)}
              aria-label={lang === "en" ? "Close" : "Cerrar"}
            >
              <X />
            </Button>
          </div>

          <form onSubmit={handleCreateAppointment} className="mt-5 space-y-4">
            {feedbackMsg && <Notice tone={feedbackMsg.type === "success" ? "success" : "danger"}>{feedbackMsg.text}</Notice>}

            <Field label={lang === "en" ? "Customer" : "Cliente"}>
              <Input
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Juan Pérez"
              />
            </Field>

            <Field label="WhatsApp">
              <Input
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+57 311 000 0000"
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={lang === "en" ? "Date" : "Fecha"}>
                <Input
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </Field>
              <div className="space-y-1.5">
                <span className="text-[0.8rem] font-semibold">{lang === "en" ? "Time" : "Hora"}</span>
                <div className="flex items-center gap-1">
                  <select
                    aria-label={lang === "en" ? "Hour" : "Hora"}
                    value={selectedTime.hour}
                    onChange={(e) => updateTime({ hour: Number(e.target.value) })}
                    className={TIME_SELECT_CLASS}
                  >
                    {HOUR_OPTIONS.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={lang === "en" ? "Minutes" : "Minutos"}
                    value={selectedTime.minute}
                    onChange={(e) => updateTime({ minute: Number(e.target.value) })}
                    className={TIME_SELECT_CLASS}
                  >
                    {MINUTE_OPTIONS.map((minute) => (
                      <option key={minute} value={minute}>
                        {String(minute).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="AM / PM"
                    value={selectedTime.period}
                    onChange={(e) => updateTime({ period: e.target.value as Time12h["period"] })}
                    className={TIME_SELECT_CLASS}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <Field label={lang === "en" ? "Service" : "Servicio"}>
              <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
            </Field>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                {lang === "en" ? "Cancel" : "Cancelar"}
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting
                  ? lang === "en"
                    ? "Scheduling..."
                    : "Agendando..."
                  : lang === "en"
                    ? "Schedule"
                    : "Agendar cita"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
