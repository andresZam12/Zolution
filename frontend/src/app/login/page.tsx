"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/brand-icons";
import { ZabioLogo, ZabioMark, ZabioWatermark } from "@/components/zabio-logo";
import { Field, Notice, Rise, Segmented } from "@/components/zabio-ui";
import { apiFetch } from "@/lib/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isRegister, setIsRegister] = useState(searchParams.get("registro") === "1");
  const [regStep, setRegStep] = useState<1 | 2>(1); // 1: Datos, 2: Código OTP
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Servicios Profesionales");
  const [customIndustry, setCustomIndustry] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle Google OAuth callback with Anti-CSRF verification and error handling (RFC 6749)
  useEffect(() => {
    const returnedState = searchParams.get("state") || "";
    const isCalendarConnect = returnedState.startsWith("calendar_connect_");

    const error = searchParams.get("error");
    if (error) {
      if (isCalendarConnect) {
        router.replace(`/integrations?error=${encodeURIComponent(error)}`);
        return;
      }
      if (error === "access_denied") {
        setErrorMessage("Has cancelado el inicio de sesión con Google.");
      } else {
        setErrorMessage(`Error de autorización de Google: ${error}`);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const code = searchParams.get("code");
    if (!code) return;

    // Verify Anti-CSRF state token
    const savedState = sessionStorage.getItem("zolution_oauth_state");
    sessionStorage.removeItem("zolution_oauth_state");

    if (!savedState || returnedState !== savedState) {
      setErrorMessage(
        "Error de seguridad: La firma de estado de Google no coincide. Intenta de nuevo."
      );
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Clean URL parameters immediately for privacy
    window.history.replaceState({}, document.title, window.location.pathname);

    const handleGoogleCallback = async () => {
      setIsGoogleLoading(true);
      setErrorMessage(null);
      try {
        const redirect_uri = window.location.origin + "/login";

        // Flow 1: Connecting Google Calendar from /integrations
        if (isCalendarConnect) {
          await apiFetch("/integrations/google/callback", {
            method: "POST",
            body: JSON.stringify({ code, redirect_uri }),
          });
          router.replace("/integrations?connected=google");
          return;
        }

        // Flow 2: Standard Google Sign-In / Sign-Up
        const resp = await apiFetch<{
          access_token: string;
          user: { id: string; email: string; role: string; name?: string; picture?: string };
          organization: { id: string; name: string; slug: string; industry?: string };
          is_new_user?: boolean;
        }>("/auth/google/callback", {
          method: "POST",
          body: JSON.stringify({ code, redirect_uri }),
        });

        localStorage.setItem("zolution_token", resp.access_token);
        localStorage.setItem("zolution_auth_token", resp.access_token);
        localStorage.setItem("zolution_org_id", resp.organization.id);
        localStorage.setItem("zolution_org_slug", resp.organization.slug);
        localStorage.setItem("zolution_org_name", resp.organization.name);
        localStorage.setItem(
          "zolution_org_industry",
          resp.organization.industry || "Servicios Empresariales"
        );
        localStorage.setItem("zolution_user_email", resp.user.email);
        localStorage.setItem("zolution_user_id", resp.user.id);
        if (resp.user.name) {
          localStorage.setItem("zolution_user_name", resp.user.name);
        }
        if (resp.user.picture) {
          localStorage.setItem("zolution_user_picture", resp.user.picture);
        }
        localStorage.removeItem("zolution_agent_prompt");

        window.dispatchEvent(new Event("storage"));
        if (resp.is_new_user) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al conectar con Google.";
        if (isCalendarConnect) {
          router.replace(`/integrations?error=${encodeURIComponent(message)}`);
          return;
        }
        setErrorMessage(message);
      } finally {
        setIsGoogleLoading(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, router]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const redirectUri = window.location.origin + "/login";
      const state =
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, "")
          : Math.random().toString(36).substring(2)) + Date.now().toString(36);
      sessionStorage.setItem("zolution_oauth_state", state);

      const resp = await apiFetch<{ auth_url: string }>(
        `/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`
      );
      if (resp && resp.auth_url) {
        window.location.href = resp.auth_url;
      }
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "Error al conectar con Google.";
      if (
        rawMessage.includes("GOOGLE_CLIENT_ID") ||
        rawMessage.includes("Google OAuth no está configurado")
      ) {
        setErrorMessage(
          "El acceso directo con Google no está disponible en este momento. Puedes registrarte o ingresar usando tu correo con código de verificación."
        );
      } else {
        setErrorMessage(rawMessage);
      }
      setIsGoogleLoading(false);
    }
  };

  const effectiveIndustry =
    industry === "Otro" ? (customIndustry.trim() || "Otro Sector") : industry;

  // Step 1: Request 6-digit OTP code to email
  const handleRequestOtp = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const resp = await apiFetch<{ status: string; message: string; email: string }>(
        "/auth/register-request",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            company_name: companyName,
            industry: effectiveIndustry,
          }),
        }
      );

      setEmail(resp.email);
      setOtpCode("");
      setSuccessMessage(resp.message);
      setRegStep(2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al enviar código de verificación.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP code and finish registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setErrorMessage("Por favor ingresa el código completo de 6 dígitos.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const resp = await apiFetch<{
        access_token: string;
        user: { id: string; email: string; role: string; name?: string; picture?: string };
        organization: { id: string; name: string; slug: string; industry?: string };
      }>("/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({
          email,
          code: otpCode.trim(),
          company_name: companyName,
          password,
          industry: effectiveIndustry,
        }),
      });

      localStorage.setItem("zolution_token", resp.access_token);
      localStorage.setItem("zolution_auth_token", resp.access_token);
      localStorage.setItem("zolution_org_id", resp.organization.id);
      localStorage.setItem("zolution_org_slug", resp.organization.slug);
      localStorage.setItem("zolution_org_name", resp.organization.name);
      localStorage.setItem("zolution_org_industry", effectiveIndustry);
      localStorage.setItem("zolution_user_email", resp.user.email);
      localStorage.setItem("zolution_user_id", resp.user.id);
      if (resp.user.name) {
        localStorage.setItem("zolution_user_name", resp.user.name);
      }
      localStorage.removeItem("zolution_agent_prompt");

      window.dispatchEvent(new Event("storage"));
      router.push("/onboarding");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Código de verificación inválido.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Standard Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const resp = await apiFetch<{
        access_token: string;
        user: { id: string; email: string; role: string; name?: string; picture?: string };
        organization: { id: string; name: string; slug: string; industry?: string };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("zolution_token", resp.access_token);
      localStorage.setItem("zolution_auth_token", resp.access_token);
      localStorage.setItem("zolution_org_id", resp.organization.id);
      localStorage.setItem("zolution_org_slug", resp.organization.slug);
      localStorage.setItem("zolution_org_name", resp.organization.name);
      if (resp.organization.industry) {
        localStorage.setItem("zolution_org_industry", resp.organization.industry);
      }
      localStorage.setItem("zolution_user_email", resp.user.email);
      localStorage.setItem("zolution_user_id", resp.user.id);

      window.dispatchEvent(new Event("storage"));
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Correo o contraseña incorrectos.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const showGoogle = !isRegister || regStep === 1;

  const title = isRegister
    ? regStep === 1
      ? "Crea tu agente"
      : "Revisa tu correo"
    : "Qué bueno verte";

  const subtitle = isRegister
    ? regStep === 1
      ? "Cuéntanos lo esencial de tu negocio."
      : `Escribe el código de 6 dígitos que enviamos a ${email}.`
    : "Entra para ver tus conversaciones y tus citas.";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Banda café: el mensaje principal de la landing */}
      <aside className="relative hidden overflow-hidden bg-coffee p-12 text-on-coffee lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(700px_420px_at_85%_-5%,rgb(232_117_60/32%),transparent_62%),radial-gradient(520px_360px_at_0%_105%,rgb(37_211_102/10%),transparent_60%)]" />
        <ZabioWatermark className="-right-16 -bottom-20 h-[34rem] w-[34rem]" />

        <div className="relative">
          <ZabioLogo tone="white" size={34} />
        </div>

        <div className="relative max-w-lg">
          <p className="z-kicker flex items-center gap-2 text-[#f29a6a]!">
            <span className="z-live-dot" />
            El agente que trabaja contigo
          </p>
          <h1 className="z-title mt-5 text-6xl xl:text-7xl">
            <span className="z-rise block">Convierte cada</span>
            <span className="z-rise block [--d:120ms]">mensaje en</span>
            <span className="z-rise block [--d:240ms]">
              una{" "}
              <em className="bg-linear-to-r from-brand to-[#ffc98a] bg-clip-text pr-1 text-transparent">
                oportunidad.
              </em>
            </span>
          </h1>
          <p className="z-rise mt-6 max-w-sm leading-relaxed text-on-coffee-soft [--d:360ms]">
            Si no quedó en tu agenda, el agente no lo confirma.
          </p>
        </div>

        <p className="relative font-mono text-[0.68rem] text-on-coffee-soft">
          Atención inteligente. Agenda en orden.
        </p>
      </aside>

      {/* Formulario */}
      <div className="flex items-center justify-center px-5 py-10 sm:px-8">
        <Rise className="z-card w-full max-w-md p-6 sm:p-8">
          <div className="mb-8 lg:hidden">
            <ZabioLogo size={32} />
          </div>

          <Segmented
            value={isRegister ? "register" : "login"}
            onChange={(next) => {
              setIsRegister(next === "register");
              setRegStep(1);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            options={[
              { value: "login", label: "Entrar" },
              { value: "register", label: "Crear cuenta" },
            ]}
          />

          <h2 className="z-title mt-8 text-4xl">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

          <div className="mt-6 space-y-4">
            {isGoogleLoading && (
              <Notice tone="brand">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Conectando con Google...
                </span>
              </Notice>
            )}
            {errorMessage && <Notice tone="danger">{errorMessage}</Notice>}
            {successMessage && <Notice tone="success">{successMessage}</Notice>}

            {showGoogle && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full"
                >
                  <GoogleIcon />
                  {isRegister ? "Registrarme con Google" : "Continuar con Google"}
                </Button>

                <div className="flex items-center gap-3 font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
                  <span className="h-px flex-1 bg-border" />
                  {isRegister ? "o con tu correo" : "o con tu contraseña"}
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            {/* Registro, paso 1 */}
            {isRegister && regStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <Field label="Nombre de tu negocio">
                  <Input
                    required
                    autoComplete="organization"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Clínica Dental, Café La Terraza..."
                  />
                </Field>

                <Field label="Sector">
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="z-select"
                  >
                    <option value="Salud y Consultorios Médicos">Salud y Consultorios Médicos</option>
                    <option value="Servicios Legales y Jurídicos">Servicios Legales y Jurídicos</option>
                    <option value="Tecnología, Cloud & Soporte TI">Tecnología, Cloud & Soporte TI</option>
                    <option value="Bienestar, Spa & Belleza">Bienestar, Spa & Belleza</option>
                    <option value="Servicios Profesionales y Consultoría">
                      Servicios Profesionales y Consultoría
                    </option>
                    <option value="Comercio y Retail">Comercio y Retail</option>
                    <option value="Otro">Otro</option>
                  </select>
                </Field>
                {industry === "Otro" && (
                  <Field label="¿Cuál?">
                    <Input
                      required
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      placeholder="Restaurantes, Construcción..."
                    />
                  </Field>
                )}

                <Field label="Correo" hint="Te enviaremos un código para verificarlo.">
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@tunegocio.com"
                  />
                </Field>

                <Field label="Contraseña">
                  <Input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </Field>

                <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                  {isLoading ? "Enviando código..." : "Enviar código"}
                  <ArrowRight />
                </Button>
              </form>
            )}

            {/* Registro, paso 2 */}
            {isRegister && regStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  aria-label="Código de 6 dígitos"
                  placeholder="000000"
                  className="h-16 text-center font-mono text-2xl! tracking-[0.4em]"
                />

                <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                  {isLoading ? "Verificando..." : "Verificar y crear cuenta"}
                  <CheckCircle2 />
                </Button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="flex cursor-pointer items-center gap-1 font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Corregir datos
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="cursor-pointer font-bold text-brand-text underline-offset-4 hover:underline"
                  >
                    Reenviar código
                  </button>
                </div>
              </form>
            )}

            {/* Inicio de sesión */}
            {!isRegister && (
              <form onSubmit={handleLogin} className="space-y-4">
                <Field label="Correo">
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@tunegocio.com"
                  />
                </Field>

                <Field label="Contraseña">
                  <Input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>

                <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                  {isLoading ? "Entrando..." : "Entrar"}
                  <ArrowRight />
                </Button>
              </form>
            )}
          </div>
        </Rise>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="z-pulse-logo">
            <ZabioMark size={44} />
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
