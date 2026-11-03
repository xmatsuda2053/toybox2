import { describe, it, expect } from "vitest";
import { convertSnDbToStepNote, convertCopySyntaxToMarkdownLink } from "./migration.utils";
import type { DexieExportJsonStructure } from "../types/migration.types";

/**
 * データ移行ユーティリティ仕様テスト (migration.utils.test.ts)
 *
 * 1. メタデータ変換仕様:
 *    - 1-1. databaseName が "SnDB" から "StepNote" に置換されること
 *    - 1-2. databaseVersion が 4 に設定されること
 *    - 1-3. tables 定義が新スキーマ（tasks, issues, logs, notes, quickAccess, labels, scratches, taskTemplates）に更新されること
 *    - 1-4. formatName が "dexie"、formatVersion が 1 を維持すること
 *
 * 2. tasks テーブル変換仕様:
 *    - 2-1. bookmark が 1 のとき true、0 のとき false に変換されること
 *    - 2-2. selected が 1 のとき true、0 のとき false に変換されること
 *    - 2-3. 未使用の currentStatus プロパティが削除・除外されること
 *    - 2-4. id, name, dueDate, contacts, description, fiscalYear, labelId 等の既存フィールドが維持されること
 *
 * 3. logs テーブル変換仕様:
 *    - 3-1. title が Markdown 本文（value）の先頭見出し・先頭行から正しく抽出されて付与されること
 *    - 3-2. 本文が空または見出しがない場合、既定値 "(無題のログ)" が title に設定されること
 *    - 3-3. id, taskId, value, createdAt, updatedAt が維持されること
 *
 * 4. notes テーブル変換仕様:
 *    - 4-1. value が空文字または空白のみのレコードが除外（フィルタリング）されること
 *    - 4-2. value にテキストが存在するレコードについて、Markdown 先頭行から title が抽出・付与されること
 *    - 4-3. id, taskId, value, createdAt, updatedAt が維持されること
 *
 * 5. labels テーブル変換仕様:
 *    - 5-1. isSelected が 1 のとき true、0 のとき false に変換されること
 *    - 5-2. description が空文字 "" で初期化・補完されること
 *    - 5-3. 新スキーマに存在しない fiscalYear, createdAt, updatedAt が除外されること
 *
 * 6. quickAccess テーブル変換仕様:
 *    - 6-1. 旧テーブル名 quickAccesses から新テーブル名 quickAccess に変更されること
 *    - 6-2. 全フラグプロパティ（8項目）が 0/1 から boolean に変換されること
 *
 * 7. scratches テーブル変換仕様:
 *    - 7-1. 旧テーブル名 notebooks から新テーブル名 scratches に変更されること
 *    - 7-2. 旧ノートブックの全レコードが移行され、title が維持（または自動抽出）されること
 *    - 7-3. 新スキーマに存在しない selected, pin が除外されること
 *
 * 8. 新規テーブル（issues, taskTemplates）初期化仕様:
 *    - 8-1. issues テーブルが空配列（rowCount: 0, rows: []）として定義されること
 *    - 8-2. taskTemplates テーブルが空配列（rowCount: 0, rows: []）として定義されること
 *
 * 9. 移行対象外テーブルの除外仕様:
 *    - 9-1. 旧 config テーブルが新データから除外されること
 *
 * 11. Markdown記法変換仕様（convertCopySyntaxToMarkdownLink）:
 *     - 11-1. 単一の +{text}+ が [text](text) に変換されること
 *     - 11-2. URLを含む +{https://example.com}+ が [https://example.com](https://example.com) に変換されること
 *     - 11-3. 同一行内に複数の +{...}+ が存在する場合、すべて置換されること
 *     - 11-4. 複数行のテキストにおいて、各行の +{...}+ が正しく置換されること
 *     - 11-5. 改行を挟む +{...\n...}+ は置換対象外としてそのまま維持されること
 *     - 11-6. 空の +{}+ は置換されずそのまま維持されること
 *     - 11-7. 空文字または falsy な値が渡された場合、安全にそのまま返却されること
 *
 * 12. 各テーブルへのMarkdown記法変換適用仕様（convertSnDbToStepNote）:
 *     - 12-1. tasks テーブルの description 内の +{text}+ が [text](text) に変換されること
 *     - 12-2. logs テーブルの value 内の +{text}+ が [text](text) に変換されること
 *     - 12-3. notes テーブルの value 内の +{text}+ が [text](text) に変換されること
 *     - 12-4. scratches テーブルの value 内の +{text}+ が [text](text) に変換されること
 *
 * 10. エラーハンドリング仕様:
 *     - 10-1. 不正な入力（null, undefined, 異なる databaseName）に対して適切なエラーをスローすること
 */

