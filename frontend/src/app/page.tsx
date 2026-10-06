import Link from "next/link";
import {
  Bot,
  Calendar,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Shield,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function OverviewPage() {
  const stats = [
    {
      title: "Conversaciones Totales",
      value: "142",
      change: "+18% esta semana",
      icon: MessageSquare,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      title: "Citas Agendadas",
      value: "38",
      change: "Google Calendar sincronizado",
      icon: Calendar,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      title: "Tasa de Resolución IA",
      value: "94.2%",
      change: "Sin intervención humana",
      icon: Sparkles,
      color: "text-indigo-500 bg-indigo-500/10",
    },
    {
      title: "Tiempo de Respuesta",
      value: "1.4s",
      change: "Asistente en tiempo real",
      icon: Clock,
      color: "text-amber-500 bg-amber-500/10",
    },
  ];

  const recentEvents = [
    {
      id: "1",
      customer: "María Gómez",
      action: "Cita confirmada para Consulta General",
      time: "Hace 12 min",
      tool: "book_appointment",
      status: "success",
    },
    {
      id: "2",
      customer: "Carlos Rodriguez",
      action: "Consulta de disponibilidad para el viernes",
      time: "Hace 34 min",
      tool: "check_availability",
      status: "success",
    },
    {
      id: "3",
      customer: "Laura Restrepo",
      action: "Pregunta sobre tarifas de ortodoncia",
      time: "Hace 1 hora",
      tool: "llm_answer",
      status: "info",
    },
    {
      id: "4",
      customer: "Felipe Morales",
      action: "Cita reagendada para Limpieza Dental",
      time: "Hace 2 horas",
      tool: "book_appointment",
      status: "success",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md">
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            <span>Sistema Multitenant Operativo</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Panel de Control del Agente Clínico
          </h2>
          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Tu asistente de IA está activo atendiendo pacientes en WhatsApp, sincronizando citas con Google Calendar y respondiendo dudas en segundos.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/agent"
              className={cn(buttonVariants(), "bg-white text-indigo-950 hover:bg-zinc-100 shadow-md")}
            >
              <Bot className="mr-2 h-4 w-4 text-indigo-600" />
              Configurar Agente IA
            </Link>
            <Link
              href="/integrations"
              className={cn(buttonVariants({ variant: "outline" }), "border-white/30 text-white hover:bg-white/10")}
            >
              <Calendar className="mr-2 h-4 w-4 text-emerald-400" />
              Ver Integraciones
            </Link>
          </div>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-1/3 -top-12 w-48 h-48 rounded-full bg-violet-400/20 blur-2xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {stat.value}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Activity & Architecture Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Automated Activity */}
        <Card className="lg:col-span-2 border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Actividad Reciente del Agente</CardTitle>
              <CardDescription>Eventos y llamadas de herramientas en tiempo real</CardDescription>
            </div>
            <Link
              href="/conversations"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs")}
            >
              Ver todos
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/50 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 font-medium text-xs">
                    {event.customer.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {event.customer}
                      </p>
                      <Badge variant="outline" className="text-[10px] py-0 font-mono text-zinc-500">
                        {event.tool}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      {event.action}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{event.time}</span>
                  <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Auto</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Multi-Tenant Security & System Status */}
        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Estado del Tenant</CardTitle>
              <Shield className="h-4 w-4 text-emerald-500" />
            </div>
            <CardDescription>Aislamiento y configuración de seguridad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Row Level Security (RLS)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Activo (PostgreSQL)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Proveedor de IA</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">OpenAI / Claude</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Function Calling</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Google Calendar Tools</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Webhook Meta WhatsApp</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Conectado (200 OK)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Agente Autónomo
              </p>
              <p className="text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                El agente utiliza el schema de herramientas de la Fase 6 para verificar disponibilidad y apartar citas directamente en el calendario del consultorio.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/settings"
                className={cn(buttonVariants({ variant: "outline" }), "w-full text-xs text-center justify-center")}
              >
                Ver Ajustes de la Organización
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
