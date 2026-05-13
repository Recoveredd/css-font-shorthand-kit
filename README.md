# css-font-shorthand-kit

Small TypeScript library for parsing CSS `font` shorthand values into a predictable object, with structured diagnostics when a value is incomplete or ambiguous.

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

## API

### `parseFontShorthand(input, options?)`

Returns `{ ok: true, value, warnings }` or `{ ok: false, errors, warnings }`.

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

This draft intentionally does not attempt to be a full CSS parser. It is meant for tools that need a small, browser-friendly parser for one property.

## Browser use

The core uses only strings, arrays, and regular expressions. It has no runtime dependency and no Node-only API requirement.
