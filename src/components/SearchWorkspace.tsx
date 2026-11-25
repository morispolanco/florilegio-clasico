"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Clock, Lock } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { QuoteCard } from "@/components/QuoteCard";
import { SearchSkeleton } from "@/components/SearchSkeleton";
import {
  FUNCTION_OPTIONS,
  GENRE_OPTIONS,
  TRADITION_OPTIONS,
  getFunctionLabel,
  getGenreLabel,
  type CitationFunction,
  type ClassicalTradition,
  type SavedQuoteRecord,
  type SearchApiResponse,
  type SearchHistoryRecord,
  type WorkGenre,
} from "@/types/florilegio";

export function SearchWorkspace() {
  const { user, loading: authLoading } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [promptText, setPromptText] = useState("");
  const [citationFunction, setCitationFunction] =
    useState<CitationFunction>("ilustracion");
  const [workGenre, setWorkGenre] = useState<WorkGenre>("ensayo");
  const [tradition, setTradition] = useState<ClassicalTradition>("todas");

  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchApiResponse | null>(null);

  const [recentSaved, setRecentSaved] = useState<SavedQuoteRecord[]>([]);
  const [recentHistory, setRecentHistory] = useState<SearchHistoryRecord[]>([]);

  const isAuthorized = Boolean(
    user && (user.isAuthorized || user.role === "admin")
  );

  useEffect(() => {
    if (user?.workGenrePref) {
      setWorkGenre(user.workGenrePref);
    }
  }, [user?.workGenrePref]);

  const loadPersonalSummary = useCallback(async () => {
    if (!user || !isAuthorized) {
      setRecentSaved([]);
      setRecentHistory([]);
      return;
    }
    try {
      const [savedRes, historyRes] = await Promise.all([
        fetch("/api/saved", { cache: "no-store" }),
        fetch("/api/history", { cache: "no-store" }),
      ]);
      if (savedRes.ok) {
        const savedData = (await savedRes.json()) as {
          quotes?: SavedQuoteRecord[];
        };
        setRecentSaved((savedData.quotes ?? []).slice(0, 4));
      }
      if (historyRes.ok) {
        const historyData = (await historyRes.json()) as {
          history?: SearchHistoryRecord[];
        };
        setRecentHistory((historyData.history ?? []).slice(0, 4));
      }
    } catch {
      // Silencioso en la vista resumida
    }
  }, [user, isAuthorized]);

  useEffect(() => {
    void loadPersonalSummary();
  }, [loadPersonalSummary]);

  const executeSearch = async (params?: {
    overridePrompt?: string;
    overrideFunction?: CitationFunction;
    overrideGenre?: WorkGenre;
  }) => {
    if (!user) {
      setError(
        "Debes iniciar sesión con una cuenta autorizada para utilizar el buscador."
      );
      return;
    }
    if (!isAuthorized) {
      setError(
        "Tu cuenta está pendiente de autorización por el administrador."
      );
      return;
    }

    const activePrompt = (params?.overridePrompt ?? promptText).trim();
    const activeFunction = params?.overrideFunction ?? citationFunction;
    const activeGenre = params?.overrideGenre ?? workGenre;

    if (activePrompt.length < 3) {
      setError(
        "Escribe una frase, concepto o problema de al menos 3 caracteres."
      );
      return;
    }

    setError(null);
    setIsSearching(true);
    setResult(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText: activePrompt,
          citationFunction: activeFunction,
          workGenre: activeGenre,
          tradition,
        }),
      });

      const rawText = await response.text();
      let data: (SearchApiResponse & { error?: string }) | null = null;
      try {
        data = JSON.parse(rawText) as SearchApiResponse & { error?: string };
      } catch {
        throw new Error(
          response.status === 504
            ? "La consulta superó el tiempo límite del servidor en Vercel. Intenta de nuevo o configura un modelo rápido (como google/gemini-2.5-flash) en OPENROUTER_PRIMARY_MODEL."
            : `El servidor devolvió una respuesta inesperada (HTTP ${response.status}). Revisa las variables de entorno en Vercel.`
        );
      }

      if (!response.ok || !data) {
        throw new Error(
          data?.error ||
            "No fue posible recuperar citas clásicas en este momento."
        );
      }

      setResult(data);
      void loadPersonalSummary();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al realizar la búsqueda."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void executeSearch();
  };

  const handleStartSearchClick = () => {
    const section = document.getElementById("buscar");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => textareaRef.current?.focus(), 350);
  };

  const handleTryExample = () => {
    const examplePrompt =
      "Las instituciones decaen cuando olvidan el propósito moral que les dio origen y se limitan a conservar sus formas externas.";
    setPromptText(examplePrompt);
    setCitationFunction("argumento");
    setWorkGenre("ensayo");
    const section = document.getElementById("resultados");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    void executeSearch({
      overridePrompt: examplePrompt,
      overrideFunction: "argumento",
      overrideGenre: "ensayo",
    });
  };

  const handleOpenHistoryItem = (item: SearchHistoryRecord) => {
    setPromptText(item.promptText);
    setCitationFunction(item.citationFunction);
    setWorkGenre(item.workGenre);
    setTradition(item.tradition);
    setResult({
      promptText: item.promptText,
      citationFunction: item.citationFunction,
      workGenre: item.workGenre,
      tradition: item.tradition,
      modelUsed: item.modelUsed || "OpenRouter",
      usedFallback: false,
      historyId: item.id,
      citas: item.resultsJson,
    });
    document
      .getElementById("resultados")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-16">
      {/* 1. HERO EDITORIAL DE DOS COLUMNAS */}
      <section className="no-print grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center pt-4 sm:pt-8">
        <div className="lg:col-span-7 space-y-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-600">
            ESCRITURA · HUMANIDADES · CITA CLÁSICA
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-ink-900 leading-[1.06]">
            Encuentra la cita clásica exacta para iluminar tu obra.
          </h1>

          <p className="text-base sm:text-[17px] text-ink-500 leading-relaxed max-w-xl">
            Introduce una frase de tu borrador, un concepto o un problema
            intelectual. Florilegio Clásico selecciona pasajes auténticos de la
            tradición occidental con su contexto original, puente conceptual y
            guía de inserción.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleStartSearchClick}
              className="px-6 py-3 rounded-full bg-navy-700 text-white text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm"
            >
              Buscar una cita
            </button>
            <button
              type="button"
              onClick={handleTryExample}
              disabled={isSearching || !isAuthorized}
              className="px-6 py-3 rounded-full border border-parchment-300 bg-white text-ink-900 text-sm font-semibold hover:bg-parchment-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ver ejemplo
            </button>
          </div>
        </div>

        {/* Tarjeta destacada de Montaigne (columna derecha) */}
        <div className="lg:col-span-5">
          <div className="rounded-[28px] bg-ivory border border-parchment-200 p-3 shadow-editorial">
            <div className="rounded-[22px] border border-parchment-200/90 bg-parchment-50/40 p-6 sm:p-7 space-y-5">
              <div className="space-y-2.5">
                <p className="font-serif italic text-xl sm:text-[22px] leading-snug text-ink-700">
                  «Las abejas liban aquí y allá las flores, pero luego hacen con
                  ellas una miel que es toda suya.»
                </p>
                <p className="font-serif text-base font-bold text-ink-900">
                  Michel de Montaigne, Ensayos (I, 26)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="rounded-2xl bg-white border border-parchment-200 px-3 py-3 text-center">
                  <span className="text-xs font-semibold text-ink-900 leading-tight block">
                    Contexto original
                  </span>
                </div>
                <div className="rounded-2xl bg-white border border-parchment-200 px-3 py-3 text-center">
                  <span className="text-xs font-semibold text-ink-900 leading-tight block">
                    Puente conceptual
                  </span>
                </div>
                <div className="rounded-2xl bg-white border border-parchment-200 px-3 py-3 text-center">
                  <span className="text-xs font-semibold text-ink-900 leading-tight block">
                    Inserción en tu texto
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aviso de acceso / autorización */}
      {!authLoading && !user && (
        <div className="no-print rounded-2xl bg-gold-50 border border-gold-100 px-5 py-4 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-900">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-gold-700 shrink-0 mt-0.5" />
            <p>
              <strong>Acceso con cuenta autorizada.</strong> Inicia sesión o
              regístrate para solicitar autorización al administrador y utilizar
              el buscador de citas clásicas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full border border-parchment-300 bg-white text-xs font-semibold text-ink-900 hover:bg-parchment-100"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="px-4 py-1.5 rounded-full bg-navy-700 text-white text-xs font-semibold hover:bg-navy-800"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      )}

      {!authLoading && user && !isAuthorized && (
        <div className="no-print rounded-2xl bg-gold-50 border border-gold-100 px-5 py-4 flex items-start gap-3 text-sm text-ink-900">
          <Clock className="w-5 h-5 text-gold-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-ink-900">
              Cuenta pendiente de autorización
            </p>
            <p className="text-ink-700 mt-0.5">
              Hola, {user.name}. Tu registro fue recibido, pero el administrador
              aún debe autorizar tu cuenta ({user.email}) para habilitar el uso
              de la plataforma.
            </p>
          </div>
        </div>
      )}

      {/* 2. SECCIÓN BÚSQUEDA GUIADA PARA AUTORES */}
      <section id="buscar" className="no-print scroll-mt-24 space-y-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-600">
            BÚSQUEDA EDITORIAL
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink-900 leading-tight">
            Describe la idea, frase o problema que quieres ilustrar
          </h2>
          <p className="text-sm sm:text-base text-ink-500 leading-relaxed">
            Puedes escribir un concepto breve, una pregunta o una frase de tu
            manuscrito. Recibirás citas verificables, su contexto en la obra
            original y cómo integrarlas en tu prosa.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-ivory border border-parchment-200 rounded-[26px] p-5 sm:p-7 shadow-editorial space-y-5"
        >
          {/* Fila 1: Frase/Concepto/Problema (2/3) + Función retórica (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <label
                htmlFor="prompt-text"
                className="block text-xs font-bold text-ink-900 mb-2"
              >
                Frase de tu obra, concepto o problema
              </label>
              <textarea
                ref={textareaRef}
                id="prompt-text"
                rows={2}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                disabled={!isAuthorized}
                placeholder="Ej.: la fragilidad del poder, por qué la prisa empobrece el criterio, o pega una frase de tu capítulo..."
                maxLength={600}
                required
                className="w-full px-4 py-3 rounded-2xl border border-parchment-200 bg-white text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-colors resize-none disabled:opacity-60 disabled:bg-parchment-100/60"
              />
            </div>

            <div>
              <label
                htmlFor="function-select"
                className="block text-xs font-bold text-ink-900 mb-2"
              >
                Función de la cita en tu obra
              </label>
              <select
                id="function-select"
                value={citationFunction}
                disabled={!isAuthorized}
                onChange={(e) =>
                  setCitationFunction(e.target.value as CitationFunction)
                }
                className="w-full px-4 py-3 rounded-2xl border border-parchment-200 bg-white text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-colors disabled:opacity-60"
              >
                {FUNCTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 2: Género de obra (1/3) + Tradición o época (1/3) + Botón (1/3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label
                htmlFor="genre-select"
                className="block text-xs font-bold text-ink-900 mb-2"
              >
                Género o registro de tu obra
              </label>
              <select
                id="genre-select"
                value={workGenre}
                disabled={!isAuthorized}
                onChange={(e) => setWorkGenre(e.target.value as WorkGenre)}
                className="w-full px-4 py-3 rounded-2xl border border-parchment-200 bg-white text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-colors disabled:opacity-60"
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tradition-select"
                className="block text-xs font-bold text-ink-900 mb-2"
              >
                Tradición o época
              </label>
              <select
                id="tradition-select"
                value={tradition}
                disabled={!isAuthorized}
                onChange={(e) =>
                  setTradition(e.target.value as ClassicalTradition)
                }
                className="w-full px-4 py-3 rounded-2xl border border-parchment-200 bg-white text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-navy-700/20 focus:border-navy-700 transition-colors disabled:opacity-60"
              >
                {TRADITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSearching || !isAuthorized}
              className="w-full px-6 py-3 rounded-full bg-navy-700 text-white text-sm font-semibold hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-700/35 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? "Buscando citas..." : "Buscar citas clásicas"}
            </button>
          </div>
        </form>
      </section>

      {/* 3. SECCIÓN RESULTADOS */}
      <section id="resultados" className="scroll-mt-24 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-600">
              RESULTADOS
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
              Citas recomendadas para tu obra
            </h2>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            disabled={!result || isSearching}
            className="no-print px-5 py-2.5 rounded-full border border-parchment-300 bg-white text-xs sm:text-sm font-semibold text-ink-900 hover:bg-parchment-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Imprimir resultados
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 flex items-start gap-3 text-sm text-red-900"
          >
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">No se pudo completar la consulta</p>
              <p className="text-red-800 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {isSearching && <SearchSkeleton />}

        {result && !isSearching && (
          <div className="space-y-6">
            {result.citas.map((quote, idx) => (
              <QuoteCard
                key={`${quote.autor}-${quote.obra}-${idx}`}
                quote={quote}
                promptText={result.promptText}
                citationFunction={result.citationFunction}
                workGenre={result.workGenre}
                index={idx}
                onSaved={() => void loadPersonalSummary()}
              />
            ))}
          </div>
        )}

        {!result && !isSearching && !error && (
          <div className="rounded-2xl border border-dashed border-parchment-300 bg-ivory/70 px-6 py-6 text-sm text-ink-500">
            Introduce una frase, concepto o problema para recibir citas clásicas
            con contexto filológico y guía de inserción.
          </div>
        )}
      </section>

      {/* 4. PANEL INFERIOR DE 2 COLUMNAS: MI FLORILEGIO & HISTORIAL */}
      <section className="no-print grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <div className="bg-ivory border border-parchment-200 rounded-[26px] p-6 shadow-editorial space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-2xl font-bold text-ink-900">
              Mi florilegio
            </h3>
            <Link
              href="/panel"
              className="px-4 py-1.5 rounded-full border border-parchment-300 bg-white text-xs font-semibold text-ink-900 hover:bg-parchment-100 transition-colors"
            >
              Ver todo
            </Link>
          </div>

          {!user ? (
            <div className="rounded-2xl border border-dashed border-parchment-300 bg-parchment-50/50 p-5 text-sm text-ink-500 flex flex-wrap items-center justify-between gap-3">
              <span>Inicia sesión para guardar citas en tu florilegio.</span>
              <Link
                href="/login"
                className="text-xs font-semibold text-navy-700 hover:underline"
              >
                Iniciar sesión →
              </Link>
            </div>
          ) : !isAuthorized ? (
            <div className="rounded-2xl border border-dashed border-parchment-300 bg-parchment-50/50 p-5 text-sm text-ink-500">
              Disponible una vez que el administrador autorice tu cuenta.
            </div>
          ) : recentSaved.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-parchment-300 bg-parchment-50/50 p-5 text-sm text-ink-500">
              Aún no has guardado citas en tu florilegio.
            </div>
          ) : (
            <div className="space-y-3">
              {recentSaved.map((item) => (
                <Link
                  key={item.id}
                  href="/panel"
                  className="block rounded-2xl border border-parchment-200 bg-white px-4 py-3.5 hover:border-navy-700/40 transition-colors"
                >
                  <p className="text-sm font-bold text-ink-900">
                    {item.author} ·{" "}
                    <span className="font-serif italic font-semibold">
                      {item.work}
                    </span>
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">
                    {getFunctionLabel(item.citationFunction)} ·{" "}
                    {getGenreLabel(item.workGenre)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-ivory border border-parchment-200 rounded-[26px] p-6 shadow-editorial space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-2xl font-bold text-ink-900">
              Historial de consultas
            </h3>
            <Link
              href="/panel?tab=history"
              className="px-4 py-1.5 rounded-full border border-parchment-300 bg-white text-xs font-semibold text-ink-900 hover:bg-parchment-100 transition-colors"
            >
              Ver todo
            </Link>
          </div>

          {!user ? (
            <div className="rounded-2xl border border-dashed border-parchment-300 bg-parchment-50/50 p-5 text-sm text-ink-500 flex flex-wrap items-center justify-between gap-3">
              <span>
                Inicia sesión para conservar tu historial de consultas.
              </span>
              <Link
                href="/login"
                className="text-xs font-semibold text-navy-700 hover:underline"
              >
                Iniciar sesión →
              </Link>
            </div>
          ) : !isAuthorized ? (
            <div className="rounded-2xl border border-dashed border-parchment-300 bg-parchment-50/50 p-5 text-sm text-ink-500">
              Disponible una vez que el administrador autorice tu cuenta.
            </div>
          ) : recentHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-parchment-300 bg-parchment-50/50 p-5 text-sm text-ink-500">
              Todavía no hay consultas en tu historial.
            </div>
          ) : (
            <div className="space-y-3">
              {recentHistory.map((item) => {
                const dateLabel = new Date(item.createdAt).toLocaleString(
                  "es-ES",
                  {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpenHistoryItem(item)}
                    className="w-full text-left rounded-2xl border border-parchment-200 bg-white px-4 py-3.5 hover:border-navy-700/40 transition-colors"
                  >
                    <p className="text-sm font-bold text-ink-900 line-clamp-1">
                      {item.promptText}
                    </p>
                    <p className="text-xs text-ink-500 mt-0.5">
                      {getFunctionLabel(item.citationFunction)} ·{" "}
                      {getGenreLabel(item.workGenre)} · {dateLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
