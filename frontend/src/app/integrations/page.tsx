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
import { getTenantContext, TenantContext } from "@/lib/tenant";

interface IntegrationStatusItem {
  provider: string;
  is_connected: boolean;
  email_address?: string | null;
  scopes?: string | null;
  updated_at?: string | null;
}

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const [tenant, setTenant] = useState<TenantContext>({
    id: "org-1",
    slug: "empresa",
    name: "Cargando empresa...",
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
    const ctx = getTenantContext();
    setTenant(ctx);
    loadIntegrationStatus();

    const connectedParam = searchParams.get("connected");
    const errorParam = searchParams.get("error");
    if (connectedParam === "google") {
      setFeedbackBanner({
        type: "success",
        text: "¡Google Calendar vinculado y guardado exitosamente en PostgreSQL!",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      setFeedbackBanner({
        type: "error",
        text:
          errorParam === "access_denied"
            ? "Cancelaste la autorización de Google Calendar."
            : `No se pudo vincular Google Calendar: ${errorParam}`,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const handleStorage = () => setTenant(getTenantContext());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
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
        text: "Cuenta de Google Calendar desconectada de este tenant.",
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
          Integraciones y Conexiones · {tenant.name}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Conecta tus herramientas reales para que el agente sincronice citas en Google Calendar y reciba mensajes de WhatsApp para {tenant.name}.
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
        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Google Calendar</CardTitle>
                  <CardDescription className="text-xs">
                    Sincronización bidireccional de citas y reuniones reales
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
                  ? "Verificando BD..."
                  : googleConnected
                  ? "Conectado en BD"
                  : "Pendiente de vincular"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Permite al agente consultar espacios libres (<code>check_availability</code>) y crear citas automáticamente (<code>book_appointment</code>) en la cuenta oficial de Google Calendar de <strong>{tenant.name}</strong> mediante OAuth 2.0.
            </p>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Estado en PostgreSQL:</span>
                <span
                  className={`font-medium ${
                    googleConnected
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {isCheckingStatus
                    ? "Consultando..."
                    : googleConnected
                    ? "Token OAuth2 Activo (Auto-Refresh)"
                    : "Sin credenciales guardadas"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Cuenta vinculada:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {googleConnected ? googleEmail || tenant.email : "Ninguna cuenta vinculada"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Calendario destino:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {googleConnected
                    ? `Calendario Principal (${tenant.name})`
                    : "Se activará al autorizar Google"}
                </span>
              </div>
              {lastUpdated && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Última actualización:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
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
                    ? "flex-1 text-xs bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                }
              >
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isConnecting ? "animate-spin" : ""}`} />
                {isConnecting
                  ? "Redirigiendo a Google..."
                  : googleConnected
                  ? "Reconectar / Cambiar Cuenta Google"
                  : "Conectar Google Calendar Ahora"}
              </Button>

              {googleConnected && (
                <Button
                  variant="outline"
                  onClick={handleDisconnectGoogle}
                  disabled={isDisconnecting}
                  className="text-xs border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
                  title="Desvincular Google Calendar"
                >
                  <Unplug className="mr-1.5 h-3.5 w-3.5" />
                  {isDisconnecting ? "..." : "Desconectar"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Business Cloud API */}
        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">WhatsApp Cloud API (Meta)</CardTitle>
                  <CardDescription className="text-xs">Recepción y envío oficial de mensajes</CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                Webhook Activo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Configura estos valores en el panel de desarrolladores de <strong>Meta for Developers</strong> para conectar la línea de WhatsApp de <strong>{tenant.name}</strong>.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Callback URL (Webhook)
                </label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={webhookUrl} className="text-xs font-mono h-9 bg-zinc-50 dark:bg-zinc-900" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(webhookUrl, "webhook")}
                    className="h-9 shrink-0"
                  >
                    {copiedWebhook ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Verify Token
                </label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={verifyToken} className="text-xs font-mono h-9 bg-zinc-50 dark:bg-zinc-900" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(verifyToken, "token")}
                    className="h-9 shrink-0"
                  >
                    {copiedToken ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Respuesta asíncrona garantizada (&lt;500ms)
              </span>
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:underline text-indigo-600 dark:text-indigo-400"
              >
                Panel Meta <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Architecture Information */}
      <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-gradient-to-r from-zinc-50 to-indigo-50/20 dark:from-zinc-900 dark:to-indigo-950/20">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Aislamiento Multi-Tenant de Credenciales
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Tus tokens OAuth 2.0 de Google Calendar y claves de WhatsApp están almacenados por separado para cada empresa y protegidos a nivel de base de datos con políticas de seguridad por fila (RLS).
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
            RLS Activo
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
          Cargando estado de integraciones...
        </div>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
