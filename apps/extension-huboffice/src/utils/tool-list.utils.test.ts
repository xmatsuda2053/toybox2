import { describe, it, expect } from "vitest";
import { filterAndSortTools, togglePinnedToolId } from "./tool-list.utils";
import { TOOL_REGISTRY, findToolById } from "../tools/tool-registry";
import type { ToolDefinition } from "../models/huboffice.model";

/**
 * テスト仕様: ツールレジストリ・フィルタ・ピン留めユーティリティ (tool-list.utils.ts / tool-registry.ts)
 *
 * - 仕様1: TOOL_REGISTRY に西暦・和暦変換 (wareki-converter) と QRコード生成 (qr-generator) が登録されていること
 * - 仕様2: findToolById で登録済みツールを検索でき、未登録 ID は undefined を返すこと
 * - 仕様3: filterAndSortTools がツール名・説明文・キーワードを対象に大文字小文字・全角半角・複数語 AND で絞り込むこと
 * - 仕様4: ピン留めされたツールが常に上部に固定され、未ピン留めツールは元の順序を維持すること
 * - 仕様5: togglePinnedToolId でピン留めの追加・解除がイミュータブルに行えること
 */
describe("Tool Registry & List Utils Tests", () => {
  const sampleTools: readonly ToolDefinition[] = [
    {
      id: "alpha",
      name: "西暦・和暦変換",
      description: "西暦日付と和暦日付を相互変換します",
      keywords: ["wareki", "令和", "カレンダー"],
      icon: "calendar-solid-full",
    },
    {
      id: "beta",
      name: "QRコード生成",
      description: "入力テキストをPNG形式のQRコード画像に変換します",
      keywords: ["qr", "バーコード"],
      icon: "qrcode-solid-full",
    },
    {
      id: "gamma",
      name: "営業日カウント",
      description: "土日祝を除いた営業日数を計算します",
      keywords: ["日付", "日数"],
      icon: "calendar-check-solid-full",
    },
  ];

  it("TOOL_REGISTRY に初回2ツールが定義されており findToolById で取得できること", () => {
    expect(TOOL_REGISTRY.map((t) => t.id)).toEqual([
      "wareki-converter",
      "qr-generator",
    ]);
    expect(findToolById("wareki-converter")?.name).toContain("和暦");
    expect(findToolById("qr-generator")?.name).toContain("QR");
    expect(findToolById("non-existent")).toBeUndefined();
  });

  it("ツール名・説明文・キーワードで全角半角や大文字小文字を区別せず絞り込めること", () => {
    expect(
      filterAndSortTools(sampleTools, "ｑｒ", []).map((t) => t.id),
    ).toEqual(["beta"]);
    expect(
      filterAndSortTools(sampleTools, "PNG 画像", []).map((t) => t.id),
    ).toEqual(["beta"]);
    expect(
      filterAndSortTools(sampleTools, "相互変換", []).map((t) => t.id),
    ).toEqual(["alpha"]);
    expect(
      filterAndSortTools(sampleTools, "存在しない語", []).map((t) => t.id),
    ).toEqual([]);
  });

  it("ピン留めされたツールが上部に固定され、未ピン留めツールは登録順を維持すること", () => {
    const result = filterAndSortTools(sampleTools, "", ["gamma", "beta"]);
    expect(result.map((t) => t.id)).toEqual(["gamma", "beta", "alpha"]);
  });

  it("フィルタ適用時でもピン留めされた一致ツールが上部に表示されること", () => {
    const result = filterAndSortTools(sampleTools, "日", ["gamma"]);
    expect(result.map((t) => t.id)).toEqual(["gamma", "alpha"]);
  });

  it("togglePinnedToolId でピン留めの追加・解除が元の配列を変更せずに行えること", () => {
    const original = ["alpha"];
    const added = togglePinnedToolId(original, "beta");
    expect(added).toEqual(["alpha", "beta"]);
    expect(original).toEqual(["alpha"]);

    const removed = togglePinnedToolId(added, "alpha");
    expect(removed).toEqual(["beta"]);
  });
});
