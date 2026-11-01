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
  ShieldCheck,
  LogOut,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { AppLanguage, getAppLanguage } from "@/lib/tenant";

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
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const navigation = [
    {
      name: lang === "en" ? "Overview" : "Resumen",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: lang === "en" ? "My Agent" : "Mi Agente",
      href: "/agent",
      icon: Bot,
      badge: "IA",
    },
    {
      name: lang === "en" ? "Conversations" : "Conversaciones",
      href: "/conversations",
      icon: MessageSquare,
    },
    {
      name: lang === "en" ? "Appointments" : "Citas",
      href: "/appointments",
      icon: Calendar,
    },
    {
      name: lang === "en" ? "Connections" : "Conexiones",
      href: "/integrations",
      icon: Cable,
    },
    {
      name: lang === "en" ? "Settings" : "Ajustes",
      href: "/settings",
      icon: Settings,
    },
  ];

  const currentBreadcrumb = () => {
    const found = navigation.find((item) => item.href === pathname);
    if (found) return found.name;
    if (pathname === "/onboarding") {
      return lang === "en" ? "Initial Setup" : "Configuración Inicial";
    }
    return lang === "en" ? "Overview" : "Resumen";
  };

  useEffect(() => {
    const isDark =
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }

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
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  };

  if (pathname === "/login") {
    return <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">{children}</main>;
  }

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold animate-pulse shadow-sm">
            Z
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            {lang === "en" ? "Loading your workspace..." : "Cargando tu espacio..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
            Z
          </div>
          <span className="font-semibold text-lg tracking-tight">Zolution</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={lang === "en" ? "Cambiar a Español" : "Switch to English"}
          >
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <span>{lang.toUpperCase()}</span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Alternar tema"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Sidebar for Desktop & Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Logo & Business Card */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-xs">
                Z
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight tracking-tight">Zolution</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {lang === "en" ? "Smart Assistant" : "Asistente Inteligente"}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/settings"
            title={
              lang === "en"
                ? "Click to edit your business profile"
                : "Clic para editar los datos de tu negocio"
            }
            className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-800 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <div className="truncate text-left">
                <p className="text-xs font-semibold truncate text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {orgName}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {orgIndustry}
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area with Theme Toggle & Logout */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {lang === "en" ? "Protected Account" : "Cuenta Protegida"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              title={lang === "en" ? "Toggle theme" : "Alternar tema"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400"
              title={lang === "en" ? "Sign out" : "Cerrar sesión"}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/70 dark:border-zinc-800/70 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
              {lang === "en" ? "Workspace" : "Panel"}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {currentBreadcrumb()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Simple Visual Status Indicators */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {lang === "en" ? "WhatsApp: Connected" : "WhatsApp: Conectado"}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {lang === "en" ? "Agent: Active" : "Agente: Activo"}
            </div>

            {/* Global Language Selector (ES / EN) */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              title={lang === "en" ? "Cambiar idioma a Español" : "Switch language to English"}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className={lang === "es" ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-zinc-400"}>
                ES
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className={lang === "en" ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-zinc-400"}>
                EN
              </span>
            </button>

            {/* User Profile Pill */}
            {(userEmail || userName) && (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200/80 dark:border-zinc-800">
                {userPicture ? (
                  <img
                    src={userPicture}
                    alt={userName || userEmail}
                    className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                    {(userName || userEmail || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 max-w-[130px] truncate leading-tight">
                    {userName || userEmail.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-[130px] truncate leading-tight">
                    {userEmail}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
