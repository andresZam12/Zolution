"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Calendar,
  Cable,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { WhatsAppContactButton } from "@/components/whatsapp-contact-button";
import { ZabioLogo, ZabioMark } from "@/components/zabio-logo";
import { StatusPill } from "@/components/zabio-ui";
import { apiFetch } from "@/lib/api";
import { AppLanguage, getAppLanguage } from "@/lib/tenant";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lang, setLang] = useState<AppLanguage>("es");
  const [orgName, setOrgName] = useState<string>("Mi Negocio");
  const [orgIndustry, setOrgIndustry] = useState<string>("Cuenta Activa");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userPicture, setUserPicture] = useState<string>("");
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const navigation = [
    { name: lang === "en" ? "Overview" : "Resumen", href: "/", icon: LayoutDashboard },
    { name: lang === "en" ? "My agent" : "Mi agente", href: "/agent", icon: Bot },
    {
      name: lang === "en" ? "Conversations" : "Conversaciones",
      href: "/conversations",
      icon: MessageSquare,
    },
    { name: lang === "en" ? "Appointments" : "Citas", href: "/appointments", icon: Calendar },
    { name: lang === "en" ? "Connections" : "Conexiones", href: "/integrations", icon: Cable },
    { name: lang === "en" ? "Settings" : "Ajustes", href: "/settings", icon: Settings },
  ];

  useEffect(() => {
    const isDark = localStorage.getItem("zolution_theme") === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    setIsDarkMode(isDark);

    if (pathname !== "/login") {
      const token =
        localStorage.getItem("zolution_token") ||
        localStorage.getItem("zolution_auth_token") ||
        localStorage.getItem("zolution_org_id");

      if (!token) {
        router.replace("/login");
        return;
      }
    }

    const loadTenant = () => {
      const savedName = localStorage.getItem("zolution_org_name");
      const savedIndustry = localStorage.getItem("zolution_org_industry");
      const savedEmail = localStorage.getItem("zolution_user_email");
      const savedUserName = localStorage.getItem("zolution_user_name");
      const savedPicture = localStorage.getItem("zolution_user_picture");
      if (savedName) setOrgName(savedName);
      if (savedIndustry) setOrgIndustry(savedIndustry);
      if (savedEmail) setUserEmail(savedEmail);
      if (savedUserName) setUserName(savedUserName);
      if (savedPicture) setUserPicture(savedPicture);
      setLang(getAppLanguage());
    };

    loadTenant();
    setIsAuthChecked(true);

    if (pathname !== "/login") {
      const authTok =
        localStorage.getItem("zolution_token") || localStorage.getItem("zolution_auth_token");
      if (authTok) {
        Promise.all([
          apiFetch<{ id?: string; name?: string; slug?: string }>("/organizations/me").catch(
            () => null
          ),
          apiFetch<{
            status?: string;
            system_prompt_generated?: string | null;
            onboarding_answers?: Record<string, unknown> | null;
          }>("/agents/me").catch(() => null),
        ]).then(([orgRes, agentRes]) => {
          let changed = false;
          if (orgRes?.name) {
            localStorage.setItem("zolution_org_name", orgRes.name);
            setOrgName(orgRes.name);
            changed = true;
          }
          if (orgRes?.id) localStorage.setItem("zolution_org_id", orgRes.id);
          if (orgRes?.slug) localStorage.setItem("zolution_org_slug", orgRes.slug);

          setAgentStatus(agentRes?.status ?? null);

          const dbIndustry = (agentRes?.onboarding_answers?.industry ||
            agentRes?.onboarding_answers?.business_type) as string | undefined;
          if (dbIndustry) {
            localStorage.setItem("zolution_org_industry", dbIndustry);
            setOrgIndustry(dbIndustry);
            changed = true;
          }
          if (agentRes?.system_prompt_generated) {
            localStorage.setItem("zolution_agent_prompt", agentRes.system_prompt_generated);
            changed = true;
          }
          if (changed) {
            window.dispatchEvent(new Event("storage"));
          }
        });
      }
    }

    window.addEventListener("storage", loadTenant);
    return () => window.removeEventListener("storage", loadTenant);
  }, [pathname, router]);

  const toggleLanguage = () => {
    const nextLang: AppLanguage = lang === "es" ? "en" : "es";
    localStorage.setItem("zolution_lang", nextLang);
    setLang(nextLang);
    window.dispatchEvent(new Event("storage"));
  };

  const handleLogout = () => {
    localStorage.removeItem("zolution_token");
    localStorage.removeItem("zolution_auth_token");
    localStorage.removeItem("zolution_org_id");
    localStorage.removeItem("zolution_org_slug");
    localStorage.removeItem("zolution_org_name");
    localStorage.removeItem("zolution_org_industry");
    localStorage.removeItem("zolution_user_email");
    localStorage.removeItem("zolution_user_id");
    localStorage.removeItem("zolution_user_name");
    localStorage.removeItem("zolution_user_picture");
    localStorage.removeItem("zolution_agent_prompt");
    window.dispatchEvent(new Event("storage"));
    router.push("/login");
  };

  const toggleTheme = () => {
    const next = !isDarkMode;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("zolution_theme", next ? "dark" : "light");
    setIsDarkMode(next);
  };

  if (pathname === "/login") {
    return <main className="min-h-screen">{children}</main>;
  }

  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="z-pulse-logo">
          <ZabioMark size={44} />
        </div>
      </div>
    );
  }

  if (pathname === "/onboarding") {
    return <main className="min-h-screen">{children}</main>;
  }

  const agentPill =
    agentStatus === null ? null : agentStatus === "active" ? (
      <StatusPill tone="success">
        <span className="z-live-dot" />
        {lang === "en" ? "Agent active" : "Agente activo"}
      </StatusPill>
    ) : (
      <StatusPill tone="warning">
        {lang === "en" ? "Agent paused" : "Agente en pausa"}
      </StatusPill>
    );

  const languageSwitch = (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex cursor-pointer items-center gap-0.5 rounded-full border border-border bg-card p-1 font-mono text-[0.8rem] font-medium shadow-(--shadow-card) transition-transform hover:-translate-y-0.5"
      title={lang === "en" ? "Cambiar a Español" : "Switch to English"}
      aria-label={lang === "en" ? "Cambiar a Español" : "Switch to English"}
    >
      {(["es", "en"] as const).map((code) => (
        <span
          key={code}
          className={cn(
            "rounded-full px-3.5 py-1.5 uppercase transition-colors",
            lang === code ? "bg-primary text-white" : "text-muted-foreground"
          )}
        >
          {code}
        </span>
      ))}
    </button>
  );

  const displayName = userName || userEmail.split("@")[0];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Encabezado móvil */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-coffee px-4 py-3 text-on-coffee md:hidden">
        <ZabioLogo size={26} tone="white" />
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={
            mobileMenuOpen
              ? lang === "en"
                ? "Close menu"
                : "Cerrar menú"
              : lang === "en"
                ? "Open menu"
                : "Abrir menú"
          }
          aria-expanded={mobileMenuOpen}
          className="cursor-pointer rounded-lg p-1.5"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Barra lateral: siempre café, como la banda superior de la landing */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-out md:sticky md:top-0 md:h-screen md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-5 pt-6 pb-5 text-on-coffee">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <ZabioLogo tone="white" />
          </Link>
        </div>

        <Link
          href="/settings"
          onClick={() => setMobileMenuOpen(false)}
          title={lang === "en" ? "Edit your business" : "Editar tu negocio"}
          className="group mx-3 flex items-center justify-between rounded-xl border border-sidebar-border px-3 py-2.5 transition-colors hover:bg-sidebar-accent"
        >
          <span className="min-w-0">
            <span className="block truncate text-[0.8rem] font-bold text-on-coffee">
              {orgName}
            </span>
            <span className="block truncate text-[0.7rem]">{orgIndustry}</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-on-coffee"
                    : "hover:bg-sidebar-accent/60 hover:text-on-coffee"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand transition-opacity",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    isActive && "text-brand"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 px-1">
            {userPicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userPicture}
                alt=""
                referrerPolicy="no-referrer"
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                {(displayName || "Z").charAt(0).toUpperCase()}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-[0.8rem] font-semibold text-on-coffee">
              {displayName}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="z-side-btn"
              title={lang === "en" ? "Toggle theme" : "Cambiar tema"}
              aria-label={lang === "en" ? "Toggle theme" : "Cambiar tema"}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {isDarkMode
                ? lang === "en"
                  ? "Light"
                  : "Claro"
                : lang === "en"
                  ? "Dark"
                  : "Oscuro"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="z-side-btn z-side-btn-exit"
              title={lang === "en" ? "Sign out" : "Cerrar sesión"}
              aria-label={lang === "en" ? "Sign out" : "Cerrar sesión"}
            >
              <LogOut className="h-5 w-5" />
              {lang === "en" ? "Sign out" : "Salir"}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 lg:px-10 lg:pt-6">
          {agentPill ?? <span />}
          {languageSwitch}
        </div>

        <div key={pathname} className="z-page mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:pt-8">
          {children}
        </div>
      </main>

      <WhatsAppContactButton lang={lang} businessName={orgName} />

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-coffee/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
