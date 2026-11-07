import { describe, it, expect } from "vitest";
import {
  calculateTemplateIssueDueDate,
  cloneTaskTemplate,
  reorderTemplateIssues,
  generateTemplateIssuePayloads,
  isTemplateDirty,
} from "./task-template.utils.js";
import type { TaskTemplateRecord, TaskTemplateIssue } from "@/db/models/template.model.js";

/**
 * テスト仕様一覧:
 * 1. calculateTemplateIssueDueDate:
 *    - 基準日（本日）と dayOffset（0日）から、基準日と同日を返すこと
 *    - 基準日（本日）と dayOffset（+1日, +3日等）から、正しく加算された期日を返すこと
 *    - 計算期日がタスク期日を超過する場合、タスク期日の前日を返すこと
 *    - タスク期日の前日が基準日より前になる場合でも、安全に基準日を下限として返すこと
 *    - 時刻情報（時分秒ミリ秒）が正規化されていること
 * 2. cloneTaskTemplate:
 *    - 既存テンプレートの名称に「(コピー)」が付与された新しいテンプレートオブジェクトを生成すること
 *    - id が除外（undefined）されていること
 *    - issues 配列がディープコピーされ、各Issueに新しい一意IDが再割り当てされること
 *    - dayOffset が undefined の場合、そのまま undefined が引き継がれること
 * 3. reorderTemplateIssues:
 *    - 指定インデックスの要素を上（インデックス-1）へ移動し、order 番号を1から連番で再採番すること
 *    - 指定インデックスの要素を下（インデックス+1）へ移動し、order 番号を1から連番で再採番すること
 *    - 境界値（先頭で上移動、末尾で下移動、範囲外）で配列が変更されないこと
 * 4. generateTemplateIssuePayloads:
 *    - テンプレートの各Issueから、taskId、title（1行目抽出）、value（Markdown本文）、statusCode（0: 開始待ち）、dueDate が設定された IssueRecord ペイロード配列を生成すること
 *    - 各Issueの dayOffset に基づいて期日が正しく計算されること
 * 5. isTemplateDirty:
 *    - 新規作成時に入力（名称・概要・Issue）が存在すれば dirty (true) を返すこと
 *    - 既存テンプレートと名称・概要・Issueが同一なら未変更 (false) を返すこと
 *    - 名称、概要、Issueのいずれかが変更されたら dirty (true) を返すこと
 */

