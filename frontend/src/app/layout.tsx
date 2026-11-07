import type { Metadata } from "next";
import { DM_Mono, Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { DashboardLayout } from "@/components/dashboard-layout";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Zabio",
  description:
    "Un agente de IA que atiende por WhatsApp y organiza tus citas en Google Calendar.",
  icons: {
    icon: [
      { url: "/brand/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/brand/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/brand/apple-icon.png",
  },
};

// Aplica el tema guardado antes de pintar para evitar el destello claro.
const themeScript = `try{if(localStorage.getItem("zolution_theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${fraunces.variable} ${dmMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
