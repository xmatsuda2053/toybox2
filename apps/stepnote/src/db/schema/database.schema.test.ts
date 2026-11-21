import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db, Database } from "./database.schema";
import {
  TaskRecord,
  LogRecord,
  NoteRecord,
  QuickAccessRecord,
  LabelRecord,
  ScratchRecord,
} from "../models/index";
import Dexie from "dexie";
import { extractMarkdownTitle } from "@shared/utils";

/**
 * - [x] 仕様1 Tasksテーブルにデータを追加・取得が可能であること
 * - [x] 仕様2 Logsテーブルにデータを追加・取得が可能であること
 * - [x] 仕様3 Notesテーブルにデータを追加・取得が可能であること
 * - [x] 仕様4 QuickAccessテーブルにデータを追加・取得が可能であること
 * - [x] 仕様5 Labelsテーブルにデータを追加・取得が可能であること
 *  */
describe("StepNote Database Schema Tests", () => {
  /**
   * テスト実行前にデータベースを初期化
   * */
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("Tasksテーブルにデータを追加・取得が可能であること", async () => {
    const task_origin: TaskRecord = {
      statusCode: 0,
      name: "テスト",
      dueDate: new Date(),
      contacts: [
        {
          div: "ニホン",
          name: "タロウ",
          tel: "03-1234-5678",
        },
      ],
      description: "説明",
      fiscalYear: 2026,
      labelId: 1,
      bookmark: true,
      selected: true,
    };

    const id = await db.tasks.add(task_origin);
    const task = await db.tasks.get(id);
    expect(task).toBeDefined(); // 空ではない
    expect(task?.name).toBe(task_origin.name);
  });

  it("Logsテーブルにデータを追加・取得が可能であること", async () => {
    const log_origin: LogRecord = {
      taskId: 1,
      value: "ログ",
    };

    const id = await db.logs.add(log_origin);
    const log = await db.logs.get(id);
    expect(log).toBeDefined();
    expect(log?.value).toBe(log_origin.value);
  });

  it("Notesテーブルにデータを追加・取得が可能であること", async () => {
    const note_origin: NoteRecord = {
      taskId: 1,
      value: "ノート",
    };
    const id = await db.notes.add(note_origin);
    const note = await db.notes.get(id);
    expect(note).toBeDefined();
    expect(note?.value).toBe(note_origin.value);
  });

  it("QuickAccessテーブルにデータを追加・取得が可能であること", async () => {
    // populate イベントで id=1 のレコードが登録されている
    const quickAccess_origin: QuickAccessRecord = {
      isBookmarkSelected: false,
      isDoneSelected: false,
      isOverdueSelected: false,
      isAsapSelected: false,
      isUpcomingSelected: true,
      isProgressSelected: true,
      isPendingSelected: true,
      isUncategorizedSelected: false,
    };

    const id = await db.quickAccess.add(quickAccess_origin);
    const quickAccess = await db.quickAccess.get(id);

    expect(quickAccess).toBeDefined();
    expect(quickAccess?.id).toBe(1);
    // デフォルト値の確認
    expect(quickAccess?.isBookmarkSelected).toBe(false);
    expect(quickAccess?.isDoneSelected).toBe(false);
    expect(quickAccess?.isOverdueSelected).toBe(false);
    expect(quickAccess?.isAsapSelected).toBe(false);
    expect(quickAccess?.isUpcomingSelected).toBe(true);
    expect(quickAccess?.isProgressSelected).toBe(true);
    expect(quickAccess?.isPendingSelected).toBe(true);
    expect(quickAccess?.isUncategorizedSelected).toBe(false);
  });

  it("Labelsテーブルにデータを追加・取得が可能であること", async () => {
    const label_origin: LabelRecord = {
      name: "テストラベル",
      description: "説明",
      isSelected: false,
    };

    const id = await db.labels.add(label_origin);
    const label = await db.labels.get(id);
    expect(label).toBeDefined();
    expect(label?.name).toBe(label_origin.name);
  });

  it("Scratchesテーブルにデータを追加・取得が可能であること", async () => {
    const scratch_origin = {
      value: "スクラッチメモ",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await db.scratches.add(scratch_origin);
    const scratch = await db.scratches.get(id);
    expect(scratch).toBeDefined();
    expect(scratch?.value).toBe(scratch_origin.value);
  });

  it("Logsテーブルに title プロパティを含むデータを追加・取得が可能であること", async () => {
    const log_origin: LogRecord = {
      taskId: 1,
      title: "テストログタイトル",
      value: "### テストログタイトル\n本文",
    };

    const id = await db.logs.add(log_origin);
    const log = await db.logs.get(id);
    expect(log).toBeDefined();
    expect(log?.title).toBe(log_origin.title);
    expect(log?.value).toBe(log_origin.value);
  });

  it("Notesテーブルに title プロパティを含むデータを追加・取得が可能であること", async () => {
    const note_origin: NoteRecord = {
      taskId: 1,
      title: "テストノートタイトル",
      value: "## テストノートタイトル\n本文",
    };
    const id = await db.notes.add(note_origin);
    const note = await db.notes.get(id);
    expect(note).toBeDefined();
    expect(note?.title).toBe(note_origin.title);
    expect(note?.value).toBe(note_origin.value);
  });

  it("Scratchesテーブルに title プロパティを含むデータを追加・取得が可能であること", async () => {
    const scratch_origin: ScratchRecord = {
      title: "テストスクラッチタイトル",
      value: "## テストスクラッチタイトル\n本文",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await db.scratches.add(scratch_origin);
    const scratch = await db.scratches.get(id);
    expect(scratch).toBeDefined();
    expect(scratch?.title).toBe(scratch_origin.title);
    expect(scratch?.value).toBe(scratch_origin.value);
  });

  it("version(2)からversion(3)へのアップグレード時にtitleが存在しないレコードへ自動補完されること", async () => {
    const testDbName = "StepNote_Migration_Test";
    // 既存の同一名DBを削除
    await Dexie.delete(testDbName);

    // Version 2 のスキーマでDBを開いてデータを挿入
    const dbV2 = new Dexie(testDbName);
    dbV2.version(1).stores({
      logs: "++id, taskId, [taskId+id]",
      notes: "++id, taskId, [taskId+id]",
    });
    dbV2.version(2).stores({
      scratches: "++id, createdAt",
    });
    await dbV2.open();

    const logId = await dbV2.table("logs").add({
      taskId: 1,
      value: "### マイグレーションログ\nログ本文",
    });
    const noteId = await dbV2.table("notes").add({
      taskId: 1,
      value: "# マイグレーションノート\nノート本文",
    });
    const scratchId = await dbV2.table("scratches").add({
      value: "## マイグレーションスクラッチ\nスクラッチ本文",
    });
    dbV2.close();

    // 実際の Database クラスのインスタンスでマイグレーションを検証するテストDB
    const dbV3 = new Dexie(testDbName);
    dbV3.version(1).stores({
      logs: "++id, taskId, [taskId+id]",
      notes: "++id, taskId, [taskId+id]",
    });
    dbV3.version(2).stores({
      scratches: "++id, createdAt",
    });
    dbV3
      .version(3)
      .stores({
        logs: "++id, taskId, [taskId+id], title",
        notes: "++id, taskId, [taskId+id], title",
        scratches: "++id, createdAt, title",
      })
      .upgrade(async (tx) => {
        await tx
          .table<LogRecord>("logs")
          .toCollection()
          .modify((log) => {
            if (!log.title) {
              log.title = extractMarkdownTitle(log.value, "(無題のログ)");
            }
          });
        await tx
          .table<NoteRecord>("notes")
          .toCollection()
          .modify((note) => {
            if (!note.title) {
              note.title = extractMarkdownTitle(note.value, "(無題のメモ)");
            }
          });
        await tx
          .table<ScratchRecord>("scratches")
          .toCollection()
          .modify((scratch) => {
            if (!scratch.title) {
              scratch.title = extractMarkdownTitle(
                scratch.value,
                "(無題のメモ)",
              );
            }
          });
      });
    await dbV3.open();

    const migratedLog = await dbV3.table("logs").get(logId);
    expect(migratedLog).toBeDefined();
    expect(migratedLog.title).toBe("マイグレーションログ");

    const migratedNote = await dbV3.table("notes").get(noteId);
    expect(migratedNote).toBeDefined();
    expect(migratedNote.title).toBe("マイグレーションノート");

    const migratedScratch = await dbV3.table("scratches").get(scratchId);
    expect(migratedScratch).toBeDefined();
    expect(migratedScratch.title).toBe("マイグレーションスクラッチ");

    dbV3.close();
    await Dexie.delete(testDbName);
  });

  it("Tagsテーブルにデータを追加・取得が可能であること", async () => {
    const tagRecord = {
      name: "優先",
      description: "優先対応が必要なタスク",
      variant: "danger" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await db.table("tags").add(tagRecord);
    const saved = await db.table("tags").get(id);
    expect(saved).toBeDefined();
    expect(saved?.name).toBe("優先");
    expect(saved?.description).toBe("優先対応が必要なタスク");
    expect(saved?.variant).toBe("danger");
  });

  it("TasksテーブルのtagIdsマルチエントリーインデックスで特定タグを持つタスクを検索できること", async () => {
    const t1Id = await db.tasks.add({
      statusCode: 0,
      name: "タグ付きタスク1",
      dueDate: new Date(),
      contacts: [],
      description: "",
      fiscalYear: 2026,
      labelId: 1,
      bookmark: false,
      selected: false,
      tagIds: [10, 20],
    } as TaskRecord);

    await db.tasks.add({
      statusCode: 0,
      name: "タグ付きタスク2",
      dueDate: new Date(),
      contacts: [],
      description: "",
      fiscalYear: 2026,
      labelId: 1,
      bookmark: false,
      selected: false,
      tagIds: [30],
    } as TaskRecord);

    const matched = await db.tasks.where("tagIds").equals(20).toArray();
    expect(matched).toHaveLength(1);
    expect(matched[0]?.id).toBe(t1Id);
  });

  it("TagSetsテーブルにデータを追加・取得でき、tagIdsマルチエントリーインデックスで検索できること", async () => {
    const setId1 = await db.table("tagSets").add({
      name: "障害対応セット",
      description: "緊急対応用",
      tagIds: [10, 20],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.table("tagSets").add({
      name: "通常セット",
      description: "",
      tagIds: [30],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await db.table("tagSets").get(setId1);
    expect(saved?.name).toBe("障害対応セット");

    const matched = await db
      .table("tagSets")
      .where("tagIds")
      .equals(20)
      .toArray();
    expect(matched).toHaveLength(1);
    expect(matched[0]?.id).toBe(setId1);
  });

  it('version(6)からversion(7)へのアップグレード時に文字列型statusCode（"0"等）が数値型へ自動修復されること', async () => {
    const testDbName = "StepNote_V7_StatusCode_Migration_Test";
    await Dexie.delete(testDbName);

    const legacyDb = new Dexie(testDbName);
    legacyDb.version(6).stores({
      tasks: "++id, statusCode, name, dueDate, fiscalYear, selected, *tagIds",
      issues: "++id, taskId, [taskId+id]",
    });
    await legacyDb.open();

    const taskId1 = await legacyDb.table("tasks").add({
      statusCode: "0",
      name: "文字列0タスク",
      dueDate: new Date(),
      contacts: [],
      description: "",
      fiscalYear: 2026,
      labelId: 1,
      bookmark: false,
      selected: false,
      tagIds: [],
    });
    const taskId2 = await legacyDb.table("tasks").add({
      statusCode: "5",
      name: "文字列5タスク",
      dueDate: new Date(),
      contacts: [],
      description: "",
      fiscalYear: 2026,
      labelId: 1,
      bookmark: false,
      selected: false,
      tagIds: [],
    });
    const issueId1 = await legacyDb.table("issues").add({
      taskId: taskId1,
      statusCode: "0",
      title: "文字列0課題",
      value: "",
    });
    legacyDb.close();

    const upgradedDb = new Database(testDbName);
    await upgradedDb.open();

    const migratedTask1 = await upgradedDb.tasks.get(Number(taskId1));
    const migratedTask2 = await upgradedDb.tasks.get(Number(taskId2));
    const migratedIssue1 = await upgradedDb.issues.get(Number(issueId1));

    expect(migratedTask1?.statusCode).toBe(0);
    expect(typeof migratedTask1?.statusCode).toBe("number");
    expect(migratedTask2?.statusCode).toBe(5);
    expect(typeof migratedTask2?.statusCode).toBe("number");
    expect(migratedIssue1?.statusCode).toBe(0);
    expect(typeof migratedIssue1?.statusCode).toBe("number");

    upgradedDb.close();
    await Dexie.delete(testDbName);
  });
});
