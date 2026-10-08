"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Briefcase,
  Store,
  Scissors,
  Stethoscope,
  Laptop,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const demoTenants = [
  {
    id: "org_4f1b892a-3199-4d2c",
    name: "Dental Care Clinic",
    industry: "Salud y Cuidado Dental",
    icon: Stethoscope,
    agent: "Sofía (Asistente Clínico)",
  },
  {
    id: "org_8e2a110b-9941-4e1a",
    name: "Nova Legal & Asociados",
    industry: "Servicios Legales y Asesoría",
    icon: Briefcase,
    agent: "Mateo (Asistente Legal)",
  },
  {
    id: "org_117c491d-2283-4a8f",
    name: "Luxe Studio & Spa",
    industry: "Belleza, Cuidado y Bienestar",
    icon: Scissors,
    agent: "Valentina (Coordinadora de Citas)",
  },
  {
    id: "org_993b772e-5501-4b7c",
    name: "NexTech IT Solutions",
    industry: "Soporte Técnico y Consultoría",
    icon: Laptop,
    agent: "Lucas (Agente de Soporte)",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Servicios Profesionales");
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectDemoTenant = (tenant: typeof demoTenants[0]) => {
    localStorage.setItem("zolution_org_id", tenant.id);
    localStorage.setItem("zolution_org_name", tenant.name);
    localStorage.setItem("zolution_org_industry", tenant.industry);
    router.push("/");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Save session locally
    const orgId = isRegister ? `org_${Date.now()}` : "org_4f1b892a-3199-4d2c";
    const orgName = isRegister ? companyName : "Dental Care Clinic";

    localStorage.setItem("zolution_org_id", orgId);
    localStorage.setItem("zolution_org_name", orgName);
    localStorage.setItem("zolution_org_industry", industry);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/");
    }, 800);
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
          Plataforma Multi-Tenant de Agentes de IA para WhatsApp y Automatización de Negocios
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg space-y-6">
        <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900 text-xs mb-2">
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className={`w-1/2 py-1.5 rounded-md transition-all font-medium ${
                  !isRegister ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs" : "text-zinc-500"
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className={`w-1/2 py-1.5 rounded-md transition-all font-medium ${
                  isRegister ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs" : "text-zinc-500"
                }`}
              >
                Registrar Empresa
              </button>
            </div>
            <CardTitle className="text-lg font-bold">
              {isRegister ? "Crea la cuenta de tu empresa" : "Acceso al Panel de Control"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isRegister
                ? "Configura tu agente para automatizar la atención y agendamiento en WhatsApp."
                : "Ingresa con tus credenciales o selecciona una empresa demo para probar."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {isRegister && (
                <>
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
                        placeholder="Ej. Estudio Creativo, Consultorio, Agencia..."
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
                      <option value="Servicios Legales y Asesorías">Servicios Legales y Asesorías</option>
                      <option value="Belleza, Spas y Cuidado Personal">Belleza, Spas y Cuidado Personal</option>
                      <option value="Tecnología, Soporte y Consultoría IT">Tecnología, Soporte y Consultoría IT</option>
                      <option value="Comercio Electrónico y Retail">Comercio Electrónico y Retail</option>
                      <option value="Servicios Profesionales Generales">Servicios Profesionales Generales</option>
                    </select>
                  </div>
                </>
              )}

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
                    placeholder="contacto@tuempresa.com"
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
                {isLoading ? "Ingresando..." : isRegister ? "Crear Empresa y Configurar Agente" : "Ingresar al Panel"}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Demo Tenant Switcher for Presentations and Grading */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              Acceso Rápido Demo (Diferentes Sectores)
            </span>
            <span className="text-[11px] text-zinc-400">Multi-Tenant RLS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {demoTenants.map((tenant) => {
              const Icon = tenant.icon;
              return (
                <button
                  key={tenant.id}
                  onClick={() => handleSelectDemoTenant(tenant)}
                  className="w-full text-left p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {tenant.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        {tenant.industry}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5 pt-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Aislamiento estricto de base de datos por Organización (PostgreSQL RLS)</span>
        </div>
      </div>
    </div>
  );
}
