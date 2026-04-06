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
  { code: "zh-CN", label: "🇨🇳 Chinês" },
  { code: "ru", label: "🇷🇺 Russo" },
  { code: "ar", label: "🇸🇦 Árabe" },
  { code: "pt", label: "🇧🇷 Português" },
  { code: "hi", label: "🇮🇳 Hindi" },
  { code: "tr", label: "🇹🇷 Turco" },
  { code: "nl", label: "🇳🇱 Holandês" },
  { code: "pl", label: "🇵🇱 Polonês" },
];

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!targetLang || !text.trim()) return text;

  const key = `${text}|${targetLang}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    // Response is [[["translated","original",...],...],...] 
    const translated = data?.[0]?.map((s: string[]) => s[0]).join("") || text;
    cache.set(key, translated);
    return translated;
  } catch {
    return text;
  }
}
