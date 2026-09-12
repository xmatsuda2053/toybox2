import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import type { TaskRecord } from "@/db/models/task.model";
import { TaskRepository } from "@/repositories/task.repository";

/**
 * 【TaskRepository 仕様】
 *
 * 1. データ取得・初期化 (Read)
 *    - [x] 1-1. 空のDBからの全件取得で空配列 [] を返すこと
 *    - [x] 1-2. 保存されている全タスクを取得できること
 *    - [x] 1-3. 指定したIDのタスクを取得できること
 *    - [x] 1-4. 存在しないIDの場合は undefined を返すこと
 *
 * 2. CRUD 操作 (Create / Update / Delete)
 *    - [x] 2-1. 新規タスクを正常に追加でき、自動採番された ID が返ること
 *    - [x] 2-2. 既存タスクの Summary 項目（name, description 等）を部分更新できること
 *    - [x] 2-3. 既存タスクの Property 項目（statusCode, dueDate, labelId, bookmark 等）を部分更新できること
 *    - [x] 2-4. 指定したIDのタスクを削除できること
 *
 * 3. 選択状態の操作と単一選択制御 (Selection Persistence)
 *    - [x] 3-1. 指定したIDのタスクを選択状態（selected: true）に更新できること
 *    - [x] 3-2. 別のタスクを選択した際、前回選択されていたタスクの selected が false に解除されること（単一選択制御）
 *    - [x] 3-3. すべてのタスクの選択状態を解除できること（clearSelection）
 */