function createMockLegacySnDbJson(): DexieExportJsonStructure {
  return {
    formatName: "dexie",
    formatVersion: 1,
    data: {
      databaseName: "SnDB",
      databaseVersion: 7,
      tables: [
        {
          name: "labels",
          schema: "++id, name, fiscalYear, isSelected",
          rowCount: 2,
        },
        {
          name: "quickAccesses",
          schema: "++id",
          rowCount: 1,
        },
        {
          name: "tasks",
          schema: "++id, statusCode, name, dueDate, fiscalYear, selected",
          rowCount: 2,
        },
        {
          name: "logs",
          schema: "++id, taskId, [taskId+id]",
          rowCount: 2,
        },
        {
          name: "notes",
          schema: "++id, taskId, [taskId+id]",
          rowCount: 3,
        },
        {
          name: "config",
          schema: "id, group, name",
          rowCount: 1,
        },
        {
          name: "notebooks",
          schema: "++id, selected",
          rowCount: 2,
        },
      ],
      data: [
        {
          tableName: "labels",
          inbound: true,
          rows: [
            {
              id: 1,
              name: "開発",
              isSelected: 1,
              fiscalYear: 2026,
              createdAt: "2026-04-01T00:00:00.000Z",
              updatedAt: "2026-04-01T00:00:00.000Z",
            },
            {
              id: 2,
              name: "保守",
              isSelected: 0,
              fiscalYear: 2026,
            },
          ],
        },
        {
          tableName: "quickAccesses",
          inbound: true,
          rows: [
            {
              id: 1,
              isBookmarkSelected: 1,
              isUncategorizedSelected: 0,
              isOverdueSelected: 0,
              isAsapSelected: 1,
              isUpcomingSelected: 0,
              isDoneSelected: 0,
              isProgressSelected: 1,
              isPendingSelected: 1,
            },
          ],
        },
        {
          tableName: "tasks",
          inbound: true,
          rows: [
            {
              id: 10,
              statusCode: "5",
              name: "タスク1",
              dueDate: "2026-11-10T00:00:00.000Z",
              contacts: [{ div: "開発部", name: "山田", tel: "1234" }],
              currentStatus: { text: "作業中メモ", type: "gear" },
              description: "# タスク詳細\nテスト内容です。",
              fiscalYear: 2026,
              labelId: 1,
              bookmark: 1,
              selected: 1,
              createdAt: "2026-11-01T00:00:00.000Z",
              updatedAt: "2026-11-02T00:00:00.000Z",
            },
            {
              id: 11,
              statusCode: "0",
              name: "タスク2",
              dueDate: "2026-11-15T00:00:00.000Z",
              contacts: [],
              currentStatus: { text: "", type: "default" },
              description: "",
              fiscalYear: 2026,
              labelId: 2,
              bookmark: 0,
              selected: 0,
            },
          ],
        },
        {
          tableName: "logs",
          inbound: true,
          rows: [
            {
              id: 101,
              taskId: 10,
              value: "# 作業ログタイトル\n本日の作業内容を記録しました。",
              createdAt: "2026-11-02T10:00:00.000Z",
            },
            {
              id: 102,
              taskId: 10,
              value: "見出しのないログ本文です。",
              createdAt: "2026-11-02T11:00:00.000Z",
            },
          ],
        },
        {
          tableName: "notes",
          inbound: true,
          rows: [
            {
              id: 201,
              taskId: 10,
              value: "## メモ見出し\n重要なメモ内容です。",
              createdAt: "2026-11-01T15:00:00.000Z",
            },
            {
              id: 202,
              taskId: 10,
              value: "", // 空文字（旧仕様で自動生成された空レコード）
            },
            {
              id: 203,
              taskId: 11,
              value: "   \n  \t  ", // 空白のみの空レコード
            },
          ],
        },
        {
          tableName: "config",
          inbound: true,
          rows: [
            {
              id: "g01_0001",
              group: "g01",
              name: "task_limit_day",
              value: 3,
            },
          ],
        },
        {
          tableName: "notebooks",
          inbound: true,
          rows: [
            {
              id: 301,
              title: "共通メモ1",
              value: "# メモ1内容\nテスト",
              selected: 1,
              pin: 1,
              createdAt: "2026-10-01T00:00:00.000Z",
            },
            {
              id: 302,
              title: "",
              value: "### タイトル自動抽出テスト\n本文です",
              selected: 0,
              pin: 0,
            },
          ],
        },
      ],
    },
  };
}

