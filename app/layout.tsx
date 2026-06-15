import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import LanguageProvider from "@/providers/language-provider";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Predictor del Mundial 2026",
    template: "%s | Predictor Mundial 2026",
  },
  description:
    "Elegí dos selecciones y conocé las probabilidades del resultado, calculadas con modelos estadísticos sobre partidos reales.",
  openGraph: {
    type: "website",
    title: "Predictor del Mundial 2026",
    description:
      "Probabilidades estadísticas para cada partido del torneo. Formaciones, análisis y predicciones en tiempo real.",
    locale: "es_AR",
    alternateLocale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full antialiased ${archivo.variable}`} suppressHydrationWarning>
      <head>
        {/* Prevent dark-mode flash: set class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
