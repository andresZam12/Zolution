"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZabioBandLogo } from "@/components/zabio-logo";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "brand" | "neutral";

const TONE_PILL: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  brand: "bg-brand-soft text-brand-text",
  neutral: "bg-muted text-muted-foreground",
};

/** Encabezado común: banda café con título Fraunces, igual al saludo de Resumen. */
export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="z-band z-rise px-6 py-5 sm:px-8 sm:py-6">
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-x-8">
        <div className="col-start-1 row-start-1 min-w-0">
          <p className="z-kicker flex items-center gap-2">
            <span className="z-live-dot" />
            {kicker}
          </p>
          <h1 className="z-title mt-2 text-3xl sm:text-4xl">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm leading-snug text-on-coffee-soft">{description}</p>
          )}
        </div>
        {actions && (
          <div className="col-start-1 row-start-2 flex flex-wrap items-center gap-4 lg:col-start-2 lg:row-start-1">
            {actions}
          </div>
        )}
        <div className="col-start-2 row-span-2 row-start-1 lg:col-start-3 lg:row-span-1">
          <ZabioBandLogo />
        </div>
      </div>
    </header>
  );
}

export type SectionTone = "orange" | "green" | "purple" | "coffee";

/** Card con cabecera de color: el bloque base de todas las pantallas. */
export function SectionCard({
  tone = "coffee",
  icon: Icon,
  kicker,
  title,
  action,
  className,
  bodyClassName,
  children,
}: {
  tone?: SectionTone;
  icon: React.ComponentType<{ className?: string }>;
  kicker: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("z-card flex h-full flex-col overflow-hidden", className)}>
      <div className={cn("z-section-head", `z-tone-${tone}`)}>
        <span className="z-icon-chip">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="z-kicker">{kicker}</p>
          <h2 className="z-title mt-0.5 text-2xl">{title}</h2>
        </div>
        {action}
      </div>
      <div className={cn("flex-1 p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Aparece con el mismo movimiento de la landing, escalonado por `delay`. */
export function Rise({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("z-rise", className)}
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        TONE_PILL[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Aviso de una línea: siempre dice qué pasó y, si aplica, se puede cerrar. */
export function Notice({
  tone,
  children,
  onDismiss,
  dismissLabel = "Cerrar aviso",
  className,
}: {
  tone: "success" | "warning" | "danger" | "brand";
  children: React.ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "danger" ? AlertCircle : Info;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "z-rise flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm leading-snug",
        TONE_PILL[tone],
        className
      )}
    >
      <Icon className="mt-px h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 font-medium">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="-m-1 cursor-pointer rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("z-rise flex flex-col items-center px-6 py-12 text-center", className)}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-text">
        <Icon className="h-5 w-5" />
      </span>
      <p className="z-title mt-4 text-xl">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-[0.8rem] font-semibold text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** Interruptor segmentado para filtros y para Entrar / Crear cuenta. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
}) {
  return (
    <div className={cn("flex rounded-full bg-muted p-1 text-[0.8rem]", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 font-semibold transition-all",
            value === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function TypingDots({ label }: { label: string }) {
  return (
    <span className="z-typing" role="status" aria-label={label}>
      <i />
      <i />
      <i />
    </span>
  );
}

/** Ventana centrada de la marca; cierra con Escape y con clic fuera. */
export function Modal({
  onClose,
  labelledBy,
  className,
  children,
}: {
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="z-page fixed inset-0 z-50 flex items-center justify-center bg-coffee/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn("z-card z-rise w-full max-w-md shadow-2xl", className)}
      >
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal onClose={onCancel} labelledBy="confirm-title" className="max-w-sm p-6">
      <h2 id="confirm-title" className="z-title text-2xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

const AVATAR_TONES = ["z-tone-orange", "z-tone-green", "z-tone-purple", "z-tone-coffee"];

/** Iniciales de un nombre; los números de teléfono no tienen, así que muestra "·". */
export function PersonAvatar({ name }: { name: string }) {
  const initials = (name.match(/\p{L}+/gu) ?? [])
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
  const tone = AVATAR_TONES[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full font-mono text-xs font-medium shadow-[0_4px_10px_rgb(42_26_16/28%)]",
        tone
      )}
    >
      {initials || "·"}
    </span>
  );
}

/** Mantiene el chat en el último mensaje cada vez que cambia `trigger`. */
export function useAutoScroll(trigger: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [trigger]);
  return ref;
}

/** Cuenta hasta el valor real. Si no hay dato, muestra la raya tal cual. */
export function AnimatedValue({ value }: { value: string }) {
  const match = /^(\d+(?:\.\d+)?)(.*)$/.exec(value);
  const target = match ? Number(match[1]) : null;
  const suffix = match ? match[2] : "";
  const decimals = match?.[1].split(".")[1]?.length ?? 0;
  const [shown, setShown] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = reduceMotion ? 1 : Math.min((now - start) / 800, 1);
      setShown(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target]);

  if (target === null) return <>{value}</>;
  return (
    <>
      {shown.toFixed(decimals)}
      {suffix}
    </>
  );
}
