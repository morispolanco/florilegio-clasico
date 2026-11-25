"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  BookOpenText,
  Check,
  Compass,
  Copy,
  Feather,
  Info,
  Link2,
  Printer,
  Quote,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  formatFullCardForClipboard,
  formatQuoteOnlyForClipboard,
  printQuoteSheet,
} from "@/lib/printSheet";
import {
  getFunctionShortLabel,
  getGenreShortLabel,
  type CitationFunction,
  type ClassicalQuoteItem,
  type WorkGenre,
} from "@/types/florilegio";

interface QuoteCardProps {
  quote: ClassicalQuoteItem;
  promptText: string;
  citationFunction: CitationFunction;
  workGenre: WorkGenre;
  index?: number;
  savedId?: string;
  onSaved?: () => void;
  onDeleteSaved?: (id: string) => Promise<void>;
}

export function QuoteCard({
  quote,
  promptText,
  citationFunction,
  workGenre,
  index,
  savedId,
  onSaved,
  onDeleteSaved,
}: QuoteCardProps) {
  const { user } = useAuth();
  const [copiedMode, setCopiedMode] = useState<"quote" | "full" | null>(null);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(savedId));
  const [deleting, setDeleting] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [authPrompt, setAuthPrompt] = useState(false);

  const cleanQuote = quote.cita.replace(/^«|»$/g, "").trim();

  const handleCopyQuoteOnly = async () => {
    try {
      await navigator.clipboard.writeText(formatQuoteOnlyForClipboard(quote));
      setCopiedMode("quote");
      setTimeout(() => setCopiedMode(null), 2400);
    } catch {
      setSaveFeedback("No se pudo copiar automáticamente al portapapeles.");
    }
  };

  const handleCopyFull = async () => {
    try {
      await navigator.clipboard.writeText(
        formatFullCardForClipboard({
          quote,
          promptText,
          citationFunction,
          workGenre,
        })
      );
      setCopiedMode("full");
      setTimeout(() => setCopiedMode(null), 2400);
    } catch {
      setSaveFeedback("No se pudo copiar automáticamente al portapapeles.");
    }
  };

  const handleSave = async () => {
    if (!user) {
      setAuthPrompt(true);
      return;
    }
    if (isSaved || saving) return;

    setSaving(true);
    setSaveFeedback(null);
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText,
          author: quote.autor,
          work: quote.obra,
          epoca: quote.epoca,
          reference: quote.referencia,
          quoteText: quote.cita,
          isParaphrase: quote.es_parafrasis,
          workContext: quote.contexto_obra,
          selectionJustification: quote.justificacion_eleccion,
          conceptualBridge: quote.puente_conceptual,
          insertionSuggestion: quote.sugerencia_insercion,
          bibliographicCitation: quote.cita_bibliografica,
          citationFunction,
          workGenre,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "No se pudo guardar la cita.");
      }

      setIsSaved(true);
      setSaveFeedback("Guardada en «Mi florilegio».");
      onSaved?.();
    } catch (err) {
      setSaveFeedback(
        err instanceof Error ? err.message : "Error al guardar la cita."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!savedId || !onDeleteSaved || deleting) return;
    setDeleting(true);
    try {
      await onDeleteSaved(savedId);
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    printQuoteSheet({
      quote,
      promptText,
      citationFunction,
      workGenre,
    });
  };

  return (
    <article className="bg-ivory border border-parchment-200 rounded-3xl shadow-editorial overflow-hidden transition-shadow hover:shadow-md">
      {/* Encabezado bibliográfico superior */}
      <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-parchment-200/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {typeof index === "number" && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-navy-50 text-navy-700 text-xs font-bold border border-navy-700/15">
              {index + 1}
            </span>
          )}
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-600">
            {quote.epoca}
          </span>
          <span className="text-parchment-300">·</span>
          <span className="text-xs text-ink-500">
            {getFunctionShortLabel(citationFunction)}
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-parchment-200 text-ink-700 text-xs font-medium">
          <Feather className="w-3.5 h-3.5 text-navy-700" />
          {getGenreShortLabel(workGenre)}
        </span>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* 1. Cita clásica + ficha bibliográfica */}
        <section>
          <blockquote className="relative bg-white rounded-r-2xl px-5 sm:px-7 py-5 border border-parchment-200/80 border-l-4 border-l-navy-700">
            <p className="font-serif text-xl sm:text-[22px] leading-relaxed text-ink-900 italic">
              «{cleanQuote}»
            </p>
          </blockquote>

          <div className="mt-3.5 flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <p className="text-ink-900">
              <strong className="font-semibold">{quote.autor}</strong>,{" "}
              <em className="font-serif text-base">{quote.obra}</em>{" "}
              <span className="text-ink-500">({quote.referencia})</span>
            </p>

            {quote.es_parafrasis && (
              <span
                className="inline-flex items-center gap-1 text-xs text-ink-500 bg-white border border-parchment-200 px-3 py-0.5 rounded-full"
                title="Traducción fiel del pasaje clásico original"
              >
                <Info className="w-3.5 h-3.5 text-gold-600" />
                Traducción fiel del pasaje original
              </span>
            )}
          </div>
        </section>

        {/* 2. Por qué esta cita para tu obra */}
        <section className="space-y-1.5">
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-navy-700">
            <Compass className="w-4 h-4" />
            Por qué esta cita para tu obra
          </h3>
          <p className="text-sm sm:text-[15px] leading-relaxed text-ink-700">
            {quote.justificacion_eleccion}
          </p>
        </section>

        {/* 3. Cómo dialoga con tu idea — Puente conceptual destacado */}
        <section className="rounded-2xl bg-gold-50 border border-gold-100 border-l-4 border-l-gold-600 p-4 sm:p-5 space-y-2">
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-700">
            <Link2 className="w-4 h-4" />
            Cómo dialoga con tu idea
          </h3>
          <p className="text-sm sm:text-[15px] leading-relaxed text-ink-900">
            {quote.puente_conceptual}
          </p>
        </section>

        {/* 4. Contexto en la obra original + Sugerencia de inserción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <section className="rounded-2xl bg-white border border-parchment-200 p-4 sm:p-5 space-y-2">
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-700">
              <BookOpenText className="w-4 h-4 text-navy-700" />
              Contexto en la obra original
            </h3>
            <p className="text-sm leading-relaxed text-ink-700">
              {quote.contexto_obra}
            </p>
          </section>

          <section className="rounded-2xl bg-white border border-parchment-200 p-4 sm:p-5 space-y-2">
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-700">
              <Feather className="w-4 h-4 text-navy-700" />
              Cómo integrarla en tu texto
            </h3>
            <p className="text-sm leading-relaxed text-ink-700">
              {quote.sugerencia_insercion}
            </p>
          </section>
        </div>

        {/* Referencia bibliográfica lista para nota al pie */}
        {quote.cita_bibliografica && (
          <div className="rounded-2xl bg-parchment-50/90 border border-parchment-200 px-4 py-3 text-xs text-ink-700">
            <span className="font-bold uppercase tracking-wider text-ink-500 mr-2">
              Referencia:
            </span>
            <span>{quote.cita_bibliografica}</span>
          </div>
        )}

        {/* Aviso si intenta guardar sin sesión */}
        {authPrompt && !user && (
          <div className="rounded-2xl bg-navy-50 border border-navy-700/15 px-4 py-3 text-sm text-ink-900 flex flex-wrap items-center justify-between gap-3">
            <span>
              Inicia sesión o crea una cuenta para guardar citas en «Mi
              florilegio».
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-full bg-navy-700 text-white text-xs font-semibold hover:bg-navy-800"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="px-4 py-1.5 rounded-full border border-parchment-300 bg-white text-ink-900 text-xs font-semibold hover:bg-parchment-100"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        )}

        {saveFeedback && (
          <p className="text-xs text-ink-500">{saveFeedback}</p>
        )}

        {/* 5. Acciones de la tarjeta */}
        <div className="no-print pt-4 border-t border-parchment-200/80 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyQuoteOnly}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-parchment-300 bg-white text-xs font-semibold text-ink-900 hover:bg-parchment-100 transition-colors"
          >
            {copiedMode === "quote" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                Cita copiada
              </>
            ) : (
              <>
                <Quote className="w-3.5 h-3.5 text-ink-500" />
                Copiar solo la cita
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyFull}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-parchment-300 bg-white text-xs font-semibold text-ink-900 hover:bg-parchment-100 transition-colors"
          >
            {copiedMode === "full" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                Ficha completa copiada
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-ink-500" />
                Copiar ficha completa
              </>
            )}
          </button>

          {!savedId ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || isSaved}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                isSaved
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default"
                  : "bg-navy-700 text-white hover:bg-navy-800 disabled:opacity-60"
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  Guardada en «Mi florilegio»
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  {saving ? "Guardando..." : "Guardar en «Mi florilegio»"}
                </>
              )}
            </button>
          ) : (
            onDeleteSaved && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-red-200 bg-red-50/70 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Eliminando..." : "Quitar de Mi florilegio"}
              </button>
            )
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-parchment-300 bg-white text-xs font-semibold text-ink-900 hover:bg-parchment-100 transition-colors sm:ml-auto"
          >
            <Printer className="w-3.5 h-3.5 text-ink-500" />
            Exportar / Imprimir ficha
          </button>
        </div>
      </div>
    </article>
  );
}
