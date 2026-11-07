import { WhatsAppIcon } from "@/components/brand-icons";
import { AppLanguage } from "@/lib/tenant";

const SUPPORT_WHATSAPP_NUMBER = "573177199202";

export function buildSupportWhatsAppUrl(lang: AppLanguage, businessName: string) {
  const message =
    lang === "en"
      ? `Hi, I'm from ${businessName}. I want to connect my WhatsApp to my Zabio agent.`
      : `Hola, soy de ${businessName}. Quiero conectar mi WhatsApp a mi agente de Zabio.`;
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

interface WhatsAppContactButtonProps {
  lang: AppLanguage;
  businessName: string;
}

export function WhatsAppContactButton({ lang, businessName }: WhatsAppContactButtonProps) {
  const label =
    lang === "en" ? "Connect your WhatsApp, we'll help" : "Conecta tu WhatsApp, te ayudamos";

  return (
    <a
      href={buildSupportWhatsAppUrl(lang, businessName)}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="group fixed right-5 bottom-5 z-40 block rounded-full"
    >
      <span className="pointer-events-none absolute top-1/2 right-full mr-2.5 hidden -translate-y-1/2 translate-x-2 rounded-full border border-border bg-card px-4 py-2.5 text-[0.8rem] font-bold whitespace-nowrap text-foreground opacity-0 shadow-[0_4px_10px_rgb(20_10_5/45%),0_14px_28px_rgb(20_10_5/55%)] transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:block">
        {label}
      </span>
      <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-white bg-[#0a8a42] text-white shadow-[0_4px_10px_rgb(20_10_5/50%),0_14px_28px_rgb(20_10_5/60%)] transition-transform group-hover:scale-105">
        <WhatsAppIcon className="h-7 w-7" />
      </span>
    </a>
  );
}
