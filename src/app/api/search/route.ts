import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { searchClassicalQuotesForAuthor } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 60;

const searchInputSchema = z.object({
  promptText: z
    .string()
    .trim()
    .min(3, "Escribe una frase, concepto o problema (al menos 3 caracteres).")
    .max(600, "El texto es demasiado extenso (máximo 600 caracteres)."),
  citationFunction: z.enum([
    "epigrafe",
    "argumento",
    "contraste",
    "ilustracion",
  ]),
  workGenre: z.enum(["ensayo", "academico", "divulgacion", "discurso"]),
  tradition: z
    .enum(["todas", "antiguedad", "edad_media", "renacimiento", "ilustracion"])
    .default("todas"),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        {
          error:
            "Debes iniciar sesión con una cuenta autorizada para utilizar Florilegio Clásico.",
        },
        { status: 401 }
      );
    }

    if (!user.isAuthorized && user.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Tu cuenta está pendiente de autorización. El administrador debe habilitar tu acceso antes de realizar búsquedas.",
        },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const parsed = searchInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Parámetros de búsqueda inválidos.",
        },
        { status: 400 }
      );
    }

    const { promptText, citationFunction, workGenre, tradition } = parsed.data;

    const { citas, modelUsed, usedFallback } =
      await searchClassicalQuotesForAuthor({
        promptText,
        citationFunction,
        workGenre,
        tradition,
      });

    let historyId: string | undefined;

    try {
      const sql = getDb();
      const inserted = await sql`
        INSERT INTO search_history (
          user_id,
          prompt_text,
          citation_function,
          work_genre,
          tradition,
          results_json,
          model_used
        )
        VALUES (
          ${user.id},
          ${promptText},
          ${citationFunction},
          ${workGenre},
          ${tradition},
          ${JSON.stringify(citas)}::jsonb,
          ${modelUsed}
        )
        RETURNING id
      `;
      if (inserted[0]?.id) {
        historyId = String(inserted[0].id);
      }
    } catch (dbError) {
      console.error(
        "[/api/search] No se pudo guardar en search_history:",
        dbError
      );
    }

    return NextResponse.json({
      promptText,
      citationFunction,
      workGenre,
      tradition,
      modelUsed,
      usedFallback,
      historyId,
      citas,
    });
  } catch (error) {
    console.error("[/api/search] Error:", error);
    const rawMsg =
      error instanceof Error
        ? error.message
        : "Ocurrió un error al consultar los textos clásicos.";

    return NextResponse.json(
      { error: `No se pudieron recuperar citas clásicas: ${rawMsg}` },
      { status: 502 }
    );
  }
}
