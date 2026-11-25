# Florilegio Clásico

**Florilegio Clásico** es una aplicación web editorial pensada para autores, ensayistas, investigadores y conferenciantes. A partir de una frase de tu borrador, un concepto o un problema intelectual, busca y justifica citas auténticas de textos clásicos de la tradición occidental con su contexto original, puente conceptual, sugerencia de inserción en tu prosa y referencia bibliográfica lista para nota al pie.

## Características principales

- **Búsqueda desde tu manuscrito:** Admite un concepto breve, una pregunta intelectual o una frase completa que quieras ilustrar o respaldar.
- **Función retórica y género de obra:** Adapta la selección según si necesitas un *epígrafe*, *respaldo argumentativo*, *contrapunto crítico* o *ilustración viva*, y según el registro de tu obra (*ensayo*, *artículo académico / tesis*, *divulgación / columna* o *discurso / prólogo*).
- **Rigor filológico:** Devuelve citas verificables con autor, obra, época, referencia precisa, contexto en la obra original y aviso automático si se trata de una traducción fiel adaptada (`es_parafrasis`).
- **Control de acceso administrativo:** Incluye cuenta administradora (`mp@ufm.edu`) y panel `/admin` para autorizar o desautorizar a los usuarios registrados.
- **Mi florilegio e historial en Neon:** Guarda citas favoritas filtrables por género y función, copia solo la cita o la ficha completa, e imprime fichas editoriales limpias.

## Despliegue rápido (Neon → GitHub → Vercel)

1. **Neon (PostgreSQL):** Crea un proyecto nuevo en [Neon](https://neon.tech), abre **SQL Editor**, pega y ejecuta el contenido completo de `schema.sql` (crea las tablas `users`, `search_history`, `saved_quotes` y la cuenta administradora `mp@ufm.edu`). Copia la cadena **Pooled connection** (`DATABASE_URL`).
2. **GitHub:** Descomprime `florilegio-clasico.zip` y sube todos los archivos de la raíz a un nuevo repositorio en GitHub.
3. **Vercel:** Importa el repositorio en [Vercel](https://vercel.com) (incluye `vercel.json` con `"framework": "nextjs"`). Configura las variables de entorno de `.env.example`:
   - `DATABASE_URL`
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_PRIMARY_MODEL` (recomendado: `google/gemini-2.5-flash`)
   - `OPENROUTER_FALLBACK_MODEL` (recomendado: `openai/gpt-4o-mini`)
   - `AUTH_SECRET` (mínimo 32 caracteres aleatorios)
   - `NEXT_PUBLIC_APP_URL` (URL pública de tu despliegue)
4. Haz clic en **Deploy**. Al entrar con `mp@ufm.edu`, accederás automáticamente a `/admin` para autorizar nuevos usuarios.
