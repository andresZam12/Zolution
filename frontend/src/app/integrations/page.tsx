"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Unplug,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { getTenantContext, getAppLanguage, TenantContext, AppLanguage } from "@/lib/tenant";

interface IntegrationStatusItem {
  provider: string;
  is_connected: boolean;
  email_address?: string | null;
  scopes?: string | null;
  updated_at?: string | null;
}

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<AppLanguage>("es");
  const [tenant, setTenant] = useState<TenantContext>({
    id: "org-1",
    slug: "empresa",
    name: "Mi Negocio",
    industry: "Servicios",
    email: "contacto@empresa.com",
  });
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://zolution-api.onrender.com/api/v1";
  const webhookUrl = `${apiBase.replace(/\/+$/, "")}/webhooks/whatsapp`;
  const verifyToken = "zol_verify_sec_9941a";

  const loadIntegrationStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const statuses = await apiFetch<IntegrationStatusItem[]>("/integrations/status");
      const googleItem = statuses.find((s) => s.provider === "google");
      if (googleItem && googleItem.is_connected) {
        setGoogleConnected(true);
        setGoogleEmail(googleItem.email_address || null);
        setLastUpdated(googleItem.updated_at || null);
      } else {
        setGoogleConnected(false);
        setGoogleEmail(null);
        setLastUpdated(null);
      }
    } catch {
      setGoogleConnected(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    const syncContext = () => {
      setTenant(getTenantContext());
      setLang(getAppLanguage());
    };
    syncContext();
    loadIntegrationStatus();

    const connectedParam = searchParams.get("connected");
    const errorParam = searchParams.get("error");
    if (connectedParam === "google") {
      setFeedbackBanner({
        type: "success",
        text: "¡Google Calendar conectado exitosamente con tu negocio!",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      setFeedbackBanner({
        type: "error",
        text:
          errorParam === "access_denied"
            ? "Cancelaste la autorización de Google Calendar."
            : `No se pudo conectar Google Calendar: ${errorParam}`,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    window.addEventListener("storage", syncContext);
    return () => window.removeEventListener("storage", syncContext);
  }, [searchParams]);

  const handleCopy = (text: string, type: "webhook" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "webhook") {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleGoogleOAuthConnect = async () => {
    setIsConnecting(true);
    setFeedbackBanner(null);
    try {
      const redirectUri = window.location.origin + "/login";
      const randomNonce =
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, "")
          : Math.random().toString(36).substring(2)) + Date.now().toString(36);
      const state = `calendar_connect_${randomNonce}`;
      sessionStorage.setItem("zolution_oauth_state", state);

      const resp = await apiFetch<{ auth_url: string }>(
        `/integrations/google/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`
      );
      if (resp && resp.auth_url) {
        window.location.href = resp.auth_url;
      }
    } catch (err: unknown) {
      setFeedbackBanner({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Error al iniciar la vinculación con Google Calendar.",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setIsDisconnecting(true);
    setFeedbackBanner(null);
    try {
      await apiFetch("/integrations/google", { method: "DELETE" });
      setGoogleConnected(false);
      setGoogleEmail(null);
      setLastUpdated(null);
      setFeedbackBanner({
        type: "success",
        text: "Cuenta de Google Calendar desconectada.",
      });
    } catch (err: unknown) {
      setFeedbackBanner({
        type: "error",
        text: err instanceof Error ? err.message : "No se pudo desconectar Google Calendar.",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {lang === "en" ? `Connections · ${tenant.name}` : `Conexiones · ${tenant.name}`}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {lang === "en"
            ? `Connect your calendar and WhatsApp line so your assistant can schedule appointments for ${tenant.name}.`
            : `Conecta tu calendario y tu línea de WhatsApp para que tu asistente agende citas en ${tenant.name}.`}
        </p>
      </div>

      {feedbackBanner && (
        <div
          className={`p-3.5 rounded-xl text-xs border flex items-center gap-2.5 ${
            feedbackBanner.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
          }`}
        >
          {feedbackBanner.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{feedbackBanner.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Calendar Integration */}
        <Card className="border-zinc-200/70 dark:border-zinc-800/80 shadow-2xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Google Calendar</CardTitle>
                  <CardDescription className="text-xs">
                    {lang === "en"
                      ? "Automatic scheduling and availability sync"
                      : "Sincronización automática de horarios y citas"}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant={googleConnected ? "default" : "outline"}
                className={
                  isCheckingStatus
                    ? "text-zinc-400"
                    : googleConnected
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }
              >
                {isCheckingStatus
                  ? lang === "en"
                    ? "Checking..."
                    : "Verificando..."
                  : googleConnected
                    ? lang === "en"
                      ? "Synced"
                      : "Sincronizado"
                    : lang === "en"
                      ? "Ready to connect"
                      : "Pendiente de conectar"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {lang === "en" ? (
                <>
                  Allows your assistant to check open slots and book appointments automatically in{" "}
                  <strong>{tenant.name}</strong>&apos;s Google Calendar.
                </>
              ) : (
                <>
                  Permite a tu asistente consultar horarios libres y agendar citas automáticamente
                  en la cuenta de Google Calendar de <strong>{tenant.name}</strong>.
                </>
              )}
            </p>

            <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">
                  {lang === "en" ? "Status:" : "Estado de conexión:"}
                </span>
                <span
                  className={`font-medium ${
                    googleConnected
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {isCheckingStatus
                    ? lang === "en"
                      ? "Checking..."
                      : "Consultando..."
                    : googleConnected
                      ? lang === "en"
                        ? "Synced & Active"
                        : "Sincronizado y Activo"
                      : lang === "en"
                        ? "Not connected yet"
                        : "Sin cuenta vinculada"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">
                  {lang === "en" ? "Connected account:" : "Cuenta vinculada:"}
                </span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {googleConnected
                    ? googleEmail || tenant.email
                    : lang === "en"
                      ? "None"
                      : "Ninguna cuenta vinculada"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">
                  {lang === "en" ? "Target calendar:" : "Calendario activo:"}
                </span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {googleConnected
                    ? `${tenant.name}`
                    : lang === "en"
                      ? "Activated upon connecting"
                      : "Se activará al conectar Google"}
                </span>
              </div>
              {lastUpdated && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">
                    {lang === "en" ? "Last synced:" : "Última sincronización:"}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                    {new Date(lastUpdated).toLocaleString("es-CO")}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <Button
                onClick={handleGoogleOAuthConnect}
                disabled={isConnecting || isCheckingStatus}
                className={
                  googleConnected
                    ? "flex-1 text-xs bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                    : "w-full text-xs bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                }
              >
                <RefreshCw
                  className={`mr-2 h-3.5 w-3.5 ${isConnecting ? "animate-spin" : ""}`}
                />
                {isConnecting
                  ? lang === "en"
                    ? "Redirecting to Google..."
                    : "Redirigiendo a Google..."
                  : googleConnected
                    ? lang === "en"
                      ? "Switch Google Account"
                      : "Cambiar Cuenta de Google"
                    : lang === "en"
                      ? "Connect Google Calendar"
                      : "Conectar Google Calendar"}
              </Button>

              {googleConnected && (
                <Button
                  variant="outline"
                  onClick={handleDisconnectGoogle}
                  disabled={isDisconnecting}
                  className="text-xs border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0 cursor-pointer"
                >
                  <Unplug className="mr-1.5 h-3.5 w-3.5" />
                  {isDisconnecting
                    ? "..."
                    : lang === "en"
                      ? "Disconnect"
                      : "Desconectar"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Business Channel */}
        <Card className="border-zinc-200/70 dark:border-zinc-800/80 shadow-2xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">WhatsApp Business</CardTitle>
                  <CardDescription className="text-xs">
                    {lang === "en"
                      ? "Direct customer messaging channel"
                      : "Canal de atención directa por WhatsApp"}
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                {lang === "en" ? "Synced" : "Sincronizado"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {lang === "en" ? (
                <>
                  Connection details to link <strong>{tenant.name}</strong>&apos;s official WhatsApp
                  number in Meta Business Suite.
                </>
              ) : (
                <>
                  Datos de enlace para conectar el número de WhatsApp de{" "}
                  <strong>{tenant.name}</strong> en tu cuenta de Meta Business.
                </>
              )}
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {lang === "en" ? "Connection Link" : "Enlace de Conexión"}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={webhookUrl}
                    className="text-xs h-9 bg-zinc-50 dark:bg-zinc-900"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(webhookUrl, "webhook")}
                    className="h-9 shrink-0 cursor-pointer"
                  >
                    {copiedWebhook ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {lang === "en" ? "Verification Key" : "Clave de Verificación"}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={verifyToken}
                    className="text-xs h-9 bg-zinc-50 dark:bg-zinc-900"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(verifyToken, "token")}
                    className="h-9 shrink-0 cursor-pointer"
                  >
                    {copiedToken ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {lang === "en" ? "Instant 24/7 replies" : "Respuestas automáticas 24/7"}
              </span>
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:underline text-indigo-600 dark:text-indigo-400"
              >
                Meta Business <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Privacy & Data Protection Card */}
      <Card className="border-zinc-200/70 dark:border-zinc-800/80 shadow-2xs bg-white dark:bg-zinc-900">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {lang === "en" ? "Private & Protected Data" : "Privacidad de tu Negocio"}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                {lang === "en"
                  ? "Your calendar access and customer conversations are strictly private to your business account."
                  : "El acceso a tu calendario y las conversaciones con tus clientes son completamente privados y exclusivos de tu negocio."}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0"
          >
            {lang === "en" ? "Protected" : "Protegido"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex items-center justify-center text-xs text-zinc-500">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-indigo-600" />
          Cargando conexiones...
        </div>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
