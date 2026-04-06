const cache = new Map<string, string>();

export const LANGUAGES = [
  { code: "", label: "Sem tradução" },
  { code: "en", label: "🇺🇸 Inglês" },
  { code: "es", label: "🇪🇸 Espanhol" },
  { code: "fr", label: "🇫🇷 Francês" },
  { code: "de", label: "🇩🇪 Alemão" },
  { code: "it", label: "🇮🇹 Italiano" },
  { code: "ja", label: "🇯🇵 Japonês" },
  { code: "ko", label: "🇰🇷 Coreano" },
  { code: "zh", label: "🇨🇳 Chinês" },
  { code: "ru", label: "🇷🇺 Russo" },
  { code: "ar", label: "🇸🇦 Árabe" },
  { code: "pt", label: "🇧🇷 Português" },
];

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!targetLang || !text.trim()) return text;
  
  const key = `${text}|${targetLang}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`
    );
    const data = await res.json();
    const translated = data?.responseData?.translatedText || text;
    cache.set(key, translated);
    return translated;
  } catch {
    return text;
  }
}
