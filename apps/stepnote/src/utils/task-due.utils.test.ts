import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTaskDueIconInfo, getIssuesDueStatus } from "./task-due.utils";
import type { IssueRecord } from "@/db/models/task.model";

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
 *
 * 2. getIssuesDueStatus
 *    - 2-1. 未完了Issueに期限切れ（overdue）が存在する場合、fire-solid-full アイコンと 'overdue' ステータスを返すこと
 *    - 2-2. 期限切れがなく期限当日（asap）の未完了Issueが存在する場合、triangle-exclamation-solid-full アイコンと 'asap' ステータスを返すこと
 *    - 2-3. 期限切れ・当日がなく期限間近（upcoming）の未完了Issueが存在する場合、calendar-solid-full アイコンと 'upcoming' ステータスを返すこと
 *    - 2-4. 複数の期限ステータスが混在する場合、最も緊急度の高いステータス（overdue > asap > upcoming）を返すこと
 *    - 2-5. 完了済み（statusCode: 9）のIssueは期限ステータス判定から除外されること
 *    - 2-6. 期限ステータスに該当する未完了Issueが存在しない場合（未来日・期限未設定・空配列等）、null を返すこと
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

  describe("2. getIssuesDueStatus", () => {
    const makeIssue = (
      statusCode: 0 | 5 | 9,
      dueDate: Date,
      id: number = 1,
    ): IssueRecord => ({
      id,
      taskId: 100,
      statusCode,
      title: `Issue ${id}`,
      value: "",
      dueDate,
    });

    it("2-1. 未完了Issueに期限切れ（overdue）が存在する場合、fire-solid-full アイコンと 'overdue' ステータスを返すこと", () => {
      const pastDate = new Date("2026-10-08T00:00:00.000Z");
      const issues = [makeIssue(0, pastDate)];
      expect(getIssuesDueStatus(issues)).toEqual({
        icon: "fire-solid-full",
        status: "overdue",
      });
    });

    it("2-2. 期限切れがなく期限当日（asap）の未完了Issueが存在する場合、triangle-exclamation-solid-full アイコンと 'asap' ステータスを返すこと", () => {
      const todayDate = new Date("2026-10-09T00:00:00.000Z");
      const futureDate = new Date("2026-10-20T00:00:00.000Z");
      const issues = [makeIssue(5, todayDate, 1), makeIssue(0, futureDate, 2)];
      expect(getIssuesDueStatus(issues)).toEqual({
        icon: "triangle-exclamation-solid-full",
        status: "asap",
      });
    });

    it("2-3. 期限切れ・当日がなく期限間近（upcoming）の未完了Issueが存在する場合、calendar-solid-full アイコンと 'upcoming' ステータスを返すこと", () => {
      const tomorrow = new Date("2026-10-10T00:00:00.000Z");
      const issues = [makeIssue(0, tomorrow)];
      expect(getIssuesDueStatus(issues)).toEqual({
        icon: "calendar-solid-full",
        status: "upcoming",
      });
    });

    it("2-4. 複数の期限ステータスが混在する場合、最も緊急度の高いステータス（overdue > asap > upcoming）を返すこと", () => {
      const pastDate = new Date("2026-10-08T00:00:00.000Z");
      const todayDate = new Date("2026-10-09T00:00:00.000Z");
      const tomorrow = new Date("2026-10-10T00:00:00.000Z");

      // overdue と asap と upcoming が混在 -> overdue が優先
      const issues1 = [
        makeIssue(0, tomorrow, 1),
        makeIssue(5, pastDate, 2),
        makeIssue(0, todayDate, 3),
      ];
      expect(getIssuesDueStatus(issues1)).toEqual({
        icon: "fire-solid-full",
        status: "overdue",
      });

      // asap と upcoming が混在 -> asap が優先
      const issues2 = [
        makeIssue(0, tomorrow, 1),
        makeIssue(5, todayDate, 2),
      ];
      expect(getIssuesDueStatus(issues2)).toEqual({
        icon: "triangle-exclamation-solid-full",
        status: "asap",
      });
    });

    it("2-5. 完了済み（statusCode: 9）のIssueは期限ステータス判定から除外されること", () => {
      const pastDate = new Date("2026-10-08T00:00:00.000Z");
      const tomorrow = new Date("2026-10-10T00:00:00.000Z");

      // 期限切れが完了済み、未完了が期限間近 -> upcoming が返る
      const issues1 = [
        makeIssue(9, pastDate, 1),
        makeIssue(0, tomorrow, 2),
      ];
      expect(getIssuesDueStatus(issues1)).toEqual({
        icon: "calendar-solid-full",
        status: "upcoming",
      });

      // 期限切れが完了済みのみ -> null が返る
      const issues2 = [makeIssue(9, pastDate, 1)];
      expect(getIssuesDueStatus(issues2)).toBeNull();
    });

    it("2-6. 期限ステータスに該当する未完了Issueが存在しない場合（未来日・空配列等）、null を返すこと", () => {
      const futureDate = new Date("2026-11-01T00:00:00.000Z");
      expect(getIssuesDueStatus([])).toBeNull();
      expect(getIssuesDueStatus([makeIssue(0, futureDate, 1)])).toBeNull();
    });
  });
});