describe("task-template.utils", () => {
  describe("calculateTemplateIssueDueDate", () => {
    it("基準日と dayOffset=0 から、基準日と同日の期日を計算すること", () => {
      const baseDate = new Date(2026, 10, 1, 0, 0, 0); // 2026-11-01
      const taskDueDate = new Date(2026, 10, 10, 0, 0, 0); // 2026-11-10
      const result = calculateTemplateIssueDueDate(baseDate, 0, taskDueDate);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(10);
      expect(result.getDate()).toBe(1);
    });

    it("基準日と dayOffset=+2 から、2日後の期日を計算すること", () => {
      const baseDate = new Date(2026, 10, 1, 0, 0, 0); // 2026-11-01
      const taskDueDate = new Date(2026, 10, 10, 0, 0, 0); // 2026-11-10
      const result = calculateTemplateIssueDueDate(baseDate, 2, taskDueDate);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(10);
      expect(result.getDate()).toBe(3);
    });

    it("計算期日がタスク期日を超過する場合、タスク期日の前日を設定すること", () => {
      const baseDate = new Date(2026, 10, 1, 0, 0, 0); // 2026-11-01
      const taskDueDate = new Date(2026, 10, 5, 0, 0, 0); // 2026-11-05
      // dayOffset=10 だと 2026-11-11 となり、タスク期日 11-05 を超過する
      const result = calculateTemplateIssueDueDate(baseDate, 10, taskDueDate);

      // タスク期日 11-05 の前日 = 11-04
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(10);
      expect(result.getDate()).toBe(4);
    });

    it("計算期日がタスク期日と同日の場合、タスク期日の前日に補正すること", () => {
      const baseDate = new Date(2026, 10, 1, 0, 0, 0); // 2026-11-01
      const taskDueDate = new Date(2026, 10, 5, 0, 0, 0); // 2026-11-05
      // dayOffset=4 だと 2026-11-05 となり、タスク期日と同日
      const result = calculateTemplateIssueDueDate(baseDate, 4, taskDueDate);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(10);
      expect(result.getDate()).toBe(4);
    });

    it("タスク期日の前日が基準日より過去になる場合、基準日を下限として設定すること", () => {
      const baseDate = new Date(2026, 10, 5, 0, 0, 0); // 2026-11-05
      const taskDueDate = new Date(2026, 10, 5, 0, 0, 0); // 2026-11-05（タスク期日前日は 11-04 で本日より前）
      const result = calculateTemplateIssueDueDate(baseDate, 1, taskDueDate);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(10);
      expect(result.getDate()).toBe(5);
    });

    it("タスク期日（taskDueDate）が文字列型の場合でも例外をスローせず安全に期日を計算すること", () => {
      const baseDate = new Date(2026, 10, 1, 0, 0, 0); // 2026-11-01
      const taskDueDate = "2026-11-10" as unknown as Date;
      const result = calculateTemplateIssueDueDate(baseDate, 2, taskDueDate);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(10);
      expect(result.getDate()).toBe(3);
    });

    it("基準日（baseDate）が文字列型の場合でも例外をスローせず安全に期日を計算すること", () => {
      const baseDate = "2026-11-01T00:00:00.000Z" as unknown as Date;
      const taskDueDate = "2026-11-10T00:00:00.000Z" as unknown as Date;
      const result = calculateTemplateIssueDueDate(baseDate, 1, taskDueDate);

      expect(result).toBeInstanceOf(Date);
      expect(Number.isNaN(result.getTime())).toBe(false);
    });
  });

  describe("cloneTaskTemplate", () => {
    it("既存テンプレートから (コピー) 付きの複製オブジェクトを生成すること", () => {
      const original: TaskTemplateRecord = {
        id: 1,
        name: "標準開発テンプレート",
        description: "## 開発タスク概要",
        issues: [
          { id: "uuid-1", order: 1, value: "# 要件確認\n詳細内容", dayOffset: 0 },
          { id: "uuid-2", order: 2, value: "# 実装\n詳細内容", dayOffset: 1 },
        ],
      };

      const cloned = cloneTaskTemplate(original);

      expect("id" in cloned).toBe(false);
      expect(cloned.name).toBe("標準開発テンプレート (コピー)");
      expect(cloned.description).toBe("## 開発タスク概要");
      expect(cloned.issues).toHaveLength(2);
      expect(cloned.issues[0].value).toBe("# 要件確認\n詳細内容");
      expect(cloned.issues[0].dayOffset).toBe(0);
      expect(cloned.issues[0].id).not.toBe("uuid-1"); // 新しい一意ID
      expect(cloned.issues[1].id).not.toBe("uuid-2");
      expect(cloned.issues[1].dayOffset).toBe(1);
    });

    it("複製元のIssueの dayOffset が undefined の場合、undefined（期日スイッチOFF）のまま複製されること", () => {
      const original: TaskTemplateRecord = {
        id: 2,
        name: "期日なしテンプレート",
        description: "",
        issues: [
          { id: "uuid-1", order: 1, value: "タスク1", dayOffset: undefined },
        ],
      };

      const cloned = cloneTaskTemplate(original);
      expect(cloned.issues[0].dayOffset).toBeUndefined();
    });
  });

  describe("reorderTemplateIssues", () => {
    const sampleIssues: TaskTemplateIssue[] = [
      { id: "1", order: 1, value: "Issue 1", dayOffset: 0 },
      { id: "2", order: 2, value: "Issue 2", dayOffset: 1 },
      { id: "3", order: 3, value: "Issue 3", dayOffset: 2 },
    ];

    it("指定インデックスのIssueを1つ上へ移動し、orderを再採番すること", () => {
      const result = reorderTemplateIssues(sampleIssues, 1, 0);

      expect(result[0].id).toBe("2");
      expect(result[0].order).toBe(1);
      expect(result[1].id).toBe("1");
      expect(result[1].order).toBe(2);
      expect(result[2].id).toBe("3");
      expect(result[2].order).toBe(3);
    });

    it("指定インデックスのIssueを1つ下へ移動し、orderを再採番すること", () => {
      const result = reorderTemplateIssues(sampleIssues, 1, 2);

      expect(result[0].id).toBe("1");
      expect(result[0].order).toBe(1);
      expect(result[1].id).toBe("3");
      expect(result[1].order).toBe(2);
      expect(result[2].id).toBe("2");
      expect(result[2].order).toBe(3);
    });

    it("範囲外のインデックス指定時は配列を変更しないこと", () => {
      const result = reorderTemplateIssues(sampleIssues, -1, 0);
      expect(result).toEqual(sampleIssues);
    });
  });

  describe("generateTemplateIssuePayloads", () => {
    it("テンプレートから IssueRecord ペイロードを正しく生成すること", () => {
      const template: TaskTemplateRecord = {
        name: "テスト",
        description: "概要",
        issues: [
          { id: "1", order: 1, value: "# 初日タスク\n本文詳細", dayOffset: 0 },
          { id: "2", order: 2, value: "2日目タスク（見出しなし）", dayOffset: 1 },
        ],
      };

      const baseDate = new Date(2026, 10, 1, 0, 0, 0); // 2026-11-01
      const taskDueDate = new Date(2026, 10, 10, 0, 0, 0); // 2026-11-10
      const payloads = generateTemplateIssuePayloads(template, baseDate, taskDueDate, 42);

      expect(payloads).toHaveLength(2);
      expect(payloads[0]).toEqual({
        taskId: 42,
        statusCode: 0,
        title: "初日タスク",
        value: "# 初日タスク\n本文詳細",
        dueDate: new Date(2026, 10, 1, 0, 0, 0),
      });
      expect(payloads[1]).toEqual({
        taskId: 42,
        statusCode: 0,
        title: "2日目タスク（見出しなし）",
        value: "2日目タスク（見出しなし）",
        dueDate: new Date(2026, 10, 2, 0, 0, 0),
      });
    });

    it("dayOffset が undefined（未設定）のIssueは dueDate が undefined（空）として生成されること", () => {
      const template: TaskTemplateRecord = {
        name: "期日任意テンプレート",
        description: "",
        issues: [
          { id: "1", order: 1, value: "期日あり", dayOffset: 2 },
          { id: "2", order: 2, value: "期日未設定", dayOffset: undefined },
        ],
      };

      const baseDate = new Date(2026, 10, 1, 0, 0, 0);
      const taskDueDate = new Date(2026, 10, 10, 0, 0, 0);
      const payloads = generateTemplateIssuePayloads(template, baseDate, taskDueDate, 100);

      expect(payloads).toHaveLength(2);
      expect(payloads[0].dueDate).toEqual(new Date(2026, 10, 3, 0, 0, 0));
      expect(payloads[1].dueDate).toBeUndefined();
    });
  });

  describe("isTemplateDirty", () => {
    const original: TaskTemplateRecord = {
      id: 1,
      name: "定例テンプレート",
      description: "概要テキスト",
      issues: [
        { id: "1", order: 1, value: "# 準備", dayOffset: 0 },
        { id: "2", order: 2, value: "# 実施", dayOffset: 1 },
      ],
    };

    it("既存テンプレートと内容が同一の場合は false を返すこと", () => {
      const current = {
        name: "定例テンプレート",
        description: "概要テキスト",
        issues: [
          { id: "1", order: 1, value: "# 準備", dayOffset: 0 },
          { id: "2", order: 2, value: "# 実施", dayOffset: 1 },
        ],
      };
      expect(isTemplateDirty(current, original)).toBe(false);
    });

    it("名称が変更された場合は true を返すこと", () => {
      const current = {
        name: "変更された名称",
        description: "概要テキスト",
        issues: [...original.issues],
      };
      expect(isTemplateDirty(current, original)).toBe(true);
    });

    it("概要が変更された場合は true を返すこと", () => {
      const current = {
        name: original.name,
        description: "新しい概要",
        issues: [...original.issues],
      };
      expect(isTemplateDirty(current, original)).toBe(true);
    });

    it("Issueの内容や期日オフセットが変更された場合は true を返すこと", () => {
      const current = {
        name: original.name,
        description: original.description,
        issues: [
          { id: "1", order: 1, value: "# 準備（修正）", dayOffset: 0 },
          { id: "2", order: 2, value: "# 実施", dayOffset: 1 },
        ],
      };
      expect(isTemplateDirty(current, original)).toBe(true);

      const offsetChanged = {
        name: original.name,
        description: original.description,
        issues: [
          { id: "1", order: 1, value: "# 準備", dayOffset: undefined },
          { id: "2", order: 2, value: "# 実施", dayOffset: 1 },
        ],
      };
      expect(isTemplateDirty(offsetChanged, original)).toBe(true);
    });

    it("新規作成時に未入力なら false、入力があれば true を返すこと", () => {
      expect(isTemplateDirty({ name: "", description: "", issues: [] }, undefined)).toBe(false);
      expect(isTemplateDirty({ name: "新規", description: "", issues: [] }, undefined)).toBe(true);
    });
  });
});