describe("TaskRepository Tests", () => {
  let repository: TaskRepository;

  beforeEach(async () => {
    await db.tasks.clear();
    repository = new TaskRepository();
  });

  describe("1. データ取得・初期化 (Read)", () => {
    it("1-1. 空のDBからの全件取得で空配列 [] を返すこと", async () => {
      const result: TaskRecord[] = await repository.getAll();
      expect(result).toEqual([]);
    });

    it("1-2. 保存されている全タスクを取得できること", async () => {
      const task1: Omit<TaskRecord, "id"> = {
        name: "Task 1",
        statusCode: 0,
        dueDate: new Date("2026-04-01"),
        contacts: [],
        description: "Description 1",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      };
      const task2: Omit<TaskRecord, "id"> = {
        name: "Task 2",
        statusCode: 5,
        dueDate: new Date("2026-04-15"),
        contacts: [
          {
            div: "Div A",
            name: "User A",
            tel: "090-0000-0000",
          },
        ],
        description: "Description 2",
        fiscalYear: 2026,
        labelId: 2,
        bookmark: true,
        selected: false,
      };

      await db.tasks.bulkAdd([task1, task2]);

      const result: TaskRecord[] = await repository.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe(task1.name);
      expect(result[0].statusCode).toBe(task1.statusCode);
      expect(result[1].name).toBe(task2.name);
      expect(result[1].statusCode).toBe(task2.statusCode);
      expect(result[1].bookmark).toBe(true);
    });

    it("1-3. 指定したIDのタスクを取得できること", async () => {
      const newTask: Omit<TaskRecord, "id"> = {
        name: "Test Task",
        statusCode: 0,
        dueDate: new Date("2026-05-01"),
        contacts: [],
        description: "Task Description",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      };

      const id = await db.tasks.add(newTask);
      const result: TaskRecord | undefined = await repository.getById(id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(id);
      expect(result?.name).toBe(newTask.name);
      expect(result?.statusCode).toBe(newTask.statusCode);
      expect(result?.description).toBe(newTask.description);
    });

    it("1-4. 存在しないIDの場合は undefined を返すこと", async () => {
      const result: TaskRecord | undefined = await repository.getById(99999);
      expect(result).toBeUndefined();
    });
  });

  describe("2. CRUD 操作 (Create / Update / Delete)", () => {
    it("2-1. 新規タスクを正常に追加でき、自動採番された ID が返ること", async () => {
      const newTask: Omit<TaskRecord, "id"> = {
        name: "New Task",
        statusCode: 0,
        dueDate: new Date("2026-06-01"),
        contacts: [
          {
            div: "Dev Team",
            name: "Developer",
            tel: "03-0000-0000",
          },
        ],
        description: "New Task Description",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      };

      const id = await repository.add(newTask);
      expect(typeof id).toBe("number");
      expect(id).toBeGreaterThan(0);

      const result = await db.tasks.get(id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(id);
      expect(result?.name).toBe(newTask.name);
      expect(result?.statusCode).toBe(newTask.statusCode);
      expect(result?.description).toBe(newTask.description);
      expect(result?.contacts).toEqual(newTask.contacts);
      expect(result?.fiscalYear).toBe(newTask.fiscalYear);
      expect(result?.labelId).toBe(newTask.labelId);
      expect(result?.bookmark).toBe(newTask.bookmark);
      expect(result?.selected).toBe(newTask.selected);
    });

    it("2-2. 既存タスクの Summary 項目（name, description 等）を部分更新できること", async () => {
      const baseTask: Omit<TaskRecord, "id"> = {
        name: "Base Task",
        statusCode: 0,
        dueDate: new Date("2026-06-01"),
        contacts: [],
        description: "Base Description",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      };

      const id = await repository.add(baseTask);

      const updatedSummary: Partial<Omit<TaskRecord, "id">> = {
        name: "Updated Task Name",
        description: "Updated Task Description",
      };

      await repository.update(id, updatedSummary);

      const result = await db.tasks.get(id);
      expect(result).toBeDefined();
      expect(result?.name).toBe(updatedSummary.name);
      expect(result?.description).toBe(updatedSummary.description);
      expect(result?.statusCode).toBe(baseTask.statusCode);
      expect(result?.fiscalYear).toBe(baseTask.fiscalYear);
      expect(result?.labelId).toBe(baseTask.labelId);
    });

    it("2-3. 既存タスクの Property 項目（statusCode, dueDate, labelId, bookmark 等）を部分更新できること", async () => {
      const baseTask: Omit<TaskRecord, "id"> = {
        name: "Base Task",
        statusCode: 0,
        dueDate: new Date("2026-06-01"),
        contacts: [],
        description: "Base Description",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      };

      const id = await repository.add(baseTask);

      const updatedProperty: Partial<Omit<TaskRecord, "id">> = {
        statusCode: 5,
        dueDate: new Date("2026-07-01"),
        labelId: 99,
        bookmark: true,
      };

      await repository.update(id, updatedProperty);

      const result = await db.tasks.get(id);
      expect(result).toBeDefined();
      expect(result?.statusCode).toBe(updatedProperty.statusCode);
      expect(result?.dueDate).toEqual(updatedProperty.dueDate);
      expect(result?.labelId).toBe(updatedProperty.labelId);
      expect(result?.bookmark).toBe(updatedProperty.bookmark);
      expect(result?.name).toBe(baseTask.name);
      expect(result?.description).toBe(baseTask.description);
      expect(result?.fiscalYear).toBe(baseTask.fiscalYear);
    });

    it("2-4. 指定したIDのタスクを削除できること", async () => {
      const newTask: Omit<TaskRecord, "id"> = {
        name: "Task to delete",
        statusCode: 0,
        dueDate: new Date("2026-06-01"),
        contacts: [],
        description: "Delete target",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      };

      const id = await repository.add(newTask);
      await repository.delete(id);

      const result = await db.tasks.get(id);
      expect(result).toBeUndefined();
    });
  });

  describe("3. 選択状態の操作と単一選択制御 (Selection Persistence)", () => {
    it("3-1. 指定したIDのタスクを選択状態（selected: true）に更新できること", async () => {
      const task: Omit<TaskRecord, "id"> = {
        name: "Task 1",
        statusCode: 0,
        dueDate: new Date("2026-06-01"),
        contacts: [],
        description: "Task 1 Description",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      };

      const id = await repository.add(task);
      await repository.select(id);

      const result = await db.tasks.get(id);
      expect(result?.selected).toBe(true);
    });

    it("3-2. 別のタスクを選択した際、前回選択されていたタスクの selected が false に解除されること（単一選択制御）", async () => {
      const task1: Omit<TaskRecord, "id"> = {
        name: "Task 1",
        statusCode: 0,
        dueDate: new Date("2026-06-01"),
        contacts: [],
        description: "Task 1 Description",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      };
      const task2: Omit<TaskRecord, "id"> = {
        name: "Task 2",
        statusCode: 0,
        dueDate: new Date("2026-06-02"),
        contacts: [],
        description: "Task 2 Description",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      };

      const id1 = await repository.add(task1);
      const id2 = await repository.add(task2);

      await repository.select(id1);
      const result1Before = await db.tasks.get(id1);
      expect(result1Before?.selected).toBe(true);

      await repository.select(id2);

      const result1After = await db.tasks.get(id1);
      const result2After = await db.tasks.get(id2);

      expect(result1After?.selected).toBe(false);
      expect(result2After?.selected).toBe(true);
    });

    it("3-3. すべてのタスクの選択状態を解除できること（clearSelection）", async () => {
      const task1: Omit<TaskRecord, "id"> = {
        name: "Task 1",
        statusCode: 0,
        dueDate: new Date("2026-06-01"),
        contacts: [],
        description: "Task 1 Description",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: true,
      };
      const task2: Omit<TaskRecord, "id"> = {
        name: "Task 2",
        statusCode: 0,
        dueDate: new Date("2026-06-02"),
        contacts: [],
        description: "Task 2 Description",
        fiscalYear: 2026,
        labelId: 1,
        bookmark: false,
        selected: false,
      };

      await repository.add(task1);
      await repository.add(task2);

      await repository.clearSelection();

      const result: TaskRecord[] = await repository.getAll();
      expect(result.length).toBe(2);
      expect(result.every((t) => t.selected === false)).toBe(true);
    });
  });
});
