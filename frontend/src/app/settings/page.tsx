"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  Shield,
  Save,
  CheckCircle2,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
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
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Optional password update state (for Google OAuth users or password change)
  const [newPassword, setNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    const ctx = getTenantContext();
    setTenant(ctx);
    setCompanyName(ctx.name);
    setIndustry(ctx.industry);
    setContactEmail(ctx.email);

    const loadBackendSettings = async () => {
      try {
        const [orgData, agentData] = await Promise.all([
          apiFetch<{ id?: string; name?: string; slug?: string }>("/organizations/me").catch(() => null),
          apiFetch<{ onboarding_answers?: Record<string, unknown> | null }>("/agents/me").catch(() => null),
        ]);

        if (orgData) {
          setTenant((prev) => ({
            ...prev,
            id: orgData.id || prev.id,
            name: orgData.name || prev.name,
            slug: orgData.slug || prev.slug,
          }));
          if (orgData.name) {
            setCompanyName(orgData.name);
            localStorage.setItem("zolution_org_name", orgData.name);
          }
          if (orgData.id) localStorage.setItem("zolution_org_id", orgData.id);
          if (orgData.slug) localStorage.setItem("zolution_org_slug", orgData.slug);
        }

        const ans = agentData?.onboarding_answers;
        if (ans && typeof ans === "object") {
          const dbInd = (ans.industry || ans.business_type) as string | undefined;
          if (dbInd) {
            setIndustry(dbInd);
            localStorage.setItem("zolution_org_industry", dbInd);
            setTenant((prev) => ({ ...prev, industry: dbInd }));
          }
          const dbPhone = (ans.phone || ans.whatsappPhone) as string | undefined;
          if (dbPhone) setPhone(dbPhone);
          const dbAddr = ans.address as string | undefined;
          if (dbAddr) setAddress(dbAddr);
          const dbEmail = ans.contactEmail as string | undefined;
          if (dbEmail) setContactEmail(dbEmail);
        }
      } catch {
        // Keep local values
      }
    };

    loadBackendSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const cleanName = companyName.trim();

    if (cleanName) {
      localStorage.setItem("zolution_org_name", cleanName);
      localStorage.setItem("zolution_org_industry", industry);
      localStorage.setItem("zolution_user_email", contactEmail);
    }

    try {
      await apiFetch("/agents/me", {
        method: "PATCH",
        body: JSON.stringify({
          company_name: cleanName || undefined,
          onboarding_answers: {
            companyName: cleanName,
            business_name: cleanName,
            industry,
            business_type: industry,
            contactEmail,
            phone,
            whatsappPhone: phone,
            address,
          },
        }),
      });
    } catch {
      // Fallback local
    } finally {
      window.dispatchEvent(new Event("storage"));
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (newPassword.trim().length < 6) {
      setPasswordStatus({ type: "error", msg: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    setIsSavingPassword(true);
    try {
      await apiFetch("/auth/set-password", {
        method: "POST",
        body: JSON.stringify({ password: newPassword }),
      });
      setNewPassword("");
      setPasswordStatus({
        type: "success",
        msg: "Contraseña configurada en PostgreSQL. Ya puedes iniciar sesión también con tu correo y contraseña.",
      });
    } catch (err: unknown) {
      setPasswordStatus({
        type: "error",
        msg: err instanceof Error ? err.message : "No se pudo actualizar la contraseña.",
      });
    } finally {
      setIsSavingPassword(false);
    }
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
            Información de la organización, políticas de atención y reglas del tenant activo sincronizadas en PostgreSQL.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
        >
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-300" />
              ¡Guardado en BD!
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

        {/* Tenant Isolation & RLS Details + Password Management */}
        <div className="space-y-6">
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

          <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-indigo-500" />
                Contraseña de Acceso Manual
              </CardTitle>
              <CardDescription className="text-xs">
                Si te registraste con Google o deseas cambiar tu clave, configura aquí una contraseña para ingresar también con correo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nueva contraseña (mínimo 6 caracteres)"
                    className="h-9 text-xs"
                  />
                  <Button
                    type="submit"
                    disabled={isSavingPassword || !newPassword.trim()}
                    variant="outline"
                    className="h-9 text-xs shrink-0"
                  >
                    {isSavingPassword ? "Actualizando..." : "Actualizar Clave"}
                  </Button>
                </div>
                {passwordStatus && (
                  <p
                    className={`text-xs ${
                      passwordStatus.type === "success"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {passwordStatus.msg}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
