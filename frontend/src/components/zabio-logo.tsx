import Image from "next/image";
import { cn } from "@/lib/utils";

interface ZabioMarkProps {
  size?: number;
  /** "auto" sigue el tema; "white" es para fondos café. */
  tone?: "auto" | "white";
  className?: string;
}

export function ZabioMark({ size = 30, tone = "auto", className }: ZabioMarkProps) {
  const shared = { width: size, height: size, priority: true };

  if (tone === "white") {
    return (
      <Image
        alt=""
        {...shared}
        src="/brand/zabio-white.png"
        className={cn("object-contain", className)}
      />
    );
  }

  return (
    <>
      <Image
        alt=""
        {...shared}
        src="/brand/zabio-black.png"
        className={cn("object-contain dark:hidden", className)}
      />
      <Image
        alt=""
        {...shared}
        src="/brand/zabio-white.png"
        className={cn("hidden object-contain dark:block", className)}
      />
    </>
  );
}

export function ZabioLogo({ size = 30, tone = "auto", className }: ZabioMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ZabioMark size={size} tone={tone} />
      <span className="text-xl font-extrabold tracking-[-0.05em]">Zabio</span>
    </span>
  );
}

/** Logo gigante y tenue que flota detrás de las bandas café, como en la landing. */
export function ZabioWatermark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/zabio-white.png"
      alt=""
      aria-hidden="true"
      width={420}
      height={420}
      className={cn("z-watermark object-contain", className)}
    />
  );
}

/** Logo sólido de las bandas café: completo y a la derecha del encabezado. */
export function ZabioBandLogo() {
  return (
    <Image
      src="/brand/zabio-white.png"
      alt=""
      aria-hidden="true"
      width={96}
      height={96}
      priority
      className="z-band-logo h-14 w-14 shrink-0 object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24"
    />
  );
}

/** Marca de agua de Resumen: cubre la pantalla sin bloquear clics ni lectura. */
export function ZabioPageWatermark() {
  const shared = {
    "aria-hidden": true,
    width: 440,
    height: 440,
    className: "z-page-mark h-72 w-72 object-contain md:h-[27rem] md:w-[27rem]",
  };
  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 left-0 z-20 flex items-center justify-center overflow-hidden md:left-64">
      <span className="contents dark:hidden">
        <Image alt="" {...shared} src="/brand/zabio-black.png" />
      </span>
      <span className="hidden dark:contents">
        <Image alt="" {...shared} src="/brand/zabio-white.png" />
      </span>
    </div>
  );
}
