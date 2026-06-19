import { NextRequest, NextResponse } from "next/server";

// Caché en memoria: la narrativa para la misma predicción siempre es idéntica,
// así que no tiene sentido traducirla dos veces en el mismo proceso de Node.
const cache = new Map<string, string>();

// Tokens que no pueden aparecer en prosa natural de fútbol.
const TOKEN_A = "[[TA]]";
const TOKEN_B = "[[TB]]";

export async function POST(req: NextRequest) {
  let text: string;
  let termA: { src: string; dst: string } | undefined;
  let termB: { src: string; dst: string } | undefined;
  try {
    ({ text, termA, termB } = await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const key = text.trim();
  if (cache.has(key)) {
    return NextResponse.json({ translated: cache.get(key) });
  }

  // Proteger nombres de equipo: reemplazar antes de traducir, restaurar después.
  // Esto evita que MyMemory traduzca nombres propios (p. ej. "Costa de Marfil"
  // → "Ivory Coast") cuando queremos conservar el nombre canónico del sistema.
  let textToTranslate = key;
  if (termA?.src)
    textToTranslate = textToTranslate.replaceAll(termA.src, TOKEN_A);
  if (termB?.src)
    textToTranslate = textToTranslate.replaceAll(termB.src, TOKEN_B);

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=es|en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });

    if (!res.ok) {
      return NextResponse.json({ error: "upstream_error" }, { status: 502 });
    }

    const data = await res.json();
    let translated: string | undefined = data?.responseData?.translatedText;

    if (!translated || data?.responseStatus !== 200) {
      return NextResponse.json({ error: "no_translation" }, { status: 502 });
    }

    // Restaurar nombres canónicos en el texto traducido.
    if (termA?.dst) translated = translated.replaceAll(TOKEN_A, termA.dst);
    if (termB?.dst) translated = translated.replaceAll(TOKEN_B, termB.dst);

    cache.set(key, translated);
    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
