export type FontStyle = "normal" | "italic" | "oblique";
export type FontVariant = "normal" | "small-caps";

export interface FontShorthand {
  style?: FontStyle;
  variant?: FontVariant;
  weight?: string;
  stretch?: string;
  size: string;
  lineHeight?: string;
  family: string[];
}

export interface SystemFontShorthand {
  system: string;
}

export type ParsedFontShorthand = FontShorthand | SystemFontShorthand;

export type FontDiagnosticCode =
  | "empty-input"
  | "missing-font-size"
  | "missing-font-family"
  | "unterminated-quote"
  | "unterminated-function"
  | "dangling-escape"
  | "unexpected-token"
  | "duplicate-token"
  | "invalid-family";

export interface FontDiagnostic {
  code: FontDiagnosticCode;
  message: string;
  token?: string;
  index?: number;
}

export interface ParseFontOptions {
  allowSystemFonts?: boolean;
}

export type ParseFontResult =
  | { ok: true; value: ParsedFontShorthand; warnings: FontDiagnostic[] }
  | { ok: false; errors: FontDiagnostic[]; warnings: FontDiagnostic[] };

const SYSTEM_FONTS = new Set([
  "caption",
  "icon",
  "menu",
  "message-box",
  "small-caption",
  "status-bar"
]);

const STYLE_TOKENS = new Set(["normal", "italic", "oblique"]);
const VARIANT_TOKENS = new Set(["small-caps"]);
const STRETCH_TOKENS = new Set([
  "condensed",
  "expanded",
  "extra-condensed",
  "extra-expanded",
  "semi-condensed",
  "semi-expanded",
  "ultra-condensed",
  "ultra-expanded"
]);
const WEIGHT_TOKENS = new Set(["bold", "bolder", "lighter"]);

export function parseFontShorthand(
  input: string,
  options: ParseFontOptions = {}
): ParseFontResult {
  const source = input.trim();
  const warnings: FontDiagnostic[] = [];

  if (source.length === 0) {
    return fail("empty-input", "Expected a CSS font shorthand value.", warnings);
  }

  if (options.allowSystemFonts !== false && SYSTEM_FONTS.has(source.toLowerCase())) {
    return { ok: true, value: { system: source.toLowerCase() }, warnings };
  }

  const tokenized = tokenizeBeforeFamily(source);
  if (tokenized.error) {
    return { ok: false, errors: [tokenized.error], warnings };
  }

  const sizeIndex = tokenized.tokens.findIndex((token) => isFontSizeToken(token.value));
  if (sizeIndex === -1) {
    return fail("missing-font-size", "Expected a font-size token before the font family.", warnings);
  }

  const beforeSize = tokenized.tokens.slice(0, sizeIndex);
  const sizeToken = tokenized.tokens[sizeIndex];
  if (!sizeToken) {
    return fail("missing-font-size", "Expected a font-size token before the font family.", warnings);
  }

  const afterSize = source.slice(sizeToken.end).trim();
  const parsedSize = splitSizeAndLineHeight(sizeToken.value);
  const familySource = parsedSize.inlineLineHeight
    ? afterSize
    : stripLeadingLineHeight(afterSize, parsedSize);

  const families = parseFontFamilyList(familySource);
  if (families.errors.length > 0) {
    return { ok: false, errors: families.errors, warnings };
  }

  if (families.value.length === 0) {
    return fail("missing-font-family", "Expected at least one font-family after font-size.", warnings);
  }

  const value: FontShorthand = {
    ...classifyPrefixTokens(beforeSize, warnings),
    size: parsedSize.size,
    ...(parsedSize.lineHeight ? { lineHeight: parsedSize.lineHeight } : {}),
    family: families.value
  };

  return { ok: true, value, warnings };
}

export function tryParseFontShorthand(
  input: string,
  options?: ParseFontOptions
): ParsedFontShorthand | null {
  const result = parseFontShorthand(input, options);
  return result.ok ? result.value : null;
}

export function parseFontFamilyList(input: string): {
  value: string[];
  errors: FontDiagnostic[];
} {
  const families: string[] = [];
  let current = "";
  let quote: "\"" | "'" | undefined;
  let escaped = false;
  let lastSeparatorIndex: number | undefined;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (!char) continue;

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = undefined;
      } else {
        current += char;
      }
      continue;
    }

    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }

    if (char === ",") {
      const family = current.trim();
      if (family.length === 0) {
        return {
          value: [],
          errors: [{ code: "invalid-family", message: "Font family entries cannot be empty.", index }]
        };
      }
      families.push(family);
      current = "";
      lastSeparatorIndex = index;
      continue;
    }

    current += char;
  }

  if (quote) {
    return {
      value: [],
      errors: [{ code: "unterminated-quote", message: "Font family quote is not closed." }]
    };
  }

  if (escaped) {
    return {
      value: [],
      errors: [{ code: "dangling-escape", message: "Font family escape is not followed by a character." }]
    };
  }

  const last = current.trim();
  if (last.length > 0) {
    families.push(last);
  } else if (lastSeparatorIndex !== undefined) {
    return {
      value: [],
      errors: [{ code: "invalid-family", message: "Font family entries cannot be empty.", index: lastSeparatorIndex }]
    };
  }

  return { value: families, errors: [] };
}

