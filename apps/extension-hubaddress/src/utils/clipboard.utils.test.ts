import { describe, it, expect, vi } from "vitest";
import { copyRawTextToClipboard, copyTextToClipboard } from "./clipboard.utils";

/**
 * テスト仕様: クリップボードコピーユーティリティ (clipboard.utils.ts)
 *
 * - 仕様1: テキストを clipboard.writeText 経由でコピーし true を返すこと
 * - 仕様2: 空文字や空白のみの入力時はコピーせず false を返すこと
 * - 仕様3: writeText が失敗した場合は例外を投げず false を返すこと
 * - 仕様4: copyRawTextToClipboard は末尾タブ・改行をトリムせずそのままコピーでき、空文字時は false を返すこと
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

  it("copyRawTextToClipboard で末尾タブや改行を保持したままコピーできること", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const tsvWithEmptyTail = "所属\t備考\n総務課\t";

    expect(await copyRawTextToClipboard(tsvWithEmptyTail, { writeText })).toBe(
      true,
    );
    expect(writeText).toHaveBeenCalledWith(tsvWithEmptyTail);

    writeText.mockClear();
    expect(await copyRawTextToClipboard("", { writeText })).toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });
});
