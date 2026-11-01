"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  Bell,
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
import { getTenantContext, getAppLanguage, TenantContext, AppLanguage } from "@/lib/tenant";

export default function SettingsPage() {
  const [lang, setLang] = useState<AppLanguage>("es");
  const [tenant, setTenant] = useState<TenantContext>({
    id: "org-1",
    slug: "org-1",
    name: "Mi Negocio",
    industry: "Servicios Profesionales",
    email: "contacto@empresa.com",
  });
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("+57 310 987 6543");
  const [address, setAddress] = useState("Sede Principal");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Optional password update state
  const [newPassword, setNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    const syncLocal = () => {
      const ctx = getTenantContext();
      setTenant(ctx);
      setLang(getAppLanguage());
      setCompanyName(ctx.name);
      setIndustry(ctx.industry);
      setContactEmail(ctx.email);
    };
    syncLocal();

    const loadBackendSettings = async () => {
      try {
        const [orgData, agentData] = await Promise.all([
          apiFetch<{ id?: string; name?: string; slug?: string }>("/organizations/me").catch(
            () => null
          ),
          apiFetch<{ onboarding_answers?: Record<string, unknown> | null }>("/agents/me").catch(
            () => null
          ),
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
    window.addEventListener("storage", syncLocal);
    return () => window.removeEventListener("storage", syncLocal);
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
      setPasswordStatus({
        type: "error",
        msg:
          lang === "en"
            ? "Password must be at least 6 characters."
            : "La contraseña debe tener al menos 6 caracteres.",
      });
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
        msg:
          lang === "en"
            ? "Password updated! You can now sign in with your email and password."
            : "¡Contraseña actualizada! Ya puedes iniciar sesión con tu correo y contraseña.",
      });
    } catch (err: unknown) {
      setPasswordStatus({
        type: "error",
        msg:
          err instanceof Error
            ? err.message
            : lang === "en"
              ? "Could not update password."
              : "No se pudo actualizar la contraseña.",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/70 dark:border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            {lang === "en"
              ? `Settings · ${companyName || tenant.name}`
              : `Ajustes de ${companyName || tenant.name}`}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {lang === "en"
              ? "Manage your business information, customer care preferences, and account access."
              : "Administra los datos de tu negocio, preferencias de atención y acceso a tu cuenta."}
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer"
        >
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {lang === "en" ? "Saving..." : "Guardando..."}
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-300" />
              {lang === "en" ? "Saved!" : "¡Cambios Guardados!"}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {lang === "en" ? "Save Settings" : "Guardar Ajustes"}
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Profile */}
        <Card className="border-zinc-200/70 dark:border-zinc-800/80 shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-500" />
              {lang === "en" ? "Business Profile" : "Datos de tu Negocio"}
            </CardTitle>
            <CardDescription className="text-xs">
              {lang === "en"
                ? "General details your assistant uses when greeting customers."
                : "Información general que tu asistente utilizará para atender a tus clientes."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {lang === "en" ? "Business Name" : "Nombre del Negocio o Empresa"}
              </label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {lang === "en" ? "Industry or Specialty" : "Sector o Especialidad"}
              </label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {lang === "en" ? "Contact Email" : "Correo de Contacto"}
                </label>
                <Input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {lang === "en" ? "WhatsApp / Phone" : "Teléfono / WhatsApp"}
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {lang === "en" ? "Location or Address" : "Dirección o Ubicación"}
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Care Preferences + Password Management */}
        <div className="space-y-6">
          <Card className="border-zinc-200/70 dark:border-zinc-800/80 shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-500" />
                {lang === "en" ? "Attention Preferences" : "Preferencias de Atención"}
              </CardTitle>
              <CardDescription className="text-xs">
                {lang === "en"
                  ? "Configure how your assistant interacts with your customers."
                  : "Configura cómo interactúa tu asistente con tus clientes en el día a día."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                      {lang === "en" ? "Automatic Reminders" : "Recordatorios Automáticos"}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {lang === "en"
                        ? "Send a WhatsApp reminder 24 hours before the appointment"
                        : "Enviar mensaje de recordatorio por WhatsApp 24h antes de la cita"}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                      {lang === "en" ? "24/7 After-Hours Service" : "Atención Fuera de Horario"}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {lang === "en"
                        ? "Keep answering questions and scheduling appointments at night and on weekends"
                        : "Tu asistente sigue respondiendo y agendando citas en noches y fines de semana"}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200/70 dark:border-zinc-800/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-indigo-500" />
                {lang === "en" ? "Account Password" : "Contraseña de Acceso"}
              </CardTitle>
              <CardDescription className="text-xs">
                {lang === "en"
                  ? "If you signed up with Google or want to change your password, set a new one here."
                  : "Si ingresaste con Google o deseas cambiar tu clave, configura aquí tu contraseña."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={
                      lang === "en"
                        ? "New password (min. 6 characters)"
                        : "Nueva contraseña (mínimo 6 caracteres)"
                    }
                    className="h-9 text-xs"
                  />
                  <Button
                    type="submit"
                    disabled={isSavingPassword || !newPassword.trim()}
                    variant="outline"
                    className="h-9 text-xs shrink-0 cursor-pointer"
                  >
                    {isSavingPassword
                      ? lang === "en"
                        ? "Updating..."
                        : "Actualizando..."
                      : lang === "en"
                        ? "Update Password"
                        : "Actualizar Clave"}
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
