# css-font-shorthand-kit

[![License: MPL-2.0](https://img.shields.io/badge/license-MPL--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/Recoveredd/css-font-shorthand-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/Recoveredd/css-font-shorthand-kit/actions/workflows/ci.yml)

Small TypeScript library for parsing CSS `font` shorthand values into a predictable object, with structured diagnostics when a value is incomplete or ambiguous.

## Package quality

- TypeScript types are generated from the source.
- ESM-only package marked as side-effect free for bundlers.
- CI runs `npm ci`, `typecheck`, `build`, and `test`.
- Tested on Node.js 20 and 22 with GitHub Actions.

## Demo

[Try the interactive demo](https://packages.wasta-wocket.fr/css-font-shorthand-kit/)

```ts
import { parseFontShorthand } from "css-font-shorthand-kit";

const font = parseFontShorthand('italic 700 1rem/1.4 "Inter", system-ui');

font.value;
// {
//   style: "italic",
//   weight: "700",
//   size: "1rem",
//   lineHeight: "1.4",
//   family: ["Inter", "system-ui"]
// }
```

## Install

```bash
npm install css-font-shorthand-kit
```

## API

### `parseFontShorthand(input, options?)`

Returns a discriminated result instead of throwing:

```ts
type ParseFontResult =
  | { ok: true; value: ParsedFontShorthand; warnings: FontDiagnostic[] }
  | { ok: false; errors: FontDiagnostic[]; warnings: FontDiagnostic[] };
```

### `tryParseFontShorthand(input, options?)`

Returns the parsed value or `null`.

### `parseFontFamilyList(input)`

Parses a comma-separated font-family list, preserving quoted family names without the surrounding quotes.

### `formatFontShorthand(value)`

Serializes a parsed value back to a compact CSS `font` shorthand string.

## Supported scope

- CSS system font keywords such as `menu` and `caption`
- common `font-style`, `font-variant`, `font-weight`, and `font-stretch` tokens
- `font-size` with optional `/line-height`
- comma-separated font families, including quoted names and escaped quotes
- diagnostics for missing size/family, duplicate tokens, unknown pre-size tokens, and unterminated quotes

This package intentionally does not attempt to be a full CSS parser. It is meant for tools that need a small, browser-friendly parser for one property.

## Browser compatibility

The core uses only strings, arrays, and regular expressions. It has no runtime dependency and no Node-only API requirement.

## CLI

No CLI is included. The natural use is as an embeddable helper inside CSS,
canvas, design-token, editor, and browser tooling.

## License

MPL-2.0
