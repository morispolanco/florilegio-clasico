export type CitationFunction =
  | "epigrafe"
  | "argumento"
  | "contraste"
  | "ilustracion";

export type WorkGenre = "ensayo" | "academico" | "divulgacion" | "discurso";

export type ClassicalTradition =
  | "todas"
  | "antiguedad"
  | "edad_media"
  | "renacimiento"
  | "ilustracion";

export type UserRole = "autor" | "investigador" | "editor" | "admin";

export interface ClassicalQuoteItem {
  cita: string;
  autor: string;
  obra: string;
  epoca: string;
  referencia: string;
  es_parafrasis: boolean;
  contexto_obra: string;
  justificacion_eleccion: string;
  puente_conceptual: string;
  sugerencia_insercion: string;
  cita_bibliografica: string;
}

export interface SearchApiResponse {
  promptText: string;
  citationFunction: CitationFunction;
  workGenre: WorkGenre;
  tradition: ClassicalTradition;
  modelUsed: string;
  usedFallback: boolean;
  historyId?: string;
  citas: ClassicalQuoteItem[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  workGenrePref: WorkGenre;
  isAuthorized: boolean;
  createdAt?: string;
}

export interface AdminUserRow extends UserProfile {
  searchesCount: number;
  savedCount: number;
}

export interface SavedQuoteRecord {
  id: string;
  userId: string;
  promptText: string;
  author: string;
  work: string;
  epoca: string;
  reference: string;
  quoteText: string;
  isParaphrase: boolean;
  workContext: string;
  selectionJustification: string;
  conceptualBridge: string;
  insertionSuggestion: string;
  bibliographicCitation: string;
  citationFunction: CitationFunction;
  workGenre: WorkGenre;
  createdAt: string;
}

export interface SearchHistoryRecord {
  id: string;
  userId: string;
  promptText: string;
  citationFunction: CitationFunction;
  workGenre: WorkGenre;
  tradition: ClassicalTradition;
  resultsJson: ClassicalQuoteItem[];
  modelUsed: string | null;
  createdAt: string;
}

export const FUNCTION_OPTIONS: Array<{
  value: CitationFunction;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "ilustracion",
    label: "Ilustración o metáfora viva",
    shortLabel: "Ilustración",
    description:
      "Imágenes, relatos o ejemplos clásicos que hacen tangible una idea abstracta.",
  },
  {
    value: "argumento",
    label: "Respaldo argumentativo",
    shortLabel: "Argumento",
    description:
      "Pasajes con autoridad intelectual o fuerza lógica para sostener una tesis.",
  },
  {
    value: "epigrafe",
    label: "Epígrafe o apertura",
    shortLabel: "Epígrafe",
    description:
      "Citas breves y memorables para abrir un libro, capítulo o ensayo.",
  },
  {
    value: "contraste",
    label: "Contrapunto o matiz crítico",
    shortLabel: "Contrapunto",
    description:
      "Voces clásicas que tensionan, matizan o enriquecen el problema desde otro ángulo.",
  },
];

export const GENRE_OPTIONS: Array<{
  value: WorkGenre;
  label: string;
  shortLabel: string;
}> = [
  {
    value: "ensayo",
    label: "Ensayo literario o humanístico",
    shortLabel: "Ensayo",
  },
  {
    value: "academico",
    label: "Artículo académico o tesis",
    shortLabel: "Académico / Tesis",
  },
  {
    value: "divulgacion",
    label: "Libro de divulgación o columna",
    shortLabel: "Divulgación / Columna",
  },
  {
    value: "discurso",
    label: "Discurso, conferencia o prólogo",
    shortLabel: "Discurso / Prólogo",
  },
];

export const TRADITION_OPTIONS: Array<{
  value: ClassicalTradition;
  label: string;
}> = [
  { value: "todas", label: "Todas" },
  { value: "antiguedad", label: "Antigüedad grecolatina" },
  { value: "edad_media", label: "Edad Media" },
  { value: "renacimiento", label: "Renacimiento y Siglo de Oro" },
  { value: "ilustracion", label: "Ilustración y Modernidad" },
];

export function getFunctionLabel(value: CitationFunction): string {
  return FUNCTION_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function getFunctionShortLabel(value: CitationFunction): string {
  return (
    FUNCTION_OPTIONS.find((item) => item.value === value)?.shortLabel ?? value
  );
}

export function getGenreLabel(value: WorkGenre): string {
  return GENRE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function getGenreShortLabel(value: WorkGenre): string {
  return (
    GENRE_OPTIONS.find((item) => item.value === value)?.shortLabel ?? value
  );
}

export function getTraditionLabel(value: ClassicalTradition): string {
  return (
    TRADITION_OPTIONS.find((item) => item.value === value)?.label ?? value
  );
}
