import { describe, it, expect } from "vitest";
import {
  JAPANESE_ERA_PRESETS,
  YEAR_GRID_SIZE,
  clampYearRangeStart,
  getMonthCells,
  getYearCells,
  getYearRangeStart,
  parseYearInput,
  shiftYearRange,
} from "./datepicker-input.utils";

/**
 * 【datepicker-input.utils 仕様（年月選択・元号ジャンプ・西暦入力ユーティリティ）】
 *
 * 1. 年範囲算出・ページ移動（getYearRangeStart / clampYearRangeStart / shiftYearRange）
 *    - 1-1. 指定した年を含むキリの良い開始年（10年区切り）を算出し、その年が12年範囲内に必ず含まれること
 *    - 1-2. shiftYearRange で前後12年単位に移動でき、最小年（1）〜最大開始年（9988）の範囲にクランプされること
 *    - 1-3. clampYearRangeStart で範囲外の値が最小年・最大開始年に補正されること
 *
 * 2. 年セル・月セル生成（getYearCells / getMonthCells）
 *    - 2-1. getYearCells が 12年分のセルを生成し、現在選択年（isCurrent）および今年（isToday）フラグが正しく設定されること
 *    - 2-2. getYearCells の各セルに 1868年以降の和暦表記（改元年は12月31日基準の元号）が付与され、1867年以前は空文字になること
 *    - 2-3. getMonthCells が 1〜12月の12セルを生成し、現在表示月（isCurrent）および今月（isToday）フラグが正しく設定されること
 *
 * 3. 元号クイックジャンププリセット（JAPANESE_ERA_PRESETS）
 *    - 3-1. 令和・平成・昭和・大正・明治の5元号が定義され、正しい開始西暦年を持つこと
 *
 * 4. 西暦年入力パース（parseYearInput）
 *    - 4-1. 半角数字の有効な西暦年（例: "1985", "2026", "1", "9999"）を数値としてパースできること
 *    - 4-2. 全角数字および前後空白を含む入力（例: " １９８５ "）を半角正規化してパースできること
 *    - 4-3. 空文字・非数値・0以下・10000以上・小数・負数は null を返すこと
 */

