/**
 * スクロール同期ユーティリティ (scroll-sync.utils) 単体テスト仕様
 *
 * 1. 内部スクロール可能判定 (canScrollContainer)
 *   - scrollHeight が clientHeight + 1 を超える場合に true を返すこと
 *   - scrollHeight が clientHeight + 1 以下（サイズ可変レイアウトや短文時）の場合に false を返すこと
 *   - clientHeight が 0 以下の場合に false を返すこと
 * 2. ソース行番号に基づくドキュメント Y 座標補間 (interpolateTargetDocumentY)
 *   - アンカー一覧が空の場合は 0 を返すこと
 *   - 対象行がアンカー行と一致する場合は該当アンカーの offsetTop を返すこと
 *   - 対象行が2つのアンカー間にある場合は線形補間した Y 座標を返すこと
 *   - 対象行が最初のアンカーより前の場合は 0 から最初のアンカー間で補間すること
 *   - 対象行が最後のアンカーより後ろの場合は最終アンカーから総高さ間で補間すること
 * 3. プレビュー目標スクロール位置算出 (computeTargetPreviewScrollTop)
 *   - プレビュー領域が内部スクロール不可の場合は null を返すこと
 *   - アンカーが空の場合は scrollRatio に応じたフォールバック位置を返すこと
 *   - source="scroll" の場合は対象行のドキュメント Y 座標に合わせること
 *   - source="cursor" の場合は対象行が viewportRatio 相当の表示位置に来るよう算出すること
 *   - 算出結果が 0 〜 maxScrollTop の範囲にクランプされること
 */

import { describe, it, expect } from "vitest";
import {
  canScrollContainer,
  interpolateTargetDocumentY,
  computeTargetPreviewScrollTop,
  type SourceLineOffset,
  type EditorScrollPosition,
} from "./scroll-sync.utils.js";

