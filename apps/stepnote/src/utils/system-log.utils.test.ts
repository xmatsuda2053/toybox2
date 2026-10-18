/**
 * 【テスト仕様一覧】
 * 本テストスイートは、StepNoteにおけるシステムログフォーマット文字列生成関数群（system-log.utils）の仕様を検証する。
 *
 * 1. 日付・ステータス共通ヘルパー仕様
 *   - 1-1. 日付オブジェクトを "YYYY-MM-DD" 形式にフォーマットできること
 *   - 1-2. TaskStatusCode (0, 5, 9) を対応する日本語ラベル（開始待ち, 対応中, 完了）に変換できること
 *
 * 2. タスク関連システムログフォーマット仕様
 *   - 2-1. タスク新規追加時のシステムログ（タスク名、期日、ラベル、年度、初期ステータス）を正しくフォーマットすること
 *   - 2-2. タスク名変更時のシステムログ（変更前後のタスク名）を正しくフォーマットすること
 *   - 2-3. タスクステータス変更時のシステムログ（変更前後のステータス名・コード値）を正しくフォーマットすること
 *   - 2-4. タスク期日変更時のシステムログ（変更前後の日付）を正しくフォーマットすること
 *   - 2-5. タスクラベル変更時のシステムログ（変更前後のラベル名・ID）を正しくフォーマットすること
 *   - 2-6. タスク年度変更時のシステムログ（変更前後の年度）を正しくフォーマットすること
 *   - 2-7. タスク関係者変更時のシステムログ（変更前後の関係者一覧）を正しくフォーマットすること
 *
 * 3. Issue関連システムログフォーマット仕様
 *   - 3-1. Issue新規追加時のシステムログ（Issue ID、期日、初期ステータス）を正しくフォーマットすること
 *   - 3-2. Issue一括作成時のシステムログ（件数、各Issue IDおよびタイトル一覧）を正しくフォーマットすること
 *   - 3-3. Issueタイトル変更時のシステムログ（Issue ID、変更前後のタイトル）を正しくフォーマットすること
 *   - 3-4. Issueステータス変更時のシステムログ（Issue ID、タイトル、変更前後のステータス）を正しくフォーマットすること
 *   - 3-5. Issue期日変更時のシステムログ（Issue ID、タイトル、変更前後の期日）を正しくフォーマットすること
 *   - 3-6. Issue削除時のシステムログ（Issue ID、タイトル、削除時ステータス・期日）を正しくフォーマットすること
 *
 * 4. Note関連システムログフォーマット仕様
 *   - 4-1. Note新規追加時のシステムログ（Note ID）を正しくフォーマットすること
 *   - 4-2. Note削除時のシステムログ（Note ID、削除時タイトル）を正しくフォーマットすること
 *
 * 5. システムログ判定仕様 (isSystemLog)
 *   - 5-1. "### sys:" で始まる文字列の場合は true を返すこと
 *   - 5-2. 大文字 "### SYS:" や前後に空白がある場合も true を返すこと
 *   - 5-3. 通常のユーザー入力テキストの場合は false を返すこと
 *   - 5-4. 空文字の場合は false を返すこと
 */

import { describe, it, expect } from "vitest";
import {
  formatDateString,
  getStatusLabel,
  formatTaskCreatedLog,
  formatTaskNameChangedLog,
  formatTaskStatusChangedLog,
  formatTaskDueDateChangedLog,
  formatTaskLabelChangedLog,
  formatTaskFiscalYearChangedLog,
  formatIssueCreatedLog,
  formatIssueBulkCreatedLog,
  formatIssueStatusChangedLog,
  formatIssueDueDateChangedLog,
  formatIssueDeletedLog,
  formatNoteCreatedLog,
  formatNoteDeletedLog,
  isSystemLog,
} from "./system-log.utils";

