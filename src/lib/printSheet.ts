import {
  getFunctionLabel,
  getGenreLabel,
  type CitationFunction,
  type ClassicalQuoteItem,
  type WorkGenre,
} from "@/types/florilegio";

export function formatQuoteOnlyForClipboard(quote: ClassicalQuoteItem): string {
  const cleanQuote = quote.cita.replace(/^«|»$/g, "").trim();
  return `«${cleanQuote}»\n— ${quote.autor}, ${quote.obra} (${quote.referencia})`;
}

export function formatFullCardForClipboard(params: {
  quote: ClassicalQuoteItem;
  promptText: string;
  citationFunction: CitationFunction;
  workGenre: WorkGenre;
}): string {
  const { quote, promptText, citationFunction, workGenre } = params;
  const cleanQuote = quote.cita.replace(/^«|»$/g, "").trim();
  const paraphraseNote = quote.es_parafrasis
    ? "\n[Nota filológica: traducción fiel del pasaje original]"
    : "";

  return [
    `FLORILEGIO CLÁSICO — Ficha de cita para tu obra`,
    `Idea consultada: ${promptText}`,
    `Función: ${getFunctionLabel(citationFunction)} | Género: ${getGenreLabel(workGenre)}`,
    ``,
    `«${cleanQuote}»`,
    `— ${quote.autor}, ${quote.obra} (${quote.epoca}, ${quote.referencia})${paraphraseNote}`,
    ``,
    `POR QUÉ ESTA CITA PARA TU OBRA:`,
    quote.justificacion_eleccion,
    ``,
    `CÓMO DIALOGA CON TU IDEA:`,
    quote.puente_conceptual,
    ``,
    `CONTEXTO EN LA OBRA ORIGINAL:`,
    quote.contexto_obra,
    ``,
    `SUGERENCIA DE INSERCIÓN EN TU TEXTO:`,
    quote.sugerencia_insercion,
    ``,
    `REFERENCIA BIBLIOGRÁFICA:`,
    quote.cita_bibliografica,
  ].join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function printQuoteSheet(params: {
  quote: ClassicalQuoteItem;
  promptText: string;
  citationFunction: CitationFunction;
  workGenre: WorkGenre;
}): void {
  const { quote, promptText, citationFunction, workGenre } = params;
  const printWindow = window.open("", "_blank", "width=900,height=760");
  if (!printWindow) {
    window.print();
    return;
  }

  const cleanQuote = quote.cita.replace(/^«|»$/g, "").trim();
  const paraphraseBadge = quote.es_parafrasis
    ? `<p class="note">Nota filológica: traducción fiel del pasaje clásico original.</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ficha de cita — ${escapeHtml(quote.autor)} | Florilegio Clásico</title>
  <style>
    @page { margin: 18mm; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      color: #17191C;
      background: #FFFFFF;
      line-height: 1.6;
      max-width: 740px;
      margin: 0 auto;
      padding: 24px;
    }
    .header {
      border-bottom: 2px solid #253F73;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }
    .brand { font-size: 20px; font-weight: 700; color: #253F73; }
    .subtitle {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #947132;
      font-weight: 600;
    }
    .meta-bar {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      color: #373B42;
      background: #FAF7F0;
      border: 1px solid #E8E0D0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 20px;
    }
    blockquote {
      margin: 0 0 12px 0;
      padding: 18px 22px;
      background: #FAF7F0;
      border-left: 4px solid #253F73;
      font-size: 18px;
      font-style: italic;
    }
    .citation {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      color: #373B42;
      margin-bottom: 6px;
    }
    .note {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 11px;
      color: #5E626A;
      font-style: italic;
      margin: 0 0 18px 0;
    }
    .section { margin-top: 18px; }
    .section h2 {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #253F73;
      margin: 0 0 6px 0;
    }
    .section p {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13.5px;
      margin: 0 0 8px 0;
      color: #17191C;
    }
    .bridge {
      background: #FBF7EC;
      border: 1px solid #F7EEDB;
      border-left: 4px solid #947132;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .bridge h2 { color: #7F5F26; }
    .ref-box {
      background: #FAF7F0;
      border: 1px solid #E8E0D0;
      border-radius: 8px;
      padding: 10px 14px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12.5px;
    }
    .footer {
      margin-top: 28px;
      padding-top: 10px;
      border-top: 1px solid #E8E0D0;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 11px;
      color: #858077;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Florilegio Clásico</div>
      <div class="subtitle">Ficha de cita clásica para autores</div>
    </div>
    <div class="subtitle">${escapeHtml(getGenreLabel(workGenre))}</div>
  </div>

  <div class="meta-bar">
    <strong>Idea o pasaje consultado:</strong> ${escapeHtml(promptText)}<br/>
    <strong>Función retórica:</strong> ${escapeHtml(getFunctionLabel(citationFunction))}
  </div>

  <blockquote>«${escapeHtml(cleanQuote)}»</blockquote>
  <div class="citation">
    <strong>${escapeHtml(quote.autor)}</strong>, <em>${escapeHtml(quote.obra)}</em> — ${escapeHtml(quote.epoca)} (${escapeHtml(quote.referencia)})
  </div>
  ${paraphraseBadge}

  <div class="section">
    <h2>Por qué esta cita para tu obra</h2>
    <p>${escapeHtml(quote.justificacion_eleccion)}</p>
  </div>

  <div class="section bridge">
    <h2>Cómo dialoga con tu idea</h2>
    <p>${escapeHtml(quote.puente_conceptual)}</p>
  </div>

  <div class="section">
    <h2>Contexto en la obra original</h2>
    <p>${escapeHtml(quote.contexto_obra)}</p>
  </div>

  <div class="section">
    <h2>Sugerencia de inserción en tu texto</h2>
    <p>${escapeHtml(quote.sugerencia_insercion)}</p>
  </div>

  <div class="section">
    <h2>Referencia bibliográfica sugerida</h2>
    <div class="ref-box">${escapeHtml(quote.cita_bibliografica)}</div>
  </div>

  <div class="footer">
    Generado con Florilegio Clásico · Citas clásicas con rigor filológico para tu obra
  </div>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
