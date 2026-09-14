/**
 * Multi-Script & Diacritic-Resistant Keyword Matcher
 * 
 * Enterprise keyword matching engine supporting:
 * - Unicode whole-word boundaries: (?<![\p{L}\p{N}])...(?![\p{L}\p{N}])
 * - Latin diacritic folding: "PREÇO" -> "preco", "café" -> "cafe"
 * - Arabic / Persian / Urdu script folding: Yeh, Kaf, Tatweel, Harakat, Eastern digits
 * - Numeric homoglyph folding: "O8" -> "08" for numeric campaigns
 * - Emoji stripping with combining mark (\p{M}) preservation
 */

export interface KeywordMatchResult {
  matched: boolean;
  matchedKeyword: string | null;
}

const ARABIC_SCRIPT_FOLDING: Array<[RegExp, string]> = [
  // Same letter, different keyboard layouts
  [/[يىے]/gu, "ی"], // Arabic yeh, alef maksura, barree ye
  [/ك/gu, "ک"], // Arabic kaf -> Persian keheh
  [/ة/gu, "ه"], // teh marbuta -> heh
  [/[آأإٱ]/gu, "ا"], // alef w/ madda or hamza -> alef
  // Optional vocalisation and typographic padding
  [/[ً-ْٰ]/gu, ""], // harakat, sukun, superscript alef
  [/ـ/gu, ""], // tatweel / kashida stretching
  // Zero-width non-joiner and bidi marks
  [/[‌‎‏]/gu, ""],
];

// Persian (U+06F0..) and Arabic-Indic (U+0660..) digit blocks, both ordered 0-9.
const EASTERN_DIGITS = /[۰-۹٠-٩]/gu;

export function normalizeArabicScript(text: string): string {
  let out = text;
  for (const [pattern, replacement] of ARABIC_SCRIPT_FOLDING) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(EASTERN_DIGITS, (digit) => {
    const code = digit.codePointAt(0)!;
    const zero = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - zero);
  });
}

/**
 * Checks if a cleaned keyword consists solely of digits (optionally mixed with 'o'/'O')
 */
function isNumericLikeKeyword(cleanedKeyword: string): boolean {
  return /^[0-9oO]+$/.test(cleanedKeyword);
}

/**
 * Folds the letter O into digit 0 for numeric campaigns (e.g. "O8" -> "08")
 */
function foldNumericHomoglyphs(value: string): string {
  return value.replace(/o/gi, "0");
}

/**
 * Strips emojis and special characters while preserving combining marks (\p{M})
 */
export function stripSpecialCharacters(text: string): string {
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu,
      ""
    )
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Removes diacritics from Latin-script text, preserving non-Latin combining marks
 * (e.g. Devanagari vowel signs, Thai tones, Arabic vowel marks).
 */
export function foldDiacritics(text: string): string {
  let out = "";
  let baseIsLatin = false;

  for (const char of text.normalize("NFD")) {
    if (/\p{M}/u.test(char)) {
      if (!baseIsLatin) out += char;
      continue;
    }
    baseIsLatin = /\p{Script=Latin}/u.test(char);
    out += char;
  }

  return out.normalize("NFC");
}

/**
 * Matches comment or message text against a list of target keywords.
 * 
 * @param text - The raw text from the commenter/message sender
 * @param keywords - List of target trigger keywords (e.g. ['LINK', 'FREE', '08'])
 * @param wholeWordMatch - If true, enforces Unicode whole-word boundary
 */
export function matchKeywords(
  text: string,
  keywords: string[],
  wholeWordMatch: boolean = true
): KeywordMatchResult {
  if (!text || !keywords || keywords.length === 0) {
    return { matched: false, matchedKeyword: null };
  }

  const cleanedText = foldDiacritics(
    stripSpecialCharacters(normalizeArabicScript(text))
  ).toLowerCase();

  if (!cleanedText) {
    return { matched: false, matchedKeyword: null };
  }

  for (const keyword of keywords) {
    const cleanedKeyword = foldDiacritics(
      stripSpecialCharacters(normalizeArabicScript(keyword))
    ).toLowerCase();

    if (!cleanedKeyword) continue;

    const numericLike = isNumericLikeKeyword(cleanedKeyword);
    const compareText = numericLike
      ? foldNumericHomoglyphs(cleanedText)
      : cleanedText;
    const compareKeyword = numericLike
      ? foldNumericHomoglyphs(cleanedKeyword)
      : cleanedKeyword;

    if (wholeWordMatch) {
      const escapedKeyword = compareKeyword.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      // Unicode-aware whole-word boundary (prevents false positives like matching "WIN" in "WINTER")
      const regex = new RegExp(
        `(?<![\\p{L}\\p{N}])${escapedKeyword}(?![\\p{L}\\p{N}])`,
        "iu"
      );
      if (regex.test(compareText)) {
        return { matched: true, matchedKeyword: keyword };
      }
    } else {
      if (compareText.includes(compareKeyword)) {
        return { matched: true, matchedKeyword: keyword };
      }
    }
  }

  return { matched: false, matchedKeyword: null };
}
