/** Extracts the `"body":"..."` string value incrementally from a JSON object as it's
 * assembled character-by-character from streamed tool-call-argument fragments. Only the
 * `body` field is surfaced — everything else in the structured response (references,
 * confidence, quotes) is only meaningful once complete, so it's read from the final
 * parsed result, not streamed. */
export function createBodyFieldScanner() {
  let buffer = "";
  let foundKey = false;
  let closed = false;
  let pendingEscape = false;
  let pendingUnicode: string | null = null;

  const KEY = '"body":"';

  const unescape = (ch: string): string => {
    switch (ch) {
      case "n":
        return "\n";
      case "t":
        return "\t";
      case "r":
        return "\r";
      case "b":
        return "\b";
      case "f":
        return "\f";
      default:
        return ch;
    }
  };

  return function feed(fragment: string): string {
    if (closed || !fragment) return "";
    buffer += fragment;

    if (!foundKey) {
      const idx = buffer.indexOf(KEY);
      if (idx === -1) {
        const keepLen = KEY.length - 1;
        if (buffer.length > keepLen) buffer = buffer.slice(-keepLen);
        return "";
      }
      foundKey = true;
      buffer = buffer.slice(idx + KEY.length);
    }

    let out = "";
    let i = 0;
    while (i < buffer.length) {
      const ch = buffer[i] as string;

      if (pendingUnicode !== null) {
        pendingUnicode += ch;
        i++;
        if (pendingUnicode.length === 4) {
          out += String.fromCharCode(parseInt(pendingUnicode, 16));
          pendingUnicode = null;
        }
        continue;
      }

      if (pendingEscape) {
        pendingEscape = false;
        if (ch === "u") {
          pendingUnicode = "";
        } else {
          out += unescape(ch);
        }
        i++;
        continue;
      }

      if (ch === "\\") {
        pendingEscape = true;
        i++;
        continue;
      }

      if (ch === '"') {
        closed = true;
        i++;
        break;
      }

      out += ch;
      i++;
    }

    buffer = closed ? "" : buffer.slice(i);
    return out;
  };
}
