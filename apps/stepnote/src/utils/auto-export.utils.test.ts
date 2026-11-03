import { describe, it, expect } from "vitest";
import {
  isValidTimeFormat,
  normalizeScheduleTimes,
  isExportSlotDue,
  getNextScheduledTime,
  formatExportSlot,
} from "./auto-export.utils.js";

/**
 * 【AutoExport ユーティリティ仕様 (auto-export.utils.test.ts)】
 *
 * 1. isValidTimeFormat (時刻フォーマット検証)
 *    - 1-1. 有効な "HH:mm" 形式（例: "08:00", "00:00", "23:59"）の場合は true を返すこと
 *    - 1-2. 24時間表記の範囲外（例: "24:00", "12:60"）の場合は false を返すこと
 *    - 1-3. 形式不正（空文字、1桁、秒付き、非数値文字等）の場合は false を返すこと
 *
 * 2. normalizeScheduleTimes (スケジュール時刻リストの正規化)
 *    - 2-1. 重複する時刻を除去して一意にすること
 *    - 2-2. 時刻文字列を昇順にソートすること（例: ["17:15", "08:00", "12:00"] -> ["08:00", "12:00", "17:15"]）
 *    - 2-3. 不正な形式の時刻をリストから除外すること
 *    - 2-4. 空配列または null/undefined の場合は空配列を返すこと
 *
 * 3. formatExportSlot (エクスポートスロット識別文字列の生成)
 *    - 3-1. 指定の日時 Date から "yyyy-MM-dd HH:mm" 形式のスロット文字列を生成すること
 *
 * 4. isExportSlotDue (自動エクスポート実行判定 - キャッチアップなし)
 *    - 4-1. 現在時刻（HH:mm）がスケジュール時刻と一致し、未実行スロットの場合は { due: true, slot } を返すこと
 *    - 4-2. 現在時刻（HH:mm）が一致していても、同一スロットですでに実行済みの場合は { due: false } を返すこと
 *    - 4-3. 現在時刻（HH:mm）がスケジュール時刻に含まれない場合は { due: false } を返すこと
 *    - 4-4. スケジュール時刻リストが空の場合は { due: false } を返すこと
 *
 * 5. getNextScheduledTime (次回実行予定日時の算出)
 *    - 5-1. 当日中で現在時刻より後のスケジュール時刻がある場合、当日のその時刻の Date を返すこと
 *    - 5-2. 当日の全スケジュール時刻を過ぎている場合、翌日の最初のスケジュール時刻の Date を返すこと
 *    - 5-3. スケジュール時刻リストが空の場合は null を返すこと
 */

