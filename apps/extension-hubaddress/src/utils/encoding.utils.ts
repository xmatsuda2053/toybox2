export type DetectedCsvEncoding = "utf-8" | "shift_jis";

export interface DecodedCsvResult {
  text: string;
  encoding: DetectedCsvEncoding;
}

const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;

function hasUtf8Bom(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 3 &&
    bytes[0] === UTF8_BOM[0] &&
    bytes[1] === UTF8_BOM[1] &&
    bytes[2] === UTF8_BOM[2]
  );
}

/**
 * CSV バイト列の文字コード（UTF-8 / Shift_JIS）を自動判別してデコードする
 */
export function decodeCsvBytes(bytes: Uint8Array): DecodedCsvResult {
  if (hasUtf8Bom(bytes)) {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return {
      text: decoder.decode(bytes.subarray(3)),
      encoding: "utf-8",
    };
  }

  try {
    const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
    return {
      text: utf8Decoder.decode(bytes),
      encoding: "utf-8",
    };
  } catch {
    const sjisDecoder = new TextDecoder("shift_jis");
    return {
      text: sjisDecoder.decode(bytes),
      encoding: "shift_jis",
    };
  }
}

/**
 * 文字列を UTF-8 BOM (0xEF, 0xBB, 0xBF) 付きバイト列へエンコードする
 */
export function encodeUtf8WithBom(text: string): Uint8Array {
  const body = new TextEncoder().encode(text);
  const result = new Uint8Array(UTF8_BOM.length + body.length);
  result.set(UTF8_BOM, 0);
  result.set(body, UTF8_BOM.length);
  return result;
}