describe("convertSnDbToStepNote", () => {
  describe("1. メタデータ変換仕様", () => {
    it("1-1. databaseName が SnDB から StepNote に置換されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      expect(migratedData.data.databaseName).toBe("StepNote");
    });

    it("1-2. databaseVersion が 4 に設定されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      expect(migratedData.data.databaseVersion).toBe(4);
    });

    it("1-3. tables 定義が新スキーマ（tasks, issues, logs, notes, quickAccess, labels, scratches, taskTemplates）に更新されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const tableNames = migratedData.data.tables.map((t) => t.name);
      expect(tableNames).toEqual([
        "tasks",
        "issues",
        "logs",
        "notes",
        "quickAccess",
        "labels",
        "scratches",
        "taskTemplates",
      ]);
    });

    it("1-4. formatName が dexie、formatVersion が 1 を維持すること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      expect(migratedData.formatName).toBe("dexie");
      expect(migratedData.formatVersion).toBe(1);
    });
  });

  describe("2. tasks テーブル変換仕様", () => {
    it("2-1. bookmark が 1 のとき true、0 のとき false に変換されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const taskTable = migratedData.data.data.find(
        (t) => t.tableName === "tasks",
      );
      expect(taskTable?.rows[0].bookmark).toBe(true);
      expect(taskTable?.rows[1].bookmark).toBe(false);
    });

    it("2-2. selected が 1 のとき true、0 のとき false に変換されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const taskTable = migratedData.data.data.find(
        (t) => t.tableName === "tasks",
      );
      expect(taskTable?.rows[0].selected).toBe(true);
      expect(taskTable?.rows[1].selected).toBe(false);
    });

    it("2-3. 未使用の currentStatus プロパティが削除・除外されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const taskTable = migratedData.data.data.find(
        (t) => t.tableName === "tasks",
      );
      expect(taskTable?.rows[0]).not.toHaveProperty("currentStatus");
      expect(taskTable?.rows[1]).not.toHaveProperty("currentStatus");
    });

    it("2-4. id, name, dueDate, contacts, description, fiscalYear, labelId 等の既存フィールドが維持されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const taskTable = migratedData.data.data.find(
        (t) => t.tableName === "tasks",
      );
      expect(taskTable?.rows[0].id).toBe(10);
      expect(taskTable?.rows[0].name).toBe("タスク1");
      expect(taskTable?.rows[0].fiscalYear).toBe(2026);
      expect(taskTable?.rows[0].labelId).toBe(1);
      expect(taskTable?.rows[0].description).toBe(
        "# タスク詳細\nテスト内容です。",
      );
    });
  });

  describe("3. logs テーブル変換仕様", () => {
    it("3-1. title が Markdown 本文（value）の先頭見出し・先頭行から正しく抽出されて付与されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const logsTable = migratedData.data.data.find(
        (t) => t.tableName === "logs",
      );
      expect(logsTable?.rows[0].title).toBe("作業ログタイトル");
      expect(logsTable?.rows[1].title).toBe("見出しのないログ本文です。");
    });

    it("3-2. 本文が空または見出しがない場合、既定値 (無題のログ) が title に設定されること", () => {
      const input = createMockLegacySnDbJson();
      const logsTableData = input.data.data.find((t) => t.tableName === "logs")!;
      logsTableData.rows.push({
        id: 103,
        taskId: 10,
        value: "",
      });
      const { migratedData } = convertSnDbToStepNote(input);
      const logsTable = migratedData.data.data.find(
        (t) => t.tableName === "logs",
      );
      const emptyLogRow = logsTable?.rows.find((r) => r.id === 103);
      expect(emptyLogRow?.title).toBe("(無題のログ)");
    });

    it("3-3. id, taskId, value, createdAt, updatedAt が維持されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const logsTable = migratedData.data.data.find(
        (t) => t.tableName === "logs",
      );
      expect(logsTable?.rows[0].id).toBe(101);
      expect(logsTable?.rows[0].taskId).toBe(10);
      expect(logsTable?.rows[0].value).toBe(
        "# 作業ログタイトル\n本日の作業内容を記録しました。",
      );
    });
  });

  describe("4. notes テーブル変換仕様", () => {
    it("4-1. value が空文字または空白のみのレコードが除外（フィルタリング）されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData, summary } = convertSnDbToStepNote(input);
      const notesTable = migratedData.data.data.find(
        (t) => t.tableName === "notes",
      );
      // 入力3件中、2件（id: 202, id: 203）が空レコードのため除外され、1件のみ残る
      expect(notesTable?.rows.length).toBe(1);
      expect(notesTable?.rows[0].id).toBe(201);
      expect(summary.notesFilteredCount).toBe(2);
      expect(summary.notesCount).toBe(1);
    });

    it("4-2. value にテキストが存在するレコードについて、Markdown 先頭行から title が抽出・付与されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const notesTable = migratedData.data.data.find(
        (t) => t.tableName === "notes",
      );
      expect(notesTable?.rows[0].title).toBe("メモ見出し");
    });

    it("4-3. id, taskId, value, createdAt, updatedAt が維持されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const notesTable = migratedData.data.data.find(
        (t) => t.tableName === "notes",
      );
      expect(notesTable?.rows[0].id).toBe(201);
      expect(notesTable?.rows[0].taskId).toBe(10);
      expect(notesTable?.rows[0].value).toBe(
        "## メモ見出し\n重要なメモ内容です。",
      );
    });
  });

  describe("5. labels テーブル変換仕様", () => {
    it("5-1. isSelected が 1 のとき true、0 のとき false に変換されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const labelsTable = migratedData.data.data.find(
        (t) => t.tableName === "labels",
      );
      expect(labelsTable?.rows[0].isSelected).toBe(true);
      expect(labelsTable?.rows[1].isSelected).toBe(false);
    });

    it("5-2. description が空文字 で初期化・補完されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const labelsTable = migratedData.data.data.find(
        (t) => t.tableName === "labels",
      );
      expect(labelsTable?.rows[0].description).toBe("");
      expect(labelsTable?.rows[1].description).toBe("");
    });

    it("5-3. 新スキーマに存在しない fiscalYear, createdAt, updatedAt が除外されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const labelsTable = migratedData.data.data.find(
        (t) => t.tableName === "labels",
      );
      expect(labelsTable?.rows[0]).not.toHaveProperty("fiscalYear");
      expect(labelsTable?.rows[0]).not.toHaveProperty("createdAt");
      expect(labelsTable?.rows[0]).not.toHaveProperty("updatedAt");
    });
  });

  describe("6. quickAccess テーブル変換仕様", () => {
    it("6-1. 旧テーブル名 quickAccesses から新テーブル名 quickAccess に変更されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const quickAccessTable = migratedData.data.data.find(
        (t) => t.tableName === "quickAccess",
      );
      expect(quickAccessTable).toBeDefined();
      expect(
        migratedData.data.data.some((t) => t.tableName === "quickAccesses"),
      ).toBe(false);
    });

    it("6-2. 全フラグプロパティ（8項目）が 0/1 から boolean に変換されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const quickAccessRow = migratedData.data.data.find(
        (t) => t.tableName === "quickAccess",
      )?.rows[0];
      expect(quickAccessRow?.isBookmarkSelected).toBe(true);
      expect(quickAccessRow?.isUncategorizedSelected).toBe(false);
      expect(quickAccessRow?.isOverdueSelected).toBe(false);
      expect(quickAccessRow?.isAsapSelected).toBe(true);
      expect(quickAccessRow?.isUpcomingSelected).toBe(false);
      expect(quickAccessRow?.isDoneSelected).toBe(false);
      expect(quickAccessRow?.isProgressSelected).toBe(true);
      expect(quickAccessRow?.isPendingSelected).toBe(true);
    });
  });

  describe("7. scratches テーブル変換仕様", () => {
    it("7-1. 旧テーブル名 notebooks から新テーブル名 scratches に変更されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const scratchesTable = migratedData.data.data.find(
        (t) => t.tableName === "scratches",
      );
      expect(scratchesTable).toBeDefined();
      expect(
        migratedData.data.data.some((t) => t.tableName === "notebooks"),
      ).toBe(false);
    });

    it("7-2. 旧ノートブックの全レコードが移行され、title が維持（または自動抽出）されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData, summary } = convertSnDbToStepNote(input);
      const scratchesTable = migratedData.data.data.find(
        (t) => t.tableName === "scratches",
      );
      expect(scratchesTable?.rows.length).toBe(2);
      expect(scratchesTable?.rows[0].title).toBe("共通メモ1");
      expect(scratchesTable?.rows[1].title).toBe("タイトル自動抽出テスト");
      expect(summary.scratchesCount).toBe(2);
    });

    it("7-3. 新スキーマに存在しない selected, pin が除外されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const scratchesTable = migratedData.data.data.find(
        (t) => t.tableName === "scratches",
      );
      expect(scratchesTable?.rows[0]).not.toHaveProperty("selected");
      expect(scratchesTable?.rows[0]).not.toHaveProperty("pin");
    });
  });

  describe("8. 新規テーブル（issues, taskTemplates）初期化仕様", () => {
    it("8-1. issues テーブルが空配列（rowCount: 0, rows: []）として定義されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const issuesTableMeta = migratedData.data.tables.find(
        (t) => t.name === "issues",
      );
      const issuesTableData = migratedData.data.data.find(
        (t) => t.tableName === "issues",
      );
      expect(issuesTableMeta?.rowCount).toBe(0);
      expect(issuesTableData?.rows).toEqual([]);
    });

    it("8-2. taskTemplates テーブルが空配列（rowCount: 0, rows: []）として定義されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      const templatesTableMeta = migratedData.data.tables.find(
        (t) => t.name === "taskTemplates",
      );
      const templatesTableData = migratedData.data.data.find(
        (t) => t.tableName === "taskTemplates",
      );
      expect(templatesTableMeta?.rowCount).toBe(0);
      expect(templatesTableData?.rows).toEqual([]);
    });
  });

  describe("9. 移行対象外テーブルの除外仕様", () => {
    it("9-1. 旧 config テーブルが新データから除外されること", () => {
      const input = createMockLegacySnDbJson();
      const { migratedData } = convertSnDbToStepNote(input);
      expect(
        migratedData.data.tables.some((t) => t.name === "config"),
      ).toBe(false);
      expect(
        migratedData.data.data.some((t) => t.tableName === "config"),
      ).toBe(false);
    });
  });

  describe("10. エラーハンドリング仕様", () => {
    it("10-1. 不正な入力（null, undefined, 異なる databaseName）に対して適切なエラーをスローすること", () => {
      expect(() => convertSnDbToStepNote(null)).toThrow(
        "無効なバックアップデータです",
      );
      expect(() => convertSnDbToStepNote({})).toThrow(
        "無効なバックアップデータです",
      );
      expect(() =>
        convertSnDbToStepNote({
          formatName: "dexie",
          data: { databaseName: "UnknownDB" },
        }),
      ).toThrow("旧StepNote（SnDB）のエクスポートデータではありません");
    });
  });

  describe("11. Markdown記法変換仕様（convertCopySyntaxToMarkdownLink）", () => {
    it("11-1. 単一の +{text}+ が [text](text) に変換されること", () => {
      expect(convertCopySyntaxToMarkdownLink("+{sample}+")).toBe("[sample](sample)");
      expect(convertCopySyntaxToMarkdownLink("前後のテキスト +{abc}+ テキスト")).toBe(
        "前後のテキスト [abc](abc) テキスト",
      );
    });

    it("11-2. URLを含む +{https://example.com}+ が [https://example.com](https://example.com) に変換されること", () => {
      expect(convertCopySyntaxToMarkdownLink("+{https://example.com}+")).toBe(
        "[https://example.com](https://example.com)",
      );
    });

    it("11-3. 同一行内に複数の +{...}+ が存在する場合、すべて置換されること", () => {
      expect(convertCopySyntaxToMarkdownLink("+{first}+ と +{second}+")).toBe(
        "[first](first) と [second](second)",
      );
    });

    it("11-4. 複数行のテキストにおいて、各行の +{...}+ が正しく置換されること", () => {
      const input = "1行目: +{item1}+\n2行目: +{item2}+";
      const expected = "1行目: [item1](item1)\n2行目: [item2](item2)";
      expect(convertCopySyntaxToMarkdownLink(input)).toBe(expected);
    });

    it("11-5. 改行を挟む +{...\n...}+ は置換対象外としてそのまま維持されること", () => {
      const input = "+{line1\nline2}+";
      expect(convertCopySyntaxToMarkdownLink(input)).toBe(input);
    });

    it("11-6. 空の +{}+ は置換されずそのまま維持されること", () => {
      expect(convertCopySyntaxToMarkdownLink("+{}+")).toBe("+{}+");
    });

    it("11-7. 空文字または falsy な値が渡された場合、安全にそのまま返却されること", () => {
      expect(convertCopySyntaxToMarkdownLink("")).toBe("");
    });
  });

  describe("12. 各テーブルへのMarkdown記法変換適用仕様（convertSnDbToStepNote）", () => {
    it("12-1. tasks テーブルの description 内の +{text}+ が [text](text) に変換されること", () => {
      const input = createMockLegacySnDbJson();
      const tasksTable = input.data.data.find((t) => t.tableName === "tasks");
      expect(tasksTable).toBeDefined();
      tasksTable!.rows = [
        {
          id: 1,
          name: "タスク1",
          description: "詳細内の記法 +{https://task-link.com}+ です",
          statusCode: 10,
          dueDate: "2026-11-03",
          fiscalYear: "2026",
          selected: 1,
          bookmark: 0,
        },
      ];

      const { migratedData } = convertSnDbToStepNote(input);
      const migratedTasks = migratedData.data.data.find(
        (t) => t.tableName === "tasks",
      );
      expect(migratedTasks?.rows[0]?.description).toBe(
        "詳細内の記法 [https://task-link.com](https://task-link.com) です",
      );
    });

    it("12-2. logs テーブルの value 内の +{text}+ が [text](text) に変換されること", () => {
      const input = createMockLegacySnDbJson();
      const logsTable = input.data.data.find((t) => t.tableName === "logs");
      expect(logsTable).toBeDefined();
      logsTable!.rows = [
        {
          id: 1,
          taskId: 1,
          value: "# ログ見出し\n作業中に +{copy-text}+ をコピー",
          createdAt: "2026-11-03T00:00:00.000Z",
          updatedAt: "2026-11-03T00:00:00.000Z",
        },
      ];

      const { migratedData } = convertSnDbToStepNote(input);
      const migratedLogs = migratedData.data.data.find(
        (t) => t.tableName === "logs",
      );
      expect(migratedLogs?.rows[0]?.value).toBe(
        "# ログ見出し\n作業中に [copy-text](copy-text) をコピー",
      );
    });

    it("12-3. notes テーブルの value 内の +{text}+ が [text](text) に変換されること", () => {
      const input = createMockLegacySnDbJson();
      const notesTable = input.data.data.find((t) => t.tableName === "notes");
      expect(notesTable).toBeDefined();
      notesTable!.rows = [
        {
          id: 1,
          taskId: 1,
          value: "# メモタイトル\n参照先: +{https://note-url.org}+",
          createdAt: "2026-11-03T00:00:00.000Z",
          updatedAt: "2026-11-03T00:00:00.000Z",
        },
      ];

      const { migratedData } = convertSnDbToStepNote(input);
      const migratedNotes = migratedData.data.data.find(
        (t) => t.tableName === "notes",
      );
      expect(migratedNotes?.rows[0]?.value).toBe(
        "# メモタイトル\n参照先: [https://note-url.org](https://note-url.org)",
      );
    });

    it("12-4. scratches テーブルの value 内の +{text}+ が [text](text) に変換されること", () => {
      const input = createMockLegacySnDbJson();
      const notebooksTable = input.data.data.find(
        (t) => t.tableName === "notebooks",
      );
      expect(notebooksTable).toBeDefined();
      notebooksTable!.rows = [
        {
          id: 1,
          title: "スクラッチ1",
          value: "メモ帳で +{snippet}+ を利用",
          createdAt: "2026-11-03T00:00:00.000Z",
          updatedAt: "2026-11-03T00:00:00.000Z",
        },
      ];

      const { migratedData } = convertSnDbToStepNote(input);
      const migratedScratches = migratedData.data.data.find(
        (t) => t.tableName === "scratches",
      );
      expect(migratedScratches?.rows[0]?.value).toBe(
        "メモ帳で [snippet](snippet) を利用",
      );
    });
  });
});