describe("AutoExport Utilities", () => {
  describe("1. isValidTimeFormat", () => {
    it("1-1. 有効な 'HH:mm' 形式（例: '08:00', '00:00', '23:59'）の場合は true を返すこと", () => {
      expect(isValidTimeFormat("08:00")).toBe(true);
      expect(isValidTimeFormat("00:00")).toBe(true);
      expect(isValidTimeFormat("23:59")).toBe(true);
      expect(isValidTimeFormat("12:30")).toBe(true);
    });

    it("1-2. 24時間表記の範囲外（例: '24:00', '12:60'）の場合は false を返すこと", () => {
      expect(isValidTimeFormat("24:00")).toBe(false);
      expect(isValidTimeFormat("25:00")).toBe(false);
      expect(isValidTimeFormat("12:60")).toBe(false);
      expect(isValidTimeFormat("12:99")).toBe(false);
    });

    it("1-3. 形式不正（空文字、1桁、秒付き、非数値文字等）の場合は false を返すこと", () => {
      expect(isValidTimeFormat("")).toBe(false);
      expect(isValidTimeFormat("8:00")).toBe(false);
      expect(isValidTimeFormat("08:0")).toBe(false);
      expect(isValidTimeFormat("08:00:00")).toBe(false);
      expect(isValidTimeFormat("ab:cd")).toBe(false);
      expect(isValidTimeFormat("08-00")).toBe(false);
    });
  });

  describe("2. normalizeScheduleTimes", () => {
    it("2-1. 重複する時刻を除去して一意にすること", () => {
      const input = ["08:00", "12:00", "08:00", "17:15"];
      expect(normalizeScheduleTimes(input)).toEqual(["08:00", "12:00", "17:15"]);
    });

    it("2-2. 時刻文字列を昇順にソートすること", () => {
      const input = ["17:15", "08:00", "12:00"];
      expect(normalizeScheduleTimes(input)).toEqual(["08:00", "12:00", "17:15"]);
    });

    it("2-3. 不正な形式の時刻をリストから除外すること", () => {
      const input = ["08:00", "invalid", "25:00", "12:00"];
      expect(normalizeScheduleTimes(input)).toEqual(["08:00", "12:00"]);
    });

    it("2-4. 空配列または null/undefined の場合は空配列を返すこと", () => {
      expect(normalizeScheduleTimes([])).toEqual([]);
      expect(normalizeScheduleTimes(undefined as unknown as string[])).toEqual([]);
    });
  });

  describe("3. formatExportSlot", () => {
    it("3-1. 指定の日時 Date から 'yyyy-MM-dd HH:mm' 形式のスロット文字列を生成すること", () => {
      const date = new Date(2026, 10, 3, 8, 0, 0); // 2026-11-03 08:00:00
      expect(formatExportSlot(date)).toBe("2026-11-03 08:00");
    });
  });

  describe("4. isExportSlotDue", () => {
    it("4-1. 現在時刻（HH:mm）がスケジュール時刻と一致し、未実行スロットの場合は { due: true, slot } を返すこと", () => {
      const now = new Date(2026, 10, 3, 12, 0, 15); // 2026-11-03 12:00:15
      const times = ["08:00", "12:00", "17:15"];
      const result = isExportSlotDue(now, times, "2026-11-03 08:00");
      expect(result).toEqual({
        due: true,
        slot: "2026-11-03 12:00",
      });
    });

    it("4-2. 現在時刻（HH:mm）が一致していても、同一スロットですでに実行済みの場合は { due: false } を返すこと", () => {
      const now = new Date(2026, 10, 3, 12, 0, 45); // 2026-11-03 12:00:45
      const times = ["08:00", "12:00", "17:15"];
      const result = isExportSlotDue(now, times, "2026-11-03 12:00");
      expect(result).toEqual({ due: false });
    });

    it("4-3. 現在時刻（HH:mm）がスケジュール時刻に含まれない場合は { due: false } を返すこと", () => {
      const now = new Date(2026, 10, 3, 12, 1, 0); // 2026-11-03 12:01:00
      const times = ["08:00", "12:00", "17:15"];
      const result = isExportSlotDue(now, times, "2026-11-03 08:00");
      expect(result).toEqual({ due: false });
    });

    it("4-4. スケジュール時刻リストが空の場合は { due: false } を返すこと", () => {
      const now = new Date(2026, 10, 3, 12, 0, 0);
      const result = isExportSlotDue(now, [], undefined);
      expect(result).toEqual({ due: false });
    });
  });

  describe("5. getNextScheduledTime", () => {
    it("5-1. 当日中で現在時刻より後のスケジュール時刻がある場合、当日のその時刻の Date を返すこと", () => {
      const now = new Date(2026, 10, 3, 10, 30, 0); // 10:30
      const times = ["08:00", "12:00", "17:15"];
      const next = getNextScheduledTime(now, times);
      expect(next).not.toBeNull();
      expect(next?.getFullYear()).toBe(2026);
      expect(next?.getMonth()).toBe(10);
      expect(next?.getDate()).toBe(3);
      expect(next?.getHours()).toBe(12);
      expect(next?.getMinutes()).toBe(0);
    });

    it("5-2. 当日の全スケジュール時刻を過ぎている場合、翌日の最初のスケジュール時刻の Date を返すこと", () => {
      const now = new Date(2026, 10, 3, 18, 0, 0); // 18:00
      const times = ["08:00", "12:00", "17:15"];
      const next = getNextScheduledTime(now, times);
      expect(next).not.toBeNull();
      expect(next?.getFullYear()).toBe(2026);
      expect(next?.getMonth()).toBe(10);
      expect(next?.getDate()).toBe(4); // 翌日
      expect(next?.getHours()).toBe(8);
      expect(next?.getMinutes()).toBe(0);
    });

    it("5-3. スケジュール時刻リストが空の場合は null を返すこと", () => {
      const now = new Date(2026, 10, 3, 10, 30, 0);
      expect(getNextScheduledTime(now, [])).toBeNull();
    });
  });
});

