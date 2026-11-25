import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para consultar tu historial." },
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
      SELECT id, user_id, prompt_text, citation_function, work_genre, tradition, results_json, model_used, created_at
      FROM search_history
      WHERE user_id = ${user.id}
        AND (${!workGenre || workGenre === "todos"} OR work_genre = ${workGenre})
        AND (${!citationFunction || citationFunction === "todas"} OR citation_function = ${citationFunction})
      ORDER BY created_at DESC
      LIMIT 60
    `;

    const history = rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      promptText: String(row.prompt_text),
      citationFunction: row.citation_function,
      workGenre: row.work_genre,
      tradition: row.tradition || "todas",
      resultsJson: Array.isArray(row.results_json) ? row.results_json : [],
      modelUsed: row.model_used ? String(row.model_used) : null,
      createdAt: String(row.created_at),
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error("[GET /api/history] Error:", error);
    return NextResponse.json(
      { error: "No se pudo cargar el historial de consultas." },
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
        { error: "Falta el identificador del registro." },
        { status: 400 }
      );
    }

    const sql = getDb();
    await sql`
      DELETE FROM search_history
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/history] Error:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el registro del historial." },
      { status: 500 }
    );
  }
}
