"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  Shield,
  Save,
  CheckCircle2,
  Clock,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getTenantContext, TenantContext } from "@/lib/tenant";

export default function SettingsPage() {
  const [tenant, setTenant] = useState<TenantContext>({
    id: "org-1",
    slug: "org-1",
    name: "Cargando empresa...",
    industry: "Servicios Profesionales",
    email: "contacto@empresa.com",
  });
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("+57 310 987 6543");
  const [address, setAddress] = useState("Sede Central Empresarial");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const ctx = getTenantContext();
    setTenant(ctx);
    setCompanyName(ctx.name);
    setIndustry(ctx.industry);
    setContactEmail(ctx.email);
  }, []);

  const handleSave = () => {
    if (companyName) {
      localStorage.setItem("zolution_org_name", companyName);
      localStorage.setItem("zolution_org_industry", industry);
      localStorage.setItem("zolution_user_email", contactEmail);
      window.dispatchEvent(new Event("storage"));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Ajustes de {companyName || "la Empresa"}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Información de la organización, políticas de atención y reglas del tenant activo.
          </p>
        </div>

        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
          {saved ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-300" />
              ¡Guardado!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Ajustes
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Information */}
        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-500" />
              Perfil de la Empresa
            </CardTitle>
            <CardDescription className="text-xs">
              Datos generales que el asistente de IA utilizará para presentarse ante los clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Nombre de la Empresa o Negocio
              </label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-9 text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Sector o Industria
              </label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} className="h-9 text-sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Correo de Contacto
                </label>
                <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Teléfono Principal
                </label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Dirección Física o Cobertura
              </label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9 text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* Tenant Isolation & RLS Details */}
        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              Seguridad Multi-Tenant
            </CardTitle>
            <CardDescription className="text-xs">
              Configuración de partición de base de datos y aislamiento del tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Tenant ID:</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">{tenant.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Slug Identificador:</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{tenant.slug}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Base de Datos:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">PostgreSQL (RLS habilitado)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Aislamiento de Citas y Chats:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% Hermético</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">Recordatorios Automáticos</p>
                  <p className="text-[11px] text-zinc-500">Enviar mensaje por WhatsApp 24h antes del evento</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">Modo Fuera de Horario</p>
                  <p className="text-[11px] text-zinc-500">El agente sigue respondiendo y agendando en horarios no laborales</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
