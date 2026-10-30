"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isRegister, setIsRegister] = useState(false);
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

  // Handle Google OAuth callback if code is present in URL
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;

    const handleGoogleCallback = async () => {
      setIsGoogleLoading(true);
      setErrorMessage(null);
      try {
        const redirect_uri = window.location.origin + "/login";
        const resp = await apiFetch<{
          access_token: string;
          user: { id: string; email: string; role: string };
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
        localStorage.removeItem("zolution_agent_prompt");

        window.dispatchEvent(new Event("storage"));
        if (resp.is_new_user) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al conectar con Google.";
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
      const resp = await apiFetch<{ auth_url: string }>(
        `/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`
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
          "El acceso directo con Google requiere registrar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Render. Mientras lo configuras, puedes registrarte o ingresar usando tu correo con código de verificación."
        );
      } else {
        setErrorMessage(rawMessage);
      }
      setIsGoogleLoading(false);
    }
  };

  const effectiveIndustry =
    industry === "Otro" ? (customIndustry.trim() || "Otro Sector") : industry;

  // Step 1: Request 6-digit OTP code to email (the code is only delivered by email)
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

  // Step 2: Verify OTP code and create User + Organization in DB
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
        user: { id: string; email: string; role: string };
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
        user: { id: string; email: string; role: string };
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-2xl shadow-xl shadow-indigo-500/25">
          Z
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Zolution
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
          Plataforma Multi-Tenant de Agentes de IA para WhatsApp y Sincronización en Google Calendar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg space-y-6">
        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-xl overflow-hidden">
          {/* Top Google Loading Banner */}
          {isGoogleLoading && (
            <div className="bg-indigo-600 text-white text-xs py-2 px-4 text-center flex items-center justify-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Conectando con Google y vinculando Google Calendar...</span>
            </div>
          )}

          <CardHeader className="pb-3">
            <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900 text-xs mb-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setRegStep(1);
                  setErrorMessage(null);
                }}
                className={`w-1/2 py-1.5 rounded-md transition-all font-medium ${
                  !isRegister
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500"
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMessage(null);
                }}
                className={`w-1/2 py-1.5 rounded-md transition-all font-medium ${
                  isRegister
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500"
                }`}
              >
                Registrar Empresa
              </button>
            </div>

            <CardTitle className="text-lg font-bold">
              {isRegister
                ? regStep === 1
                  ? "Crea la cuenta de tu empresa"
                  : "Verifica tu correo electrónico"
                : "Acceso al Panel de Control"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isRegister
                ? regStep === 1
                  ? "Automatiza la atención y el agendamiento de citas en tiempo real."
                  : `Ingresa el código de 6 dígitos enviado a ${email}.`
                : "Inicia sesión con tu correo electrónico y contraseña."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="p-3 rounded-lg text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Google Fast Authentication Button (Solo para registrar empresa) */}
            {isRegister && regStep === 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full h-10 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2.5 font-medium shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.41 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.59 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Registrarse con Google</span>
                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    Calendar Auto-Sync
                  </Badge>
                </Button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                  <span className="bg-white dark:bg-zinc-900 px-2 text-[11px] text-zinc-400 uppercase tracking-wider shrink-0">
                    o con tu correo
                  </span>
                </div>
              </>
            )}

            {/* FLOW A: Registration Step 1 */}
            {isRegister && regStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Nombre de la Empresa o Negocio
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ej. Estudio Jurídico, Nexo Cloud, Wellness Spa..."
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Sector o Industria
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="Salud y Consultorios Médicos">Salud y Consultorios Médicos</option>
                    <option value="Servicios Legales y Jurídicos">Servicios Legales y Jurídicos</option>
                    <option value="Tecnología, Cloud & Soporte TI">Tecnología, Cloud & Soporte TI</option>
                    <option value="Bienestar, Spa & Belleza">Bienestar, Spa & Belleza</option>
                    <option value="Servicios Profesionales y Consultoría">Servicios Profesionales y Consultoría</option>
                    <option value="Comercio y Retail">Comercio y Retail</option>
                    <option value="Otro">Otro (Especificar sector o gremio)</option>
                  </select>
                  {industry === "Otro" && (
                    <Input
                      required
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      placeholder="Escribe tu sector o gremio (ej. Restaurantes, Construcción...)"
                      className="h-9 text-xs mt-1.5"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Correo Electrónico (Recibirá código de verificación)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@tuempresa.com"
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs shadow-md mt-2"
                >
                  {isLoading ? "Enviando código..." : "Enviar Código de Verificación"}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </form>
            )}

            {/* FLOW B: Registration Step 2 (OTP Verification) */}
            {isRegister && regStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">

                <div className="space-y-1.5 text-center">
                  <label className="font-semibold text-zinc-800 dark:text-zinc-200 block text-xs">
                    Código de Seguridad (6 dígitos)
                  </label>
                  <div className="relative max-w-[220px] mx-auto">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-indigo-500" />
                    <Input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="pl-9 h-11 text-center font-mono text-xl tracking-[0.3em] font-bold border-indigo-300 dark:border-indigo-700 focus:border-indigo-600"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Enviado a <strong>{email}</strong> (vence en 10 min)
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10 text-xs shadow-md font-semibold"
                >
                  {isLoading ? "Verificando en base de datos..." : "Verificar y Crear Empresa"}
                  <CheckCircle2 className="ml-1.5 h-4 w-4" />
                </Button>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="text-zinc-500 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Corregir datos
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Reenviar código
                  </button>
                </div>
              </form>
            )}

            {/* Google Fast Authentication Button (Para iniciar sesión) */}
            {!isRegister && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full h-10 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2.5 font-medium shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.41 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.59 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </Button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                  <span className="bg-white dark:bg-zinc-900 px-2 text-[11px] text-zinc-400 uppercase tracking-wider shrink-0">
                    o con tu contraseña
                  </span>
                </div>
              </>
            )}

            {/* FLOW C: Standard Login */}
            {!isRegister && (
              <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@tuempresa.com"
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs shadow-md mt-2"
                >
                  {isLoading ? "Validando credenciales..." : "Ingresar al Panel"}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5 pt-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Autenticación Criptográfica JWT y Aislamiento por Tenant (PostgreSQL RLS)</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Cargando Zolution...</span>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