describe("system-log.utils (TDD)", () => {
  describe("1. 日付・ステータス共通ヘルパー仕様", () => {
    it("1-1. 日付オブジェクトを YYYY-MM-DD 形式にフォーマットすること", () => {
      const date = new Date(2026, 9, 31); // 2026-10-31
      expect(formatDateString(date)).toBe("2026-10-31");
    });

    it("1-2. TaskStatusCode を対応する日本語ラベルに変換すること", () => {
      expect(getStatusLabel(0)).toBe("開始待ち");
      expect(getStatusLabel(5)).toBe("対応中");
      expect(getStatusLabel(9)).toBe("完了");
    });
  });

  describe("2. タスク関連システムログフォーマット仕様", () => {
    it("2-1. タスク新規追加時のシステムログを正しくフォーマットすること", () => {
      const log = formatTaskCreatedLog({
        name: "新機能設計",
        dueDate: new Date(2026, 9, 31),
        labelName: "開発",
        fiscalYear: 2026,
        statusCode: 0,
      });

      expect(log).toBe(
        `### sys: タスク作成: "新機能設計"\n\n` +
          `- **タスク名**: 新機能設計\n` +
          `- **期日**: 2026-10-31\n` +
          `- **ラベル**: 開発\n` +
          `- **年度**: 2026年度\n` +
          `- **初期ステータス**: 開始待ち`,
      );
    });

    it("2-2. タスク名変更時のシステムログを正しくフォーマットすること", () => {
      const log = formatTaskNameChangedLog("旧タスク名", "新タスク名");

      expect(log).toBe(
        `### sys: タスク名変更: "旧タスク名" → "新タスク名"\n\n` +
          `- **項目**: タスク名\n` +
          `- **変更前**: 旧タスク名\n` +
          `- **変更後**: 新タスク名`,
      );
    });

    it("2-3. タスクステータス変更時のシステムログを正しくフォーマットすること", () => {
      const log = formatTaskStatusChangedLog(0, 5);

      expect(log).toBe(
        `### sys: タスクステータス変更: 開始待ち → 対応中\n\n` +
          `- **項目**: タスクステータス\n` +
          `- **変更前**: 開始待ち (0)\n` +
          `- **変更後**: 対応中 (5)`,
      );
    });

    it("2-4. タスク期日変更時のシステムログを正しくフォーマットすること", () => {
      const log = formatTaskDueDateChangedLog(
        new Date(2026, 9, 20),
        new Date(2026, 9, 31),
      );

      expect(log).toBe(
        `### sys: タスク期日変更: 2026-10-20 → 2026-10-31\n\n` +
          `- **項目**: タスク期日\n` +
          `- **変更前**: 2026-10-20\n` +
          `- **変更後**: 2026-10-31`,
      );
    });

    it("2-5. タスクラベル変更時のシステムログを正しくフォーマットすること", () => {
      const log = formatTaskLabelChangedLog("バックログ", "進行中", 1, 3);

      expect(log).toBe(
        `### sys: タスクラベル変更: バックログ → 進行中\n\n` +
          `- **項目**: ラベル\n` +
          `- **変更前**: バックログ (ID: 1)\n` +
          `- **変更後**: 進行中 (ID: 3)`,
      );
    });

    it("2-6. タスク年度変更時のシステムログを正しくフォーマットすること", () => {
      const log = formatTaskFiscalYearChangedLog(2025, 2026);

      expect(log).toBe(
        `### sys: タスク年度変更: 2025年度 → 2026年度\n\n` +
          `- **項目**: 年度\n` +
          `- **変更前**: 2025年度\n` +
          `- **変更後**: 2026年度`,
      );
    });
  });

  describe("3. Issue関連システムログフォーマット仕様", () => {
    it("3-1. Issue新規追加時のシステムログを正しくフォーマットすること", () => {
      const log = formatIssueCreatedLog(12, new Date(2026, 9, 25), 0);

      expect(log).toBe(
        `### sys: Issue #12 作成\n\n` +
          `- **対象**: Issue #12\n` +
          `- **期日**: 2026-10-25\n` +
          `- **初期ステータス**: 開始待ち (0)`,
      );
    });

    it("3-2. Issue一括作成時のシステムログを正しくフォーマットすること", () => {
      const log = formatIssueBulkCreatedLog([
        { id: 12, title: "API設計" },
        { id: 13, title: "DBマイグレーション" },
        { id: 14, title: "単体テスト作成" },
      ]);

      expect(log).toBe(
        `### sys: Issue一括作成: 3件 (#12, #13, #14)\n\n` +
          `- **作成件数**: 3件\n` +
          `- **作成されたIssue**:\n` +
          `  - Issue #12: API設計\n` +
          `  - Issue #13: DBマイグレーション\n` +
          `  - Issue #14: 単体テスト作成`,
      );
    });


    it("3-4. Issueステータス変更時のシステムログを正しくフォーマットすること", () => {
      const log = formatIssueStatusChangedLog(12, "API設計", 0, 9);

      expect(log).toBe(
        `### sys: Issue #12 ステータス変更: 開始待ち → 完了\n\n` +
          `- **対象**: Issue #12 ("API設計")\n` +
          `- **項目**: ステータス\n` +
          `- **変更前**: 開始待ち (0)\n` +
          `- **変更後**: 完了 (9)`,
      );
    });

    it("3-5. Issue期日変更時のシステムログを正しくフォーマットすること", () => {
      const log = formatIssueDueDateChangedLog(
        12,
        "API設計",
        new Date(2026, 9, 22),
        new Date(2026, 9, 25),
      );

      expect(log).toBe(
        `### sys: Issue #12 期日変更: 2026-10-22 → 2026-10-25\n\n` +
          `- **対象**: Issue #12 ("API設計")\n` +
          `- **項目**: 期日\n` +
          `- **変更前**: 2026-10-22\n` +
          `- **変更後**: 2026-10-25`,
      );
    });

    it("3-6. Issue削除時のシステムログを正しくフォーマットすること", () => {
      const log = formatIssueDeletedLog({
        id: 12,
        title: "API設計",
        statusCode: 5,
        dueDate: new Date(2026, 9, 25),
      });

      expect(log).toBe(
        `### sys: Issue #12 削除: "API設計"\n\n` +
          `- **対象**: Issue #12\n` +
          `- **タイトル**: API設計\n` +
          `- **削除時ステータス**: 対応中 (5)\n` +
          `- **削除時期日**: 2026-10-25`,
      );
    });
  });

  describe("4. Note関連システムログフォーマット仕様", () => {
    it("4-1. Note新規追加時のシステムログを正しくフォーマットすること", () => {
      const log = formatNoteCreatedLog(5);

      expect(log).toBe(
        `### sys: Note #5 作成\n\n` + `- **対象**: Note #5`,
      );
    });

    it("4-2. Note削除時のシステムログを正しくフォーマットすること", () => {
      const log = formatNoteDeletedLog(5, "定例ミーティング議事録");

      expect(log).toBe(
        `### sys: Note #5 削除: "定例ミーティング議事録"\n\n` +
          `- **対象**: Note #5\n` +
          `- **削除時タイトル**: 定例ミーティング議事録`,
      );
    });

    it("4-3. Note削除時にタイトルが空または未定義の場合は無題のノートと表示すること", () => {
      const log = formatNoteDeletedLog(5);

      expect(log).toBe(
        `### sys: Note #5 削除\n\n` +
          `- **対象**: Note #5\n` +
          `- **削除時タイトル**: (無題のノート)`,
      );
    });
  });

  describe("5. システムログ判定仕様 (isSystemLog)", () => {
    it("5-1. ### sys: で始まる文字列の場合は true を返すこと", () => {
      expect(isSystemLog('### sys: タスク作成: "新機能設計"')).toBe(true);
      expect(isSystemLog("### sys: Issue #10 作成")).toBe(true);
      expect(isSystemLog("### sys: Note #5 作成")).toBe(true);
    });

    it("5-2. 大文字 ### SYS: や前後に空白がある場合も true を返すこと", () => {
      expect(isSystemLog('   ### SYS: タスク名変更: "旧" → "新"  ')).toBe(true);
      expect(isSystemLog("  ### sys: Issue #12 期日変更")).toBe(true);
    });

    it("5-3. 通常のユーザー入力テキストの場合は false を返すこと", () => {
      expect(isSystemLog("本日の作業実績メモです")).toBe(false);
      expect(isSystemLog("システム開発の課題について検討した")).toBe(false);
      expect(isSystemLog("sys: 接頭辞のみでマークダウン見出しのない行")).toBe(false);
    });

    it("5-4. 空文字の場合は false を返すこと", () => {
      expect(isSystemLog("")).toBe(false);
      expect(isSystemLog("   ")).toBe(false);
    });
  });
});