describe("datepicker-input.utils", () => {
  describe("1. 年範囲算出・ページ移動", () => {
    it("1-1. 指定した年を含むキリの良い開始年（10年区切り）を算出し、その年が12年範囲内に必ず含まれること", () => {
      expect(getYearRangeStart(2026)).toBe(2020);
      expect(getYearRangeStart(1989)).toBe(1980);
      expect(getYearRangeStart(2000)).toBe(2000);
      expect(getYearRangeStart(5)).toBe(1);

      for (const year of [1, 1868, 1926, 1989, 2019, 2026, 2029, 9999]) {
        const start = getYearRangeStart(year);
        expect(year).toBeGreaterThanOrEqual(start);
        expect(year).toBeLessThanOrEqual(start + YEAR_GRID_SIZE - 1);
      }
    });

    it("1-2. shiftYearRange で前後12年単位に移動でき、最小年（1）〜最大開始年（9988）の範囲にクランプされること", () => {
      expect(shiftYearRange(2020, -1)).toBe(2008);
      expect(shiftYearRange(2020, 1)).toBe(2032);
      expect(shiftYearRange(5, -1)).toBe(1);
      expect(shiftYearRange(9985, 1)).toBe(9988);
    });

    it("1-3. clampYearRangeStart で範囲外の値が最小年・最大開始年に補正されること", () => {
      expect(clampYearRangeStart(0)).toBe(1);
      expect(clampYearRangeStart(-50)).toBe(1);
      expect(clampYearRangeStart(9995)).toBe(9988);
      expect(clampYearRangeStart(1926)).toBe(1926);
    });
  });

  describe("2. 年セル・月セル生成", () => {
    it("2-1. getYearCells が 12年分のセルを生成し、現在選択年（isCurrent）および今年（isToday）フラグが正しく設定されること", () => {
      const cells = getYearCells(2020, 2024, 2026);
      expect(cells).toHaveLength(12);
      expect(cells[0].year).toBe(2020);
      expect(cells[11].year).toBe(2031);

      const cell2024 = cells.find((c) => c.year === 2024);
      const cell2026 = cells.find((c) => c.year === 2026);
      expect(cell2024?.isCurrent).toBe(true);
      expect(cell2024?.isToday).toBe(false);
      expect(cell2026?.isCurrent).toBe(false);
      expect(cell2026?.isToday).toBe(true);
    });

    it("2-2. getYearCells の各セルに 1868年以降の和暦表記（改元年は12月31日基準の元号）が付与され、1867年以前は空文字になること", () => {
      const reiwaCells = getYearCells(2019, 2026, 2026);
      expect(reiwaCells[0].year).toBe(2019);
      expect(reiwaCells[0].eraLabel).toContain("令和");

      const heiseiCells = getYearCells(1989, 1989, 2026);
      expect(heiseiCells[0].year).toBe(1989);
      expect(heiseiCells[0].eraLabel).toContain("平成");

      const meijiBoundaryCells = getYearCells(1866, 1868, 2026);
      expect(meijiBoundaryCells[0].year).toBe(1866);
      expect(meijiBoundaryCells[0].eraLabel).toBe("");
      expect(meijiBoundaryCells[1].year).toBe(1867);
      expect(meijiBoundaryCells[1].eraLabel).toBe("");
      expect(meijiBoundaryCells[2].year).toBe(1868);
      expect(meijiBoundaryCells[2].eraLabel).toContain("明治");
    });

    it("2-3. getMonthCells が 1〜12月の12セルを生成し、現在表示月（isCurrent）および今月（isToday）フラグが正しく設定されること", () => {
      const cells = getMonthCells(2026, 4, 2026, 11);
      expect(cells).toHaveLength(12);
      expect(cells[0]).toEqual({
        month: 1,
        label: "1月",
        isCurrent: false,
        isToday: false,
      });
      expect(cells[3]).toEqual({
        month: 4,
        label: "4月",
        isCurrent: true,
        isToday: false,
      });
      expect(cells[10]).toEqual({
        month: 11,
        label: "11月",
        isCurrent: false,
        isToday: true,
      });

      const otherYearCells = getMonthCells(2020, 11, 2026, 11);
      expect(otherYearCells[10].isCurrent).toBe(true);
      expect(otherYearCells[10].isToday).toBe(false);
    });
  });

  describe("3. 元号クイックジャンププリセット", () => {
    it("3-1. 令和・平成・昭和・大正・明治の5元号が定義され、正しい開始西暦年を持つこと", () => {
      expect(JAPANESE_ERA_PRESETS.map((e) => e.label)).toEqual([
        "令和",
        "平成",
        "昭和",
        "大正",
        "明治",
      ]);
      expect(JAPANESE_ERA_PRESETS.map((e) => e.startYear)).toEqual([
        2019, 1989, 1926, 1912, 1868,
      ]);
    });
  });

  describe("4. 西暦年入力パース", () => {
    it("4-1. 半角数字の有効な西暦年を数値としてパースできること", () => {
      expect(parseYearInput("1985")).toBe(1985);
      expect(parseYearInput("2026")).toBe(2026);
      expect(parseYearInput("1")).toBe(1);
      expect(parseYearInput("9999")).toBe(9999);
    });

    it("4-2. 全角数字および前後空白を含む入力を半角正規化してパースできること", () => {
      expect(parseYearInput(" １９８５ ")).toBe(1985);
      expect(parseYearInput("２０２６")).toBe(2026);
    });

    it("4-3. 空文字・非数値・0以下・10000以上・小数・負数は null を返すこと", () => {
      expect(parseYearInput("")).toBeNull();
      expect(parseYearInput("   ")).toBeNull();
      expect(parseYearInput("abcd")).toBeNull();
      expect(parseYearInput("0")).toBeNull();
      expect(parseYearInput("-1985")).toBeNull();
      expect(parseYearInput("10000")).toBeNull();
      expect(parseYearInput("1985.5")).toBeNull();
    });
  });
});
