import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "./database.schema";
import {
  TaskRecord,
  LogRecord,
  NoteRecord,
  QuickAccessRecord,
  LabelRecord,
} from "../models/index";

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
      currentStatus: {
        text: "blank",
        type: "default",
      },
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
});
