import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const saveQuoteSchema = z.object({
  promptText: z.string().trim().max(600).default(""),
  author: z.string().trim().min(1).max(180),
  work: z.string().trim().min(1).max(255),
  epoca: z.string().trim().max(120).default(""),
  reference: z.string().trim().min(1).max(255),
  quoteText: z.string().trim().min(10),
  isParaphrase: z.boolean().default(false),
  workContext: z.string().trim().min(10),
  selectionJustification: z.string().trim().min(10),
  conceptualBridge: z.string().trim().min(10),
  insertionSuggestion: z.string().trim().min(10),
  bibliographicCitation: z.string().trim().default(""),
  citationFunction: z.enum([
    "epigrafe",
    "argumento",
    "contraste",
    "ilustracion",
  ]),
  workGenre: z.enum(["ensayo", "academico", "divulgacion", "discurso"]),
});

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para acceder a tu florilegio." },
      { status: 401 }
    );
  }
  if (!user.isAuthorized && user.role !== "admin") {
    return NextResponse.json(
      { error: "Tu cuenta aún no ha sido autorizada por el administrador." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const workGenre = searchParams.get("workGenre");
    const citationFunction = searchParams.get("citationFunction");

    const sql = getDb();
    const rows = await sql`
      SELECT
        id,
        user_id,
        prompt_text,
        author,
        work,
        epoca,
        reference,
        quote_text,
        is_paraphrase,
        work_context,
        selection_justification,
        conceptual_bridge,
        insertion_suggestion,
        bibliographic_citation,
        citation_function,
        work_genre,
        created_at
      FROM saved_quotes
      WHERE user_id = ${user.id}
        AND (${!workGenre || workGenre === "todos"} OR work_genre = ${workGenre})
        AND (${!citationFunction || citationFunction === "todas"} OR citation_function = ${citationFunction})
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const quotes = rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      promptText: String(row.prompt_text || ""),
      author: String(row.author),
      work: String(row.work),
      epoca: String(row.epoca || ""),
      reference: String(row.reference),
      quoteText: String(row.quote_text),
      isParaphrase: Boolean(row.is_paraphrase),
      workContext: String(row.work_context),
      selectionJustification: String(row.selection_justification),
      conceptualBridge: String(row.conceptual_bridge),
      insertionSuggestion: String(row.insertion_suggestion),
      bibliographicCitation: String(row.bibliographic_citation || ""),
      citationFunction: row.citation_function,
      workGenre: row.work_genre,
      createdAt: String(row.created_at),
    }));

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("[GET /api/saved] Error:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar tus citas guardadas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Inicia sesión para guardar citas en «Mi florilegio»." },
      { status: 401 }
    );
  }
  if (!user.isAuthorized && user.role !== "admin") {
    return NextResponse.json(
      { error: "Tu cuenta aún no ha sido autorizada por el administrador." },
      { status: 403 }
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = saveQuoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de la cita incompletos o inválidos." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const sql = getDb();

    const inserted = await sql`
      INSERT INTO saved_quotes (
        user_id,
        prompt_text,
        author,
        work,
        epoca,
        reference,
        quote_text,
        is_paraphrase,
        work_context,
        selection_justification,
        conceptual_bridge,
        insertion_suggestion,
        bibliographic_citation,
        citation_function,
        work_genre
      )
      VALUES (
        ${user.id},
        ${d.promptText},
        ${d.author},
        ${d.work},
        ${d.epoca},
        ${d.reference},
        ${d.quoteText},
        ${d.isParaphrase},
        ${d.workContext},
        ${d.selectionJustification},
        ${d.conceptualBridge},
        ${d.insertionSuggestion},
        ${d.bibliographicCitation},
        ${d.citationFunction},
        ${d.workGenre}
      )
      RETURNING id, created_at
    `;

    return NextResponse.json(
      {
        id: String(inserted[0].id),
        createdAt: String(inserted[0].created_at),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/saved] Error:", error);
    return NextResponse.json(
      { error: "No se pudo guardar la cita en tu florilegio." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!user.isAuthorized && user.role !== "admin") {
    return NextResponse.json(
      { error: "Tu cuenta aún no ha sido autorizada por el administrador." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Falta el identificador de la cita." },
        { status: 400 }
      );
    }

    const sql = getDb();
    await sql`
      DELETE FROM saved_quotes
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/saved] Error:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar la cita." },
      { status: 500 }
    );
  }
}