describe("scroll-sync.utils", () => {
  describe("1. 内部スクロール可能判定 (canScrollContainer)", () => {
    it("scrollHeight が clientHeight + 1 を超える場合に true を返すこと", () => {
      expect(canScrollContainer(800, 400)).toBe(true);
      expect(canScrollContainer(402, 400)).toBe(true);
    });

    it("scrollHeight が clientHeight + 1 以下の場合に false を返すこと", () => {
      expect(canScrollContainer(400, 400)).toBe(false);
      expect(canScrollContainer(401, 400)).toBe(false);
      expect(canScrollContainer(300, 400)).toBe(false);
    });

    it("clientHeight が 0 以下の場合に false を返すこと", () => {
      expect(canScrollContainer(500, 0)).toBe(false);
      expect(canScrollContainer(500, -10)).toBe(false);
    });
  });

  describe("2. ソース行番号に基づくドキュメント Y 座標補間 (interpolateTargetDocumentY)", () => {
    const anchors: readonly SourceLineOffset[] = [
      { line: 1, offsetTop: 0 },
      { line: 5, offsetTop: 100 },
      { line: 15, offsetTop: 500 },
    ];

    it("アンカー一覧が空の場合は 0 を返すこと", () => {
      expect(interpolateTargetDocumentY(10, [], 1000, 20)).toBe(0);
    });

    it("対象行がアンカー行と一致する場合は該当アンカーの offsetTop を返すこと", () => {
      expect(interpolateTargetDocumentY(1, anchors, 1000, 20)).toBe(0);
      expect(interpolateTargetDocumentY(5, anchors, 1000, 20)).toBe(100);
      expect(interpolateTargetDocumentY(15, anchors, 1000, 20)).toBe(500);
    });

    it("対象行が2つのアンカー間にある場合は線形補間した Y 座標を返すこと", () => {
      // line 10 は line 5 (100) と line 15 (500) のちょうど中間 -> 300
      expect(interpolateTargetDocumentY(10, anchors, 1000, 20)).toBe(300);
    });

    it("対象行が最初のアンカーより前の場合は 0 から最初のアンカー間で補間すること", () => {
      const laterAnchors: readonly SourceLineOffset[] = [
        { line: 5, offsetTop: 100 },
        { line: 10, offsetTop: 300 },
      ];
      // line 1 -> 0, line 3 -> 50 (line 1..5 間で中間)
      expect(interpolateTargetDocumentY(1, laterAnchors, 1000, 20)).toBe(0);
      expect(interpolateTargetDocumentY(3, laterAnchors, 1000, 20)).toBe(50);
    });

    it("対象行が最後のアンカーより後ろの場合は最終アンカーから総高さ間で補間すること", () => {
      // line 15 (500) 〜 totalLines 25 (1000) の中間 line 20 -> 750
      expect(interpolateTargetDocumentY(20, anchors, 1000, 25)).toBe(750);
    });
  });

  describe("3. プレビュー目標スクロール位置算出 (computeTargetPreviewScrollTop)", () => {
    const anchors: readonly SourceLineOffset[] = [
      { line: 1, offsetTop: 0 },
      { line: 10, offsetTop: 400 },
      { line: 20, offsetTop: 1000 },
    ];

    it("プレビュー領域が内部スクロール不可（サイズ可変モード等）の場合は null を返すこと", () => {
      const pos: EditorScrollPosition = {
        source: "cursor",
        lineNumber: 10,
        viewportRatio: 0.5,
        scrollRatio: 0.5,
        totalLines: 30,
      };
      expect(
        computeTargetPreviewScrollTop({
          position: pos,
          anchors,
          previewScrollHeight: 400,
          previewClientHeight: 400,
        }),
      ).toBeNull();
    });

    it("アンカーが空の場合は scrollRatio に応じたフォールバック位置を返すこと", () => {
      const pos: EditorScrollPosition = {
        source: "scroll",
        lineNumber: 10,
        viewportRatio: 0,
        scrollRatio: 0.5,
        totalLines: 30,
      };
      // maxScrollTop = 1200 - 400 = 800 -> 0.5 * 800 = 400
      expect(
        computeTargetPreviewScrollTop({
          position: pos,
          anchors: [],
          previewScrollHeight: 1200,
          previewClientHeight: 400,
        }),
      ).toBe(400);
    });

    it("source='scroll' の場合は対象行のドキュメント Y 座標に合わせること", () => {
      const pos: EditorScrollPosition = {
        source: "scroll",
        lineNumber: 10,
        viewportRatio: 0,
        scrollRatio: 0.3,
        totalLines: 30,
      };
      expect(
        computeTargetPreviewScrollTop({
          position: pos,
          anchors,
          previewScrollHeight: 1500,
          previewClientHeight: 400,
        }),
      ).toBe(400);
    });

    it("source='cursor' の場合は対象行が viewportRatio 相当の表示位置に来るよう算出すること", () => {
      const pos: EditorScrollPosition = {
        source: "cursor",
        lineNumber: 10,
        viewportRatio: 0.5,
        scrollRatio: 0.3,
        totalLines: 30,
      };
      // targetDocY = 400, viewportRatio * clientHeight = 0.5 * 400 = 200 -> 400 - 200 = 200
      expect(
        computeTargetPreviewScrollTop({
          position: pos,
          anchors,
          previewScrollHeight: 1500,
          previewClientHeight: 400,
        }),
      ).toBe(200);
    });

    it("算出結果が 0 〜 maxScrollTop の範囲にクランプされること", () => {
      const topPos: EditorScrollPosition = {
        source: "cursor",
        lineNumber: 1,
        viewportRatio: 0.8,
        scrollRatio: 0,
        totalLines: 30,
      };
      expect(
        computeTargetPreviewScrollTop({
          position: topPos,
          anchors,
          previewScrollHeight: 1500,
          previewClientHeight: 400,
        }),
      ).toBe(0);

      const bottomPos: EditorScrollPosition = {
        source: "cursor",
        lineNumber: 30,
        viewportRatio: 0.1,
        scrollRatio: 1,
        totalLines: 30,
      };
      // maxScrollTop = 1500 - 400 = 1100
      expect(
        computeTargetPreviewScrollTop({
          position: bottomPos,
          anchors,
          previewScrollHeight: 1500,
          previewClientHeight: 400,
        }),
      ).toBe(1100);
    });
  });
});
