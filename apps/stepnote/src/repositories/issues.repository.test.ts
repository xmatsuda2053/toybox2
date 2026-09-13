import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import type { IssueRecord } from "@/db/models/task.model";
import { IssuesRepository } from "@/repositories/issues.repository";

/**
 * 【IssuesRepository 仕様】
 *
 * 1. データ取得・初期化 (Read)
 *    - [x] 1-1. 空のDBからの全件取得で空配列 [] を返すこと
 *    - [x] 1-2. 保存されている全Issueを取得できること (getAll)
 *    - [x] 1-3. 指定したIDのIssueを取得できること (getById)
 *    - [x] 1-4. 存在しないIDの場合は undefined を返すこと (getById)
 *    - [x] 1-5. 指定したtaskIdに紐づくIssueが存在しない場合は空配列 [] を返すこと (getByTaskId)
 *    - [x] 1-6. 指定したtaskIdのIssueリストを取得できること (getByTaskId)
 *
 * 2. CRUD 操作 (Create / Update / Delete)
 *    - [x] 2-1. 新規Issueを正常に追加でき、自動採番された ID が返ること
 *    - [x] 2-2. 既存Issueのプロパティを更新できること
 *    - [x] 2-3. 指定したIDのIssueを削除できること
 *    - [x] 2-4. 指定したtaskIdに紐づくIssueを一括削除できること (deleteByTaskId)
 *
 * 3. ステータスコードの更新 (Status Update)
 *    - [x] 3-1. 指定したIDのIssueのステータスコードを正常に更新できること
 *    - [x] 3-2. 存在しないIDのIssueを更新しようとした場合、例外がスローされること
 */
