"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function IntegrationsPage() {
  const [googleConnected, setGoogleConnected] = useState(true);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const webhookUrl = `${apiBase}/webhooks/whatsapp`;
  const verifyToken = "zol_verify_sec_9941a";

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

  const handleGoogleOAuthConnect = () => {
    // Redirect to backend OAuth initiation endpoint
    window.location.href = `${apiBase}/integrations/google/authorize`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integraciones y Conexiones</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Conecta tus herramientas para que el agente sincronice citas y reciba mensajes de WhatsApp.
        </p>
      </div>

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
                  <CardDescription className="text-xs">Sincronización bidireccional de citas médicas</CardDescription>
                </div>
              </div>
              <Badge
                variant={googleConnected ? "default" : "outline"}
                className={
                  googleConnected
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "text-zinc-500"
                }
              >
                {googleConnected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Permite al agente consultar espacios libres (<code>check_availability</code>) y crear citas automáticamente (<code>book_appointment</code>) en la cuenta de Google de tu clínica usando OAuth 2.0.
            </p>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Cuenta vinculada:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">citas.dentalcare@gmail.com</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Calendario activo:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Agenda Principal (Consultorio 1)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Última sincronización:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Hace 4 minutos</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleGoogleOAuthConnect}
                variant="outline"
                className="w-full text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Reconectar Cuenta Google
              </Button>
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
              Configura estos valores en el panel de desarrolladores de <strong>Meta for Developers</strong> para conectar la línea de WhatsApp de tu clínica.
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
                Tus tokens de Google Workspace y claves de WhatsApp están encriptados y protegidos a nivel de base de datos con políticas de seguridad por fila (RLS). Ninguna otra clínica puede acceder a tus credenciales.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
            Fase 6 Completada
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
