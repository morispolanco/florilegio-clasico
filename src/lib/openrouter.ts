import { z } from "zod";
import {
  getFunctionLabel,
  getGenreLabel,
  getTraditionLabel,
  type CitationFunction,
  type ClassicalQuoteItem,
  type ClassicalTradition,
  type WorkGenre,
} from "@/types/florilegio";

const quoteItemSchema = z.object({
  cita: z.string().min(10),
  autor: z.string().min(2),
  obra: z.string().min(2),
  epoca: z.string().min(2),
  referencia: z.string().min(2),
  es_parafrasis: z.boolean().default(false),
  contexto_obra: z.string().min(15),
  justificacion_eleccion: z.string().min(15),
  puente_conceptual: z.string().min(15),
  sugerencia_insercion: z.string().min(15),
  cita_bibliografica: z.string().min(5),
});

const openRouterResponseSchema = z.object({
  citas: z.array(quoteItemSchema).min(1).max(3),
});

const GENRE_GUIDANCE: Record<WorkGenre, string> = {
  ensayo:
    "GÉNERO ENSAYO LITERARIO O HUMANÍSTICO: Prioriza citas con densidad estética, agudeza reflexiva y belleza estilística. La sugerencia de inserción debe sonar natural, culta y dialogante, al estilo de Montaigne, Borges, Reyes o Ortega.",
  academico:
    "GÉNERO ARTÍCULO ACADÉMICO O TESIS: Prioriza precisión doctrinal y referencias verificables (libro, capítulo, sección, numeración Stephanus o Bekker cuando corresponda). La sugerencia de inserción debe mantener rigor expositivo y evitar grandilocuencia.",
  divulgacion:
    "GÉNERO DIVULGACIÓN O COLUMNA PERIODÍSTICA: Prioriza citas claras, vivas y memorables que iluminen la idea de inmediato sin exigir erudición previa al lector. La sugerencia de inserción debe tener ritmo ágil y claridad.",
  discurso:
    "GÉNERO DISCURSO, CONFERENCIA O PRÓLOGO: Prioriza pasajes con cadencia oral, fuerza retórica y cierre memorable. La sugerencia de inserción debe funcionar bien leída en voz alta.",
};

const SYSTEM_PROMPT = `Eres un filólogo clásico, editor humanista y asesor literario de primer nivel en lengua española. Tu misión en «Florilegio Clásico» es ayudar a un autor, ensayista, investigador o conferenciante a encontrar entre 2 y 3 citas auténticas de textos clásicos de la cultura occidental que iluminen, respalden, maticen o abran una frase, concepto o problema que desea desarrollar en su propia obra.

REGLAS ESTRICTAS DE VERACIDAD FILOLÓGICA:
1. Cita ÚNICAMENTE autores y obras reales de la tradición occidental (Homero, Heráclito, Sófocles, Tucídides, Platón, Aristóteles, Cicerón, Lucrecio, Virgilio, Horacio, Séneca, Epicteto, Quintiliano, Plutarco, Tácito, Marco Aurelio, San Agustín, Boecio, Tomás de Aquino, Dante, Petrarca, Erasmo, Juan Luis Vives, Montaigne, Cervantes, Quevedo, Baltasar Gracián, Bacon, Galileo, Descartes, Pascal, Spinoza, Locke, Montesquieu, Hume, Kant, Tocqueville, entre otros autores clásicos verificables).
2. Indica SIEMPRE: autor, título de la obra en español, época o siglo, y referencia precisa verificable (libro, capítulo, carta, diálogo, canto o sección).
3. PROHIBIDO INVENTAR CITAS O ATRIBUCIONES APÓCRIFAS. Si no recuerdas con certeza la traducción literal exacta de una edición publicada, ofrece una traducción fiel y cuidada del pasaje real que sí conoces y marca OBLIGATORIAMENTE "es_parafrasis": true.
4. En el campo "cita", emplea comillas angulares « » cuando corresponda y cuida la ortotipografía según la RAE.

VALOR EDITORIAL PARA EL AUTOR:
5. No te limites a listar frases célebres desgastadas ni clichés genéricos. Para cada cita debes ofrecer:
   - "contexto_obra": contexto exacto del pasaje dentro de la obra original, para que el autor nunca cite fuera de contexto.
   - "justificacion_eleccion": por qué esta cita y este autor aportan más lucidez, precisión o fuerza literaria que otras alternativas comunes.
   - "puente_conceptual": análisis preciso de cómo dialoga la cita con la frase, concepto o problema del usuario, citando expresiones o metáforas concretas del pasaje clásico entre comillas angulares « ».
   - "sugerencia_insercion": consejo editorial concreto junto con una frase modelo adaptable que muestre cómo hilar la cita con naturalidad dentro del género elegido por el autor.
   - "cita_bibliografica": referencia lista para nota al pie o bibliografía (ej.: «Séneca, Cartas morales a Lucilio, Carta CVI, 12.»).

FORMATO DE SALIDA OBLIGATORIO:
Devuelve EXCLUSIVAMENTE un objeto JSON válido (sin texto adicional ni bloques markdown) con esta estructura exacta:
{
  "citas": [
    {
      "cita": "Texto del pasaje clásico...",
      "autor": "Nombre del autor",
      "obra": "Título de la obra",
      "epoca": "Época y siglo",
      "referencia": "Ubicación precisa",
      "es_parafrasis": false,
      "contexto_obra": "Contexto del pasaje en la obra original...",
      "justificacion_eleccion": "Por qué esta cita enriquece la obra del autor...",
      "puente_conceptual": "Cómo dialoga con la idea del usuario citando expresiones del texto...",
      "sugerencia_insercion": "Consejo breve y frase modelo para integrarla en el texto...",
      "cita_bibliografica": "Autor, Obra, ubicación."
    }
  ]
}`;

