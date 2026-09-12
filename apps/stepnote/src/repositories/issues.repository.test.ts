import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import type { IssueRecord } from "@/db/models/task.model";
import { IssuesRepository } from "@/repositories/issues.repository";

/**
 * 【IssuesRepository 仕様】
 *
 * 1. データ取得・初期化
 *    - [x] 1-1. 指定したtaskIdに紐づくIssueが存在しない場合は空配列 [] を返すこと
 *    - [x] 1-2. 指定したtaskIdのIssueリストを取得できること
 * 2. CRUD 操作
 *    - [x] 2-1. 新規Issueを正常に追加できること
 *    - [x] 2-2. 既存Issueのプロパティを更新できること
 *    - [x] 2-3. 指定したidのIssueを削除できること
 * 3. ステータスコードの更新
 *    - [x] 3-1. 指定したidのIssueのステータスコードを正常に更新できること
 *    - [x] 3-2. 存在しないidのIssueを更新しようとした場合、例外がスローされること
 */
describe("issues repository tests", () => {
  let repository: IssuesRepository;

  beforeEach(async () => {
    await db.issues.clear();
    repository = new IssuesRepository();
  });

  describe("1. データ取得・初期化", () => {
    it("1-1. 指定したtaskIdに紐づくIssueが存在しない場合は空配列 [] を返すこと", async () => {
      const result: IssueRecord[] = await repository.getByTaskId(99999);
      expect(result).toEqual([]);
    });

    it("1-2. 指定したtaskIdのIssueリストを取得できること", async () => {
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
      expect(result[0].title).toEqual(issue1.title);
      expect(result[0].taskId).toEqual(1);
      expect(result[1].title).toEqual(issue2.title);
      expect(result[1].taskId).toEqual(1);
    });
  });

  describe("2. CRUD 操作", () => {
    it("2-1. 新規Issueを正常に追加できること", async () => {
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
      expect(result?.id).toEqual(id);
      expect(result?.taskId).toEqual(newIssue.taskId);
      expect(result?.statusCode).toEqual(newIssue.statusCode);
      expect(result?.title).toEqual(newIssue.title);
      expect(result?.value).toEqual(newIssue.value);
      expect(result?.dueDate).toEqual(newIssue.dueDate);
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

      const updatedIssue: Partial<Omit<IssueRecord, "id">> = {
        title: "Updated Issue",
        value: "Updated Content",
        statusCode: 5,
        dueDate: new Date("2026-05-15"),
      };
      await repository.update(id, updatedIssue);
      const result = await db.issues.get(id);

      expect(result).toBeDefined();
      expect(result?.title).toEqual(updatedIssue.title);
      expect(result?.value).toEqual(updatedIssue.value);
      expect(result?.statusCode).toEqual(updatedIssue.statusCode);
      expect(result?.dueDate).toEqual(updatedIssue.dueDate);
      expect(result?.taskId).toEqual(baseIssue.taskId);
    });

    it("2-3. 指定したidのIssueを削除できること", async () => {
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
  });

  describe("3. ステータスコードの更新", () => {
    it("3-1. 指定したidのIssueのステータスコードを正常に更新できること", async () => {
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

      expect(result?.statusCode).toEqual(5);
    });

    it("3-2. 存在しないidのIssueを更新しようとした場合、例外がスローされること", async () => {
      await expect(repository.updateStatusCode(99999, 5)).rejects.toThrow(
        "Issue with id 99999 not found",
      );
    });
  });
});
