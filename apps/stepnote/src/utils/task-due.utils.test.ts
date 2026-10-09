import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTaskDueIconInfo } from "./task-due.utils";

/**
 * 【task-due.utils 仕様】
 *
 * 1. getTaskDueIconInfo
 *    - 1-1. 期限日がシステム日付より過去（期限切れ）の場合、fire-solid-full アイコンと 'overdue' ステータスを返すこと
 *    - 1-2. 期限日がシステム日付当日（期限当日）の場合、triangle-exclamation-solid-full アイコンと 'asap' ステータスを返すこと
 *    - 1-3. 期限日がシステム日付の翌日〜3日後（期限間近）の場合、calendar-solid-full アイコンと 'upcoming' ステータスを返すこと
 *    - 1-4. 期限日が4日以上先の場合、null を返すこと
 *    - 1-5. 期限日が未指定（null または undefined）の場合、null を返すこと
 *    - 1-6. 無効な日付文字列の場合、null を返すこと
 */
describe("task-due.utils", () => {
  const baseTime = new Date("2026-10-09T10:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("1. getTaskDueIconInfo", () => {
    it("1-1. 期限日がシステム日付より過去（期限切れ）の場合、fire-solid-full アイコンと 'overdue' ステータスを返すこと", () => {
      const pastDate = new Date("2026-10-08T00:00:00.000Z");
      expect(getTaskDueIconInfo(pastDate)).toEqual({
        icon: "fire-solid-full",
        status: "overdue",
      });
    });

    it("1-2. 期限日がシステム日付当日（期限当日）の場合、triangle-exclamation-solid-full アイコンと 'asap' ステータスを返すこと", () => {
      const todayDate = new Date("2026-10-09T00:00:00.000Z");
      expect(getTaskDueIconInfo(todayDate)).toEqual({
        icon: "triangle-exclamation-solid-full",
        status: "asap",
      });
    });

    it("1-3. 期限日がシステム日付の翌日〜3日後（期限間近）の場合、calendar-solid-full アイコンと 'upcoming' ステータスを返すこと", () => {
      const tomorrow = new Date("2026-10-10T00:00:00.000Z");
      expect(getTaskDueIconInfo(tomorrow)).toEqual({
        icon: "calendar-solid-full",
        status: "upcoming",
      });

      const threeDaysLater = new Date("2026-10-12T00:00:00.000Z");
      expect(getTaskDueIconInfo(threeDaysLater)).toEqual({
        icon: "calendar-solid-full",
        status: "upcoming",
      });
    });

    it("1-4. 期限日が4日以上先の場合、null を返すこと", () => {
      const fourDaysLater = new Date("2026-10-13T00:00:00.000Z");
      expect(getTaskDueIconInfo(fourDaysLater)).toBeNull();

      const futureDate = new Date("2026-11-01T00:00:00.000Z");
      expect(getTaskDueIconInfo(futureDate)).toBeNull();
    });

    it("1-5. 期限日が未指定（null または undefined）の場合、null を返すこと", () => {
      expect(getTaskDueIconInfo(null)).toBeNull();
      expect(getTaskDueIconInfo(undefined)).toBeNull();
    });

    it("1-6. 無効な日付文字列の場合、null を返すこと", () => {
      expect(getTaskDueIconInfo("invalid-date-string")).toBeNull();
    });
  });
});
