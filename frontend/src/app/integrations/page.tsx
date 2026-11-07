"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ArrowUpRight, Calendar, RefreshCw, Sparkles, Unplug } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/brand-icons";
import { buildSupportWhatsAppUrl } from "@/components/whatsapp-contact-button";
import { ZabioMark } from "@/components/zabio-logo";
import {
  ConfirmDialog,
  Notice,
  PageHeader,
  Rise,
  SectionCard,
  StatusPill,
} from "@/components/zabio-ui";
import { apiFetch } from "@/lib/api";
import { getTenantContext, getAppLanguage, TenantContext, AppLanguage } from "@/lib/tenant";
import { cn } from "@/lib/utils";

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
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const loadIntegrationStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const statuses = await apiFetch<IntegrationStatusItem[]>("/integrations/status");
      const googleItem = statuses.find((s) => s.provider === "google");
      if (googleItem && googleItem.is_connected) {
        setGoogleConnected(true);
        setGoogleEmail(googleItem.email_address || null);
      } else {
        setGoogleConnected(false);
        setGoogleEmail(null);
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

  const flow = [
    { key: "whatsapp", label: "WhatsApp", icon: <WhatsAppIcon className="h-4 w-4 text-success" /> },
    {
      key: "agent",
      label: lang === "en" ? "Agent" : "Agente",
      icon: <ZabioMark size={16} />,
    },
    {
      key: "calendar",
      label: "Google Calendar",
      icon: <Calendar className="h-4 w-4 text-brand" />,
    },
    {
      key: "panel",
      label: lang === "en" ? "Panel" : "Panel",
      icon: <Sparkles className="h-4 w-4 text-brand" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={lang === "en" ? "Connections" : "Conexiones"}
        title={
          lang === "en" ? (
            <>
              Your team, <em>always connected.</em>
            </>
          ) : (
            <>
              Tu equipo, <em>siempre conectado.</em>
            </>
          )
        }
        description={
          lang === "en"
            ? "WhatsApp and your calendar, working with your agent."
            : "WhatsApp y tu calendario, trabajando con tu agente."
        }
      />

      {feedbackBanner && (
        <Notice tone={feedbackBanner.type === "success" ? "success" : "danger"} onDismiss={() => setFeedbackBanner(null)}>
          {feedbackBanner.text}
        </Notice>
      )}

      {/* El recorrido de un mensaje, como en la landing */}
      <Rise delay={60} className="flex flex-wrap items-center gap-2 text-[0.8rem] font-semibold">
        {flow.map((node, index) => (
          <React.Fragment key={node.key}>
            {index > 0 && <ArrowRight className="h-4 w-4 text-foreground" />}
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-(--shadow-card)">
              {node.icon}
              {node.label}
            </span>
          </React.Fragment>
        ))}
      </Rise>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Google Calendar */}
        <Rise delay={120}>
          <SectionCard
            tone="orange"
            icon={Calendar}
            kicker={lang === "en" ? "Your schedule" : "Tu agenda"}
            title="Google Calendar"
            bodyClassName="flex flex-col"
            action={
              <StatusPill
                tone={isCheckingStatus ? "neutral" : googleConnected ? "success" : "warning"}
              >
                {isCheckingStatus
                  ? lang === "en"
                    ? "Checking..."
                    : "Verificando..."
                  : googleConnected
                    ? lang === "en"
                      ? "Connected"
                      : "Conectado"
                    : lang === "en"
                      ? "Not connected"
                      : "Sin conectar"}
              </StatusPill>
            }
          >
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              {googleConnected && googleEmail
                ? lang === "en"
                  ? `Your agent checks free slots and books in ${googleEmail}.`
                  : `Tu agente revisa los horarios libres y agenda en ${googleEmail}.`
                : lang === "en"
                  ? "Lets your agent check free slots and book appointments on its own."
                  : "Permite que tu agente revise los horarios libres y agende citas por sí solo."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                variant={googleConnected ? "outline" : "default"}
                onClick={handleGoogleOAuthConnect}
                disabled={isConnecting || isCheckingStatus}
              >
                {isConnecting && <RefreshCw className="animate-spin" />}
                {isConnecting
                  ? lang === "en"
                    ? "Opening Google..."
                    : "Abriendo Google..."
                  : googleConnected
                    ? lang === "en"
                      ? "Switch account"
                      : "Cambiar cuenta"
                    : lang === "en"
                      ? "Connect Google Calendar"
                      : "Conectar Google Calendar"}
              </Button>
              {googleConnected && (
                <Button
                  variant="ghost"
                  onClick={() => setConfirmDisconnect(true)}
                  disabled={isDisconnecting}
                  className="hover:bg-danger-soft hover:text-danger"
                >
                  <Unplug />
                  {isDisconnecting ? "..." : lang === "en" ? "Disconnect" : "Desconectar"}
                </Button>
              )}
            </div>
          </SectionCard>
        </Rise>

        {/* WhatsApp: se conecta con acompañamiento, como promete la landing */}
        <Rise delay={190}>
          <SectionCard
            tone="green"
            icon={WhatsAppIcon}
            kicker={lang === "en" ? "Your channel" : "Tu canal"}
            title="WhatsApp"
            bodyClassName="flex flex-col"
          >
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              {lang === "en"
                ? "We walk you through it until your number is ready. Write to us and we connect it with you."
                : "Te acompañamos hasta dejar tu número listo. Escríbenos y lo conectamos contigo."}
            </p>

            <div className="mt-5">
              <a
                href={buildSupportWhatsAppUrl(lang, tenant.name)}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "secondary" }))}
              >
                {lang === "en" ? "Connect my WhatsApp" : "Conectar mi WhatsApp"}
                <ArrowUpRight />
              </a>
            </div>
          </SectionCard>
        </Rise>
      </div>

      <Rise delay={260}>
        <p className="text-center text-xs font-medium text-muted-foreground">
          {lang === "en"
            ? "Your calendar access and your customers' conversations are exclusive to your business."
            : "El acceso a tu calendario y las conversaciones con tus clientes son exclusivos de tu negocio."}
        </p>
      </Rise>

      {confirmDisconnect && (
        <ConfirmDialog
          title={lang === "en" ? "Disconnect Google Calendar?" : "¿Desconectar Google Calendar?"}
          description={
            lang === "en"
              ? "Your agent will stop checking and booking in your calendar until you connect it again."
              : "Tu agente dejará de revisar y agendar en tu calendario hasta que lo conectes de nuevo."
          }
          confirmLabel={lang === "en" ? "Yes, disconnect" : "Sí, desconectar"}
          cancelLabel={lang === "en" ? "Keep connected" : "Mantener conectado"}
          onCancel={() => setConfirmDisconnect(false)}
          onConfirm={() => {
            setConfirmDisconnect(false);
            handleDisconnectGoogle();
          }}
        />
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin text-brand" />
          Cargando conexiones...
        </div>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