describe("IssuesRepository Tests", () => {
  let repository: IssuesRepository;

  beforeEach(async () => {
    await db.issues.clear();
    repository = new IssuesRepository();
  });

  describe("1. データ取得・初期化 (Read)", () => {
    it("1-1. 空のDBからの全件取得で空配列 [] を返すこと", async () => {
      const result: IssueRecord[] = await repository.getAll();
      expect(result).toEqual([]);
    });

    it("1-2. 保存されている全Issueを取得できること (getAll)", async () => {
      const issue1: Omit<IssueRecord, "id"> = {
        taskId: 1,
        statusCode: 0,
        title: "Issue 1",
        value: "Content 1",
        dueDate: new Date("2026-04-01"),
      };
      const issue2: Omit<IssueRecord, "id"> = {
        taskId: 2,
        statusCode: 5,
        title: "Issue 2",
        value: "Content 2",
        dueDate: new Date("2026-04-02"),
      };

      await db.issues.bulkAdd([issue1, issue2]);

      const result: IssueRecord[] = await repository.getAll();
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Issue 1");
      expect(result[1].title).toBe("Issue 2");
    });

    it("1-3. 指定したIDのIssueを取得できること (getById)", async () => {
      const issue: Omit<IssueRecord, "id"> = {
        taskId: 1,
        statusCode: 0,
        title: "Target Issue",
        value: "Target Content",
        dueDate: new Date("2026-04-01"),
      };
      const id = await db.issues.add(issue);

      const result: IssueRecord | undefined = await repository.getById(id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(id);
      expect(result?.title).toBe("Target Issue");
    });

    it("1-4. 存在しないIDの場合は undefined を返すこと (getById)", async () => {
      const result: IssueRecord | undefined = await repository.getById(99999);
      expect(result).toBeUndefined();
    });

    it("1-5. 指定したtaskIdに紐づくIssueが存在しない場合は空配列 [] を返すこと (getByTaskId)", async () => {
      const result: IssueRecord[] = await repository.getByTaskId(99999);
      expect(result).toEqual([]);
    });

    it("1-6. 指定したtaskIdのIssueリストを取得できること (getByTaskId)", async () => {
      const issue1: Omit<IssueRecord, "id"> = {
        taskId: 1,
        statusCode: 0,
        title: "Issue 1",
        value: "Content 1",
        dueDate: new Date("2026-04-01"),
      };
      const issue2: Omit<IssueRecord, "id"> = {
        taskId: 1,
        statusCode: 5,
        title: "Issue 2",
        value: "Content 2",
        dueDate: new Date("2026-04-02"),
      };
      const otherIssue: Omit<IssueRecord, "id"> = {
        taskId: 2,
        statusCode: 0,
        title: "Other Issue",
        value: "Other Content",
        dueDate: new Date("2026-04-03"),
      };

      await db.issues.bulkAdd([issue1, issue2, otherIssue]);

      const result: IssueRecord[] = await repository.getByTaskId(1);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe(issue1.title);
      expect(result[1].title).toBe(issue2.title);
    });
  });

  describe("2. CRUD 操作 (Create / Update / Delete)", () => {
    it("2-1. 新規Issueを正常に追加でき、自動採番された ID が返ること", async () => {
      const newIssue: Omit<IssueRecord, "id"> = {
        taskId: 1,
        statusCode: 0,
        title: "New Issue",
        value: "New Issue Description",
        dueDate: new Date("2026-05-01"),
      };

      const id = await repository.add(newIssue);
      const result = await db.issues.get(id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(id);
      expect(result?.title).toBe(newIssue.title);
    });

    it("2-2. 既存Issueのプロパティを更新できること", async () => {
      const baseIssue: Omit<IssueRecord, "id"> = {
        taskId: 1,
        statusCode: 0,
        title: "Base Issue",
        value: "Base Content",
        dueDate: new Date("2026-05-01"),
      };

      const id = await repository.add(baseIssue);
      await repository.update(id, { title: "Updated Issue", statusCode: 5 });
      const result = await db.issues.get(id);

      expect(result?.title).toBe("Updated Issue");
      expect(result?.statusCode).toBe(5);
    });

    it("2-3. 指定したIDのIssueを削除できること", async () => {
      const newIssue: Omit<IssueRecord, "id"> = {
        taskId: 1,
        statusCode: 0,
        title: "Test Issue",
        value: "Test Content",
        dueDate: new Date("2026-05-01"),
      };

      const id = await repository.add(newIssue);
      await repository.delete(id);
      const result = await db.issues.get(id);

      expect(result).toBeUndefined();
    });

    it("2-4. 指定したtaskIdに紐づくIssueを一括削除できること (deleteByTaskId)", async () => {
      const issue1: Omit<IssueRecord, "id"> = {
        taskId: 1,
        statusCode: 0,
        title: "Issue 1-1",
        value: "Content 1-1",
        dueDate: new Date("2026-04-01"),
      };
      const issue2: Omit<IssueRecord, "id"> = {
        taskId: 1,
        statusCode: 5,
        title: "Issue 1-2",
        value: "Content 1-2",
        dueDate: new Date("2026-04-02"),
      };
      const otherIssue: Omit<IssueRecord, "id"> = {
        taskId: 2,
        statusCode: 0,
        title: "Issue 2-1",
        value: "Content 2-1",
        dueDate: new Date("2026-04-03"),
      };

      await db.issues.bulkAdd([issue1, issue2, otherIssue]);

      await repository.deleteByTaskId(1);

      const remainingTaskId1 = await repository.getByTaskId(1);
      const remainingTaskId2 = await repository.getByTaskId(2);

      expect(remainingTaskId1).toEqual([]);
      expect(remainingTaskId2).toHaveLength(1);
      expect(remainingTaskId2[0].title).toBe("Issue 2-1");
    });
  });

  describe("3. ステータスコードの更新 (Status Update)", () => {
    it("3-1. 指定したIDのIssueのステータスコードを正常に更新できること", async () => {
      const baseIssue: Omit<IssueRecord, "id"> = {
        taskId: 1,
        statusCode: 0,
        title: "Test Issue",
        value: "Test Content",
        dueDate: new Date("2026-05-01"),
      };

      const id = await repository.add(baseIssue);
      await repository.updateStatusCode(id, 5);
      const result = await db.issues.get(id);

      expect(result?.statusCode).toBe(5);
    });

    it("3-2. 存在しないIDのIssueを更新しようとした場合、例外がスローされること", async () => {
      await expect(repository.updateStatusCode(99999, 5)).rejects.toThrow(
        "Issue with id 99999 not found",
      );
    });
  });
});
