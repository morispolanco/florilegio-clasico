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
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <span className="font-serif text-base font-semibold text-navy-700">
                  Florilegio Clásico
                </span>
                <span>·</span>
                <span>Citas clásicas con rigor filológico para tu obra</span>
              </div>

              <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end">
                <a
                  href="mailto:morispolanco@gmail.com"
                  className="text-ink-700 hover:text-navy-700 hover:underline transition-colors"
                >
                  morispolanco@gmail.com
                </a>
                <span className="text-parchment-300">·</span>
                <a
                  href="https://github.com/morispolanco/florilegio-clasico/tree/main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-700 hover:text-navy-700 hover:underline transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
