import { describe, it, expect, vi } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { TaskTemplateRecord } from "@/db/models/template.model.js";
import {
  renderIssueDeleteDialog,
  renderIssueAddDialog,
  renderIssueTemplateDialog,
  parseSelectedTemplateId,
  applySelectedIssueTemplate,
} from "./issues-view.dialogs.js";

/**
 * 【issues-view.dialogs 仕様】
 *
 * 1. ダイアログ描画テンプレート
 *    - 1-1. renderIssueDeleteDialog が削除確認ダイアログとボタンを描画すること
 *    - 1-2. renderIssueAddDialog が一括登録案内文と入力エリアを描画すること
 *    - 1-3. renderIssueTemplateDialog が空状態・選択プレビュー・未選択時の disabled を正しく描画すること
 *
 * 2. テンプレート適用ロジック
 *    - 2-1. parseSelectedTemplateId が currentTarget/target/空値から安全に数値 ID または null を返すこと
 *    - 2-2. applySelectedIssueTemplate が taskId 補正と applyTemplate を実行すること
 */
const mockTemplates: TaskTemplateRecord[] = [
  {
    id: 1,
    name: "基本テンプレート",
    description: "",
    issues: [
      { id: "issue-1", order: 1, value: "要件確認" },
      { id: "issue-2", order: 2, value: "単体テスト" },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("issues-view.dialogs", () => {
  it("1-1. renderIssueDeleteDialog が削除確認ダイアログと操作ボタンを描画すること", () => {
    const htmlStr = flattenTemplate(
      renderIssueDeleteDialog({
        open: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      }),
    );

    expect(htmlStr).toContain("issues-view__delete-dialog");
    expect(htmlStr).toContain("Issueの削除確認");
    expect(htmlStr).toContain("削除");
  });

  it("1-2. renderIssueAddDialog が案内文と wa-textarea を描画すること", () => {
    const htmlStr = flattenTemplate(
      renderIssueAddDialog({
        open: true,
        addText: "Issue A",
        onTextChange: vi.fn(),
        onClose: vi.fn(),
        onConfirm: vi.fn(),
      }),
    );

    expect(htmlStr).toContain("issues-view__add-dialog");
    expect(htmlStr).toContain("1行につき1件のIssueを作成します。");
    expect(htmlStr).toContain("wa-textarea");
  });

  it("1-3. renderIssueTemplateDialog が未登録・プレビュー・disabled 制御を描画すること", () => {
    const emptyHtml = flattenTemplate(
      renderIssueTemplateDialog({
        open: true,
        templates: [],
        selectedTemplateId: null,
        onClose: vi.fn(),
        onSelectTemplate: vi.fn(),
        onConfirm: vi.fn(),
      }),
    );
    expect(emptyHtml).toContain("issues-view__template-empty-message");

    const unselectedHtml = flattenTemplate(
      renderIssueTemplateDialog({
        open: true,
        templates: mockTemplates,
        selectedTemplateId: null,
        onClose: vi.fn(),
        onSelectTemplate: vi.fn(),
        onConfirm: vi.fn(),
      }),
    );
    expect(unselectedHtml).toMatch(/id="issues-view-btn-confirm-apply"[^>]*disabled/);

    const selectedHtml = flattenTemplate(
      renderIssueTemplateDialog({
        open: true,
        templates: mockTemplates,
        selectedTemplateId: 1,
        onClose: vi.fn(),
        onSelectTemplate: vi.fn(),
        onConfirm: vi.fn(),
      }),
    );
    expect(selectedHtml).toContain("issues-view__template-preview");
    expect(selectedHtml).toContain("要件確認");
    expect(selectedHtml).toContain("単体テスト");
  });

  it("2-1. parseSelectedTemplateId がイベントから安全に ID または null を返すこと", () => {
    const fromCurrentTarget = {
      currentTarget: { value: "5" },
      target: { value: undefined },
    } as unknown as Event;
    expect(parseSelectedTemplateId(fromCurrentTarget)).toBe(5);

    const fromTarget = {
      currentTarget: null,
      target: { value: "8" },
    } as unknown as Event;
    expect(parseSelectedTemplateId(fromTarget)).toBe(8);

    const empty = { currentTarget: { value: "" } } as unknown as Event;
    expect(parseSelectedTemplateId(empty)).toBeNull();
  });

  it("2-2. applySelectedIssueTemplate が taskId 不一致を補正して applyTemplate を実行すること", async () => {
    const setTaskId = vi.fn().mockResolvedValue(undefined);
    const applyTemplate = vi.fn().mockResolvedValue(undefined);

    await applySelectedIssueTemplate({
      template: mockTemplates[0],
      parentTaskId: 10,
      taskDueDate: undefined,
      issuesController: {
        taskId: undefined,
        setTaskId,
        applyTemplate,
      },
    });

    expect(setTaskId).toHaveBeenCalledWith(10);
    expect(applyTemplate).toHaveBeenCalledWith(mockTemplates[0], undefined);
  });
});
