"use client";

import React, { useState, useEffect } from "react";
import { Building2, CheckCircle2, KeyRound, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Notice, PageHeader, Rise, SectionCard } from "@/components/zabio-ui";
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
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

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
    setSaveFailed(false);
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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveFailed(true);
    } finally {
      window.dispatchEvent(new Event("storage"));
      setIsSaving(false);
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
      <PageHeader
        kicker={lang === "en" ? "Settings" : "Ajustes"}
        title={
          <>
            {lang === "en" ? "Settings of " : "Ajustes de "}
            <em>{companyName || tenant.name}.</em>
          </>
        }
        description={
          lang === "en"
            ? "The details your agent uses with your customers, and your account access."
            : "Los datos que tu agente usa con tus clientes y el acceso a tu cuenta."
        }
        actions={
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw className="animate-spin" /> : saved ? <CheckCircle2 /> : <Save />}
            {isSaving
              ? lang === "en"
                ? "Saving..."
                : "Guardando..."
              : saved
                ? lang === "en"
                  ? "Saved"
                  : "Guardado"
                : lang === "en"
                  ? "Save changes"
                  : "Guardar cambios"}
          </Button>
        }
      />

      {saveFailed && (
        <Notice tone="danger" onDismiss={() => setSaveFailed(false)}>
          {lang === "en"
            ? "Your changes could not be saved. Please try again."
            : "No se pudieron guardar los cambios. Intenta de nuevo."}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Rise delay={80} className="lg:col-span-3">
          <SectionCard
            tone="coffee"
            icon={Building2}
            kicker={lang === "en" ? "Profile" : "Perfil"}
            title={lang === "en" ? "Your business" : "Datos de tu negocio"}
            bodyClassName="space-y-4"
          >
            <Field label={lang === "en" ? "Business name" : "Nombre del negocio"}>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </Field>

            <Field label={lang === "en" ? "Industry" : "Sector"}>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={lang === "en" ? "Contact email" : "Correo de contacto"}>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </Field>
              <Field label="WhatsApp">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                />
              </Field>
            </div>

            <Field label={lang === "en" ? "Address" : "Dirección"}>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
          </SectionCard>
        </Rise>

        <Rise delay={160} className="lg:col-span-2">
          <SectionCard
            tone="orange"
            icon={KeyRound}
            kicker={lang === "en" ? "Access" : "Acceso"}
            title={lang === "en" ? "Password" : "Contraseña"}
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              {lang === "en"
                ? "If you signed in with Google, set one here to also enter with your email."
                : "Si entraste con Google, crea una aquí para entrar también con tu correo."}
            </p>

            <form onSubmit={handleUpdatePassword} className="mt-4 space-y-3">
              <Input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                aria-label={lang === "en" ? "New password" : "Nueva contraseña"}
                placeholder={lang === "en" ? "At least 6 characters" : "Mínimo 6 caracteres"}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={isSavingPassword || !newPassword.trim()}
              >
                {isSavingPassword
                  ? lang === "en"
                    ? "Updating..."
                    : "Actualizando..."
                  : lang === "en"
                    ? "Update password"
                    : "Actualizar contraseña"}
              </Button>
              {passwordStatus && (
                <Notice tone={passwordStatus.type === "success" ? "success" : "danger"}>
                  {passwordStatus.msg}
                </Notice>
              )}
            </form>
          </SectionCard>
        </Rise>
      </div>
    </div>
  );
}
