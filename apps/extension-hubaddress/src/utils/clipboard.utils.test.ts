import { describe, it, expect, vi } from "vitest";
import { copyTextToClipboard } from "./clipboard.utils";

/**
 * テスト仕様: クリップボードコピーユーティリティ (clipboard.utils.ts)
 *
 * - 仕様1: テキストを clipboard.writeText 経由でコピーし true を返すこと
 * - 仕様2: 空文字や空白のみの入力時はコピーせず false を返すこと
 * - 仕様3: writeText が失敗した場合は例外を投げず false を返すこと
 */
describe("Clipboard Utils Tests", () => {
  it("有効なテキストをコピーして true を返すこと", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const result = await copyTextToClipboard("tanaka@example.com", {
      writeText,
    });

    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith("tanaka@example.com");
  });

  it("空文字または空白のみの場合はコピーせず false を返すこと", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    expect(await copyTextToClipboard("", { writeText })).toBe(false);
    expect(await copyTextToClipboard("   ", { writeText })).toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });

  it("コピーAPIが拒否された場合は例外を投げず false を返すこと", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Permission denied"));
    const result = await copyTextToClipboard("2101", { writeText });

    expect(result).toBe(false);
  });
});
