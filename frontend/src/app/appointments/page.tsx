"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  CalendarCheck,
  Plus,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Appointment {
  id: string;
  patientName: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: "confirmed" | "completed" | "cancelled";
  googleEventId: string;
}

const mockAppointments: Appointment[] = [
  {
    id: "apt-1",
    patientName: "María Gómez",
    phone: "+57 310 987 6543",
    service: "Consulta General & Valoración",
    date: "Jueves, 8 de Octubre 2026",
    time: "10:00 AM - 10:45 AM",
    status: "confirmed",
    googleEventId: "gc_evt_9981248a",
  },
  {
    id: "apt-2",
    patientName: "Felipe Morales",
    phone: "+57 314 888 1234",
    service: "Limpieza Dental con Ultrasonido",
    date: "Viernes, 9 de Octubre 2026",
    time: "3:00 PM - 3:45 PM",
    status: "confirmed",
    googleEventId: "gc_evt_7736192b",
  },
  {
    id: "apt-3",
    patientName: "Carlos Rodríguez",
    phone: "+57 312 456 7890",
    service: "Ortodoncia - Control Mensual",
    date: "Lunes, 12 de Octubre 2026",
    time: "11:30 AM - 12:15 PM",
    status: "confirmed",
    googleEventId: "gc_evt_4412093c",
  },
  {
    id: "apt-4",
    patientName: "Andrea Jiménez",
    phone: "+57 300 555 4321",
    service: "Extracción Cordal (Cirugía)",
    date: "Martes, 6 de Octubre 2026",
    time: "9:00 AM - 10:00 AM",
    status: "completed",
    googleEventId: "gc_evt_1188223d",
  },
];

export default function AppointmentsPage() {
  const [filter, setFilter] = useState<"all" | "confirmed" | "completed">("all");

  const filteredAppointments = mockAppointments.filter((apt) =>
    filter === "all" ? true : apt.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Citas Agendadas (Google Calendar)
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Citas reservadas autónomamente por el agente mediante llamadas a la API de Google.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-xs border-zinc-200 dark:border-zinc-800">
            <Filter className="mr-2 h-3.5 w-3.5" />
            Filtrar
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Nueva Cita Manual
          </Button>
        </div>
      </div>

      {/* Synchronized status card */}
      <Card className="border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                Google Calendar en tiempo real
              </p>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80">
                Las citas se sincronizan con la cuenta vinculada del consultorio. Los eventos creados en Google Calendar bloquean automáticamente los horarios para WhatsApp.
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white text-[11px]">Sincronizado</Badge>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAppointments.map((apt) => (
          <Card key={apt.id} className="border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant={apt.status === "confirmed" ? "default" : "secondary"}
                  className={
                    apt.status === "confirmed"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : ""
                  }
                >
                  {apt.status === "confirmed" ? "Confirmada" : "Completada"}
                </Badge>
                <span className="text-[10px] font-mono text-zinc-400">{apt.googleEventId}</span>
              </div>
              <CardTitle className="text-base font-semibold pt-1">{apt.patientName}</CardTitle>
              <CardDescription className="text-xs">{apt.service}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-0 text-xs">
              <div className="space-y-1.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/50">
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-medium">{apt.date}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{apt.time}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{apt.phone}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-400">Agendada por Agente IA</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 dark:text-indigo-400">
                  Ver en Google <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
