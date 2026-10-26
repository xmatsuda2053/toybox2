/**
 * 【テスト仕様一覧】
 * 本テストスイートは、StepNoteにおけるシステムログ記録共通サービス（SystemLogService）の仕様を検証する。
 *
 * 1. 基本記録・連携ライフサイクル仕様
 *   - 1-1. recordLog 呼び出し時に LogsRepository.add が正しい taskId と value で呼び出されること
 *   - 1-2. LogsController が設定されている場合、ログ追加後に logsController.refresh() が呼び出されること
 *   - 1-3. LogsController が未設定の場合でもエラーなくログ保存が行われること
 *
 * 2. タスク関連システムログ記録仕様
 *   - 2-1. logTaskCreated 呼び出し時にタスク新規追加ログが LogsRepository に追加されること
 *   - 2-2. logTaskNameChanged 呼び出し時にタスク名変更ログが LogsRepository に追加されること
 *   - 2-3. logTaskStatusChanged 呼び出し時にタスクステータス変更ログが LogsRepository に追加されること
 *   - 2-4. logTaskDueDateChanged 呼び出し時にタスク期日変更ログが LogsRepository に追加されること
 *   - 2-5. logTaskLabelChanged 呼び出し時にタスクラベル変更ログが LogsRepository に追加されること
 *   - 2-6. logTaskFiscalYearChanged 呼び出し時にタスク年度変更ログが LogsRepository に追加されること
 *   - 2-7. logTaskContactsChanged 呼び出し時にタスク関係者変更ログが LogsRepository に追加されること
 *
 * 3. Issue関連システムログ記録仕様
 *   - 3-1. logIssueCreated 呼び出し時にIssue新規追加ログが LogsRepository に追加されること
 *   - 3-2. logIssueBulkCreated 呼び出し時にIssue一括作成ログが LogsRepository に追加されること
 *   - 3-3. logIssueTitleChanged 呼び出し時にIssueタイトル変更ログが LogsRepository に追加されること
 *   - 3-4. logIssueStatusChanged 呼び出し時にIssueステータス変更ログが LogsRepository に追加されること
 *   - 3-5. logIssueDueDateChanged 呼び出し時にIssue期日変更ログが LogsRepository に追加されること
 *   - 3-6. logIssueDeleted 呼び出し時にIssue削除ログが LogsRepository に追加されること
 *
 * 4. Note関連システムログ記録仕様
 *   - 4-1. logNoteCreated 呼び出し時にNote新規追加ログが LogsRepository に追加されること
 *   - 4-2. logNoteDeleted 呼び出し時にNote削除ログが LogsRepository に追加されること
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SystemLogService } from "./system-log.service";
import type { LogsRepository } from "@/repositories/logs.repository";
import type { LogsController } from "@/controllers/logs.controller";

describe("SystemLogService (TDD)", () => {
  let fakeLogsRepository: {
    add: ReturnType<typeof vi.fn>;
  };
  let fakeLogsController: {
    refresh: ReturnType<typeof vi.fn>;
  };
  let service: SystemLogService;

  beforeEach(() => {
    fakeLogsRepository = {
      add: vi.fn().mockResolvedValue(101),
    };
    fakeLogsController = {
      refresh: vi.fn().mockResolvedValue(undefined),
    };
    service = new SystemLogService(
      fakeLogsRepository as unknown as LogsRepository,
      fakeLogsController as unknown as LogsController,
    );
  });

  describe("1. 基本記録・連携ライフサイクル仕様", () => {
    it("1-1. recordLog 呼び出し時に LogsRepository.add が正しい taskId と value で呼び出されること", async () => {
      const logId = await service.recordLog(1, "テストログ内容");

      expect(logId).toBe(101);
      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const callArg = fakeLogsRepository.add.mock.calls[0][0];
      expect(callArg.taskId).toBe(1);
      expect(callArg.title).toBe("テストログ内容");
      expect(callArg.value).toBe("テストログ内容");
      expect(callArg.createdAt).toBeInstanceOf(Date);
      expect(callArg.updatedAt).toBeInstanceOf(Date);
    });

    it("1-4. recordLog 呼び出し時に Markdown 見出しから title が自動抽出されて LogsRepository.add に渡されること", async () => {
      await service.recordLog(1, "### sys: タスク更新: \"テスト\"\n\n詳細内容");

      const callArg = fakeLogsRepository.add.mock.calls[0][0];
      expect(callArg.title).toBe("sys: タスク更新: \"テスト\"");
    });

    it("1-2. LogsController が設定されている場合、ログ追加後に logsController.refresh() が呼び出されること", async () => {
      await service.recordLog(1, "テストログ内容");

      expect(fakeLogsController.refresh).toHaveBeenCalledTimes(1);
    });

    it("1-3. LogsController が未設定の場合でもエラーなくログ保存が行われること", async () => {
      const standaloneService = new SystemLogService(
        fakeLogsRepository as unknown as LogsRepository,
      );

      const logId = await standaloneService.recordLog(1, "テストログ内容");
      expect(logId).toBe(101);
      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
    });
  });

  describe("2. タスク関連システムログ記録仕様", () => {
    it("2-1. logTaskCreated 呼び出し時にタスク新規追加ログが追加されること", async () => {
      await service.logTaskCreated(1, {
        name: "新タスク",
        dueDate: new Date(2026, 9, 31),
        labelName: "開発",
        fiscalYear: 2026,
        statusCode: 0,
      });

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: タスク作成: "新タスク"`);
      expect(fakeLogsController.refresh).toHaveBeenCalledTimes(1);
    });

    it("2-2. logTaskNameChanged 呼び出し時にタスク名変更ログが追加されること", async () => {
      await service.logTaskNameChanged(1, "旧名", "新名");

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: タスク名変更: "旧名" → "新名"`);
    });

    it("2-3. logTaskStatusChanged 呼び出し時にタスクステータス変更ログが追加されること", async () => {
      await service.logTaskStatusChanged(1, 0, 5);

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: タスクステータス変更: 開始待ち → 対応中`);
    });

    it("2-4. logTaskDueDateChanged 呼び出し時にタスク期日変更ログが追加されること", async () => {
      await service.logTaskDueDateChanged(
        1,
        new Date(2026, 9, 20),
        new Date(2026, 9, 31),
      );

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: タスク期日変更: 2026-10-20 → 2026-10-31`);
    });

    it("2-5. logTaskLabelChanged 呼び出し時にタスクラベル変更ログが追加されること", async () => {
      await service.logTaskLabelChanged(1, "旧ラベル", "新ラベル", 1, 2);

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: タスクラベル変更: 旧ラベル → 新ラベル`);
    });

    it("2-6. logTaskFiscalYearChanged 呼び出し時にタスク年度変更ログが追加されること", async () => {
      await service.logTaskFiscalYearChanged(1, 2025, 2026);

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: タスク年度変更: 2025年度 → 2026年度`);
    });
  });

  describe("3. Issue関連システムログ記録仕様", () => {
    it("3-1. logIssueCreated 呼び出し時にIssue新規追加ログが追加されること", async () => {
      await service.logIssueCreated(1, 10, new Date(2026, 9, 25), 0);

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: Issue #10 作成`);
    });

    it("3-2. logIssueBulkCreated 呼び出し時にIssue一括作成ログが追加されること", async () => {
      await service.logIssueBulkCreated(1, [
        { id: 10, title: "Issue A" },
        { id: 11, title: "Issue B" },
      ]);

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: Issue一括作成: 2件 (#10, #11)`);
    });

    it("3-4. logIssueStatusChanged 呼び出し時にIssueステータス変更ログが追加されること", async () => {
      await service.logIssueStatusChanged(1, 10, "Issue A", 0, 9);

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: Issue #10 ステータス変更: 開始待ち → 完了`);
    });

    it("3-5. logIssueDueDateChanged 呼び出し時にIssue期日変更ログが追加されること", async () => {
      await service.logIssueDueDateChanged(
        1,
        10,
        "Issue A",
        new Date(2026, 9, 20),
        new Date(2026, 9, 25),
      );

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: Issue #10 期日変更: 2026-10-20 → 2026-10-25`);
    });

    it("3-6. logIssueDeleted 呼び出し時にIssue削除ログが追加されること", async () => {
      await service.logIssueDeleted(1, {
        id: 10,
        title: "Issue A",
        statusCode: 5,
        dueDate: new Date(2026, 9, 25),
      });

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: Issue #10 削除: "Issue A"`);
    });
  });

  describe("4. Note関連システムログ記録仕様", () => {
    it("4-1. logNoteCreated 呼び出し時にNote新規追加ログが追加されること", async () => {
      await service.logNoteCreated(1, 5);

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: Note #5 作成`);
    });

    it("4-2. logNoteDeleted 呼び出し時にNote削除ログが追加されること", async () => {
      await service.logNoteDeleted(1, 5, "定例議事録");

      expect(fakeLogsRepository.add).toHaveBeenCalledTimes(1);
      const content = fakeLogsRepository.add.mock.calls[0][0].value;
      expect(content).toContain(`sys: Note #5 削除: "定例議事録"`);
    });
  });
});