export function formatFontShorthand(value: ParsedFontShorthand): string {
  if ("system" in value) {
    return value.system;
  }

  const prefix = [value.style, value.variant, value.weight, value.stretch].filter(Boolean);
  const size = value.lineHeight ? `${value.size}/${value.lineHeight}` : value.size;
  return [...prefix, size, value.family.map(formatFamily).join(", ")].join(" ");
}

function classifyPrefixTokens(
  tokens: Token[],
  warnings: FontDiagnostic[]
): Omit<FontShorthand, "size" | "lineHeight" | "family"> {
  const output: Omit<FontShorthand, "size" | "lineHeight" | "family"> = {};

  for (const token of tokens) {
    const lower = token.value.toLowerCase();
    if (STYLE_TOKENS.has(lower)) {
      assignOnce(output, "style", lower, token, warnings);
    } else if (VARIANT_TOKENS.has(lower)) {
      assignOnce(output, "variant", lower, token, warnings);
    } else if (isWeightToken(lower)) {
      assignOnce(output, "weight", lower, token, warnings);
    } else if (STRETCH_TOKENS.has(lower)) {
      assignOnce(output, "stretch", lower, token, warnings);
    } else {
      warnings.push({
        code: "unexpected-token",
        message: `Ignored unexpected token before font-size: ${token.value}.`,
        token: token.value,
        index: token.start
      });
    }
  }

  return output;
}

function assignOnce(
  output: Record<string, string | undefined>,
  key: "style" | "variant" | "weight" | "stretch",
  value: string,
  token: Token,
  warnings: FontDiagnostic[]
): void {
  if (output[key]) {
    warnings.push({
      code: "duplicate-token",
      message: `Ignored duplicate ${key} token: ${token.value}.`,
      token: token.value,
      index: token.start
    });
    return;
  }
  output[key] = value;
}

function tokenizeBeforeFamily(input: string): {
  tokens: Token[];
  error?: FontDiagnostic;
} {
  const tokens: Token[] = [];
  let tokenStart: number | undefined;
  let quote: "\"" | "'" | undefined;
  let parenDepth = 0;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (!char) continue;

    if (quote) {
      if (char === quote) {
        quote = undefined;
      }
      continue;
    }

    if (char === "\"" || char === "'") {
      break;
    }

    if (char === "," && parenDepth === 0) {
      break;
    }

    if (char === "(") {
      tokenStart ??= index;
      parenDepth += 1;
      continue;
    }

    if (char === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }

    if (/\s/.test(char) && parenDepth === 0) {
      if (tokenStart !== undefined) {
        tokens.push({ value: input.slice(tokenStart, index), start: tokenStart, end: index });
        tokenStart = undefined;
      }
      continue;
    }

    tokenStart ??= index;
  }

  if (quote) {
    return {
      tokens,
      error: { code: "unterminated-quote", message: "Quote is not closed before font family." }
    };
  }

  if (parenDepth > 0) {
    return {
      tokens,
      error: { code: "unterminated-function", message: "Function token is missing a closing parenthesis." }
    };
  }

  if (tokenStart !== undefined) {
    tokens.push({ value: input.slice(tokenStart), start: tokenStart, end: input.length });
  }

  return { tokens };
}

function splitSizeAndLineHeight(token: string): {
  size: string;
  lineHeight?: string;
  inlineLineHeight: boolean;
} {
  const slashIndex = token.indexOf("/");
  if (slashIndex === -1) {
    return { size: token, inlineLineHeight: false };
  }

  const size = token.slice(0, slashIndex);
  const lineHeight = token.slice(slashIndex + 1);
  return lineHeight ? { size, lineHeight, inlineLineHeight: true } : { size, inlineLineHeight: true };
}

function stripLeadingLineHeight(
  input: string,
  parsedSize: { size: string; lineHeight?: string }
): string {
  if (!input.startsWith("/")) {
    return input;
  }

  const match = /^\/\s*(\S+)\s*/.exec(input);
  if (!match?.[1]) {
    return input;
  }

  parsedSize.lineHeight = match[1];
  return input.slice(match[0].length);
}

function isFontSizeToken(token: string): boolean {
  const size = token.split("/")[0] ?? token;
  return /^(?:xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|larger|smaller)$/i.test(size)
    || /^-?(?:\d+|\d*\.\d+)(?:px|em|rem|%|pt|pc|in|cm|mm|q|vh|vw|vmin|vmax|ch|ex|cap|ic|lh|rlh|svw|svh|lvw|lvh|dvw|dvh)$/i.test(size)
    || /^calc\(.+\)$/i.test(size)
    || /^var\(.+\)$/i.test(size);
}

function isWeightToken(token: string): boolean {
  return WEIGHT_TOKENS.has(token) || /^(?:[1-9]00)$/.test(token);
}

function formatFamily(family: string): string {
  if (/^[a-z-]+$/i.test(family)) {
    return family;
  }
  return `"${family.replaceAll("\"", "\\\"")}"`;
}

function fail(
  code: FontDiagnosticCode,
  message: string,
  warnings: FontDiagnostic[]
): ParseFontResult {
  return { ok: false, errors: [{ code, message }], warnings };
}

interface Token {
  value: string;
  start: number;
  end: number;
}
