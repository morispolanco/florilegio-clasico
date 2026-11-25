import type { Metadata } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Florilegio Clásico — Citas clásicas con rigor filológico para tu obra",
  description:
    "Encuentra pasajes auténticos de la tradición occidental para ilustrar una frase, concepto o problema en tu libro, ensayo, tesis o discurso.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${ebGaramond.variable} ${inter.variable}`}>
      <body className="font-sans bg-parchment-50 text-ink-900 flex flex-col min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="no-print border-t border-parchment-200 bg-ivory/80 mt-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500">
              <div className="flex items-center gap-2">
                <span className="font-serif text-base font-semibold text-navy-700">
                  Florilegio Clásico
                </span>
                <span>·</span>
                <span>Citas clásicas con rigor filológico para tu obra</span>
              </div>
              <p className="text-center sm:text-right">
                Fuentes verificables con contexto original y guía de inserción
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
