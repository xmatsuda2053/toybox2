import { describe, it, expect } from "vitest";
import { decodeCsvBytes, encodeUtf8WithBom } from "./encoding.utils";

/**
 * テスト仕様: 文字コード判定・BOM処理ユーティリティ (encoding.utils.ts)
 *
 * - 仕様1: BOM なし UTF-8 バイト列を UTF-8 として正しくデコードできること
 * - 仕様2: BOM 付き UTF-8 バイト列の先頭 BOM を除去して UTF-8 として正しくデコードできること
 * - 仕様3: Shift_JIS バイト列を自動判別し、Shift_JIS として文字化けなくデコードできること
 * - 仕様4: encodeUtf8WithBom で先頭に UTF-8 BOM (0xEF, 0xBB, 0xBF) を付与したバイト列を生成できること
 */
describe("Encoding Utils Tests", () => {
  it("BOM なし UTF-8 バイト列を UTF-8 として正しくデコードできること", () => {
    const bytes = new TextEncoder().encode("職員番号,氏名\n0010001,田中 太郎");
    const result = decodeCsvBytes(bytes);

    expect(result.encoding).toBe("utf-8");
    expect(result.text).toBe("職員番号,氏名\n0010001,田中 太郎");
  });

  it("BOM 付き UTF-8 バイト列の先頭 BOM を除去して UTF-8 として正しくデコードできること", () => {
    const body = new TextEncoder().encode("職員番号,氏名");
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...body]);
    const result = decodeCsvBytes(withBom);

    expect(result.encoding).toBe("utf-8");
    expect(result.text).toBe("職員番号,氏名");
    expect(result.text.charCodeAt(0)).not.toBe(0xfeff);
  });

  it("Shift_JIS バイト列を自動判別し、文字化けなくデコードできること", () => {
    // Shift_JIS での "職員番号"
    const sjisBytes = new Uint8Array([
      0x90, 0x45, 0x88, 0xf5, 0x94, 0xd4, 0x8d, 0x86,
    ]);
    const result = decodeCsvBytes(sjisBytes);

    expect(result.encoding).toBe("shift_jis");
    expect(result.text).toBe("職員番号");
  });

  it("encodeUtf8WithBom で先頭に UTF-8 BOM を付与したバイト列を生成し、再デコードできること", () => {
    const source = "所属,内線番号\n総務課,2101";
    const encoded = encodeUtf8WithBom(source);

    expect(encoded[0]).toBe(0xef);
    expect(encoded[1]).toBe(0xbb);
    expect(encoded[2]).toBe(0xbf);

    const decoded = decodeCsvBytes(encoded);
    expect(decoded.encoding).toBe("utf-8");
    expect(decoded.text).toBe(source);
  });
});