function extractJsonObject(rawText: string): string {
  const trimmed = rawText.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function supportsJsonObjectFormat(model: string): boolean {
  const lower = model.toLowerCase();
  return (
    lower.startsWith("openai/") ||
    lower.startsWith("google/") ||
    lower.startsWith("deepseek/")
  );
}

async function callSingleOpenRouterModel(params: {
  model: string;
  apiKey: string;
  appUrl: string;
  userPrompt: string;
  timeoutMs: number;
}): Promise<ClassicalQuoteItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const payload: Record<string, unknown> = {
      model: params.model,
      temperature: 0.4,
      max_tokens: 2300,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: params.userPrompt },
      ],
    };

    if (supportsJsonObjectFormat(params.model)) {
      payload.response_format = { type: "json_object" };
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": params.appUrl,
          "X-Title": "Florilegio Clasico",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `OpenRouter devolvió HTTP ${response.status} con ${params.model}: ${errorBody.slice(0, 220)}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
      error?: { message?: string };
    };

    if (data.error?.message) {
      throw new Error(`OpenRouter (${params.model}): ${data.error.message}`);
    }

    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent || typeof rawContent !== "string") {
      throw new Error(`Respuesta vacía del modelo ${params.model}.`);
    }

    const jsonString = extractJsonObject(rawContent);
    const parsedJson: unknown = JSON.parse(jsonString);
    const validated = openRouterResponseSchema.parse(parsedJson);

    return validated.citas;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `El modelo ${params.model} superó el tiempo de espera (${Math.round(params.timeoutMs / 1000)}s).`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchClassicalQuotesForAuthor(params: {
  promptText: string;
  citationFunction: CitationFunction;
  workGenre: WorkGenre;
  tradition: ClassicalTradition;
}): Promise<{
  citas: ClassicalQuoteItem[];
  modelUsed: string;
  usedFallback: boolean;
}> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Falta la variable de entorno OPENROUTER_API_KEY en el servidor."
    );
  }

  const primaryModel =
    process.env.OPENROUTER_PRIMARY_MODEL?.trim() || "google/gemini-2.5-flash";
  const fallbackModel =
    process.env.OPENROUTER_FALLBACK_MODEL?.trim() || "openai/gpt-4o-mini";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://florilegio-clasico.vercel.app";

  const traditionInstruction =
    params.tradition === "todas"
      ? "Puedes seleccionar autores de distintas épocas de la tradición occidental para ofrecer variedad de tonos y perspectivas."
      : `Limita estrictamente la selección a autores de la época: ${getTraditionLabel(params.tradition)}.`;

  const userPrompt = [
    `Frase, concepto o problema del autor:\n«${params.promptText}»`,
    `Función buscada para la cita: ${getFunctionLabel(params.citationFunction)}`,
    `Género o registro de la obra: ${getGenreLabel(params.workGenre)}`,
    GENRE_GUIDANCE[params.workGenre],
    `Filtro de tradición o época: ${traditionInstruction}`,
    `Devuelve entre 2 y 3 citas clásicas distintas en el formato JSON especificado.`,
  ].join("\n\n");

  try {
    const citas = await callSingleOpenRouterModel({
      model: primaryModel,
      apiKey,
      appUrl,
      userPrompt,
      timeoutMs: 24000,
    });
    return { citas, modelUsed: primaryModel, usedFallback: false };
  } catch (primaryError) {
    if (!fallbackModel || fallbackModel === primaryModel) {
      throw primaryError;
    }

    console.warn(
      `[Florilegio Clásico] Falló el modelo principal (${primaryModel}), intentando respaldo (${fallbackModel}):`,
      primaryError instanceof Error ? primaryError.message : primaryError
    );

    const citas = await callSingleOpenRouterModel({
      model: fallbackModel,
      apiKey,
      appUrl,
      userPrompt,
      timeoutMs: 24000,
    });
    return { citas, modelUsed: fallbackModel, usedFallback: true };
  }
}
