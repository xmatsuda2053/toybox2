import { describe, it, expect, vi } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { IssueRecord } from "@/db/models/task.model.js";
import {
  getIssueDueDisplay,
  renderIssuesHeader,
  renderIssuesList,
} from "./issues-view.templates.js";

/**
 * 【issues-view.templates 仕様】
 *
 * 1. 期日アイコン表示計算
 *    - 1-1. getIssueDueDisplay が完了済み（statusCode=9）の場合に警告装飾を抑止すること
 *    - 1-2. getIssueDueDisplay が期限超過の場合に --overdue 修飾クラスを返すこと
 *
 * 2. 一覧・ヘッダーテンプレート描画
 *    - 2-1. renderIssuesHeader が検索欄・テンプレートボタン・追加ボタン（trigger="hover"）を描画すること
 *    - 2-2. renderIssuesList が空配列時に空状態を描画し、Issue 存在時に未完了/完了セクションを描画すること
 */
const baseIssue: IssueRecord = {
  id: 1,
  taskId: 10,
  title: "テスト課題",
  value: "# テスト課題",
  statusCode: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("issues-view.templates", () => {
  it("1-1. getIssueDueDisplay が完了済み Issue の警告装飾を抑止すること", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const display = getIssueDueDisplay({
      ...baseIssue,
      statusCode: 9,
      dueDate: yesterday,
    });

    expect(display.icon).toBe("calendar-solid-full");
    expect(display.modifierClass).toBe("");
  });

  it("1-2. getIssueDueDisplay が期限超過の場合に overdue 修飾クラスを返すこと", () => {
    const pastDate = new Date("2020-01-01T00:00:00Z");
    const display = getIssueDueDisplay({
      ...baseIssue,
      statusCode: 0,
      dueDate: pastDate,
    });

    expect(display.icon).toBe("fire-solid-full");
    expect(display.modifierClass).toBe("issues-view__item-due--overdue");
  });

  it("2-1. renderIssuesHeader が検索欄および hover トリガー付きボタンを描画すること", () => {
    const htmlStr = flattenTemplate(
      renderIssuesHeader({
        searchKeyword: "abc",
        onSearchInput: vi.fn(),
        onOpenTemplateDialog: vi.fn(),
        onOpenAddDialog: vi.fn(),
      }),
    );

    expect(htmlStr).toContain("issues-view__search-input");
    expect(htmlStr).toContain("issues-view-btn-template");
    expect(htmlStr).toContain("issues-view-btn-add");
    expect(htmlStr).toContain('trigger="hover"');
  });

  it("2-2. renderIssuesList が空状態および未完了/完了セクションを正しく描画すること", () => {
    const emptyHtml = flattenTemplate(
      renderIssuesList({
        filteredIssues: [],
        expandedIssueIds: new Set(),
        collapsingIssueId: null,
        issueModeMap: new Map(),
        theme: "light",
        commands: [],
        onToggleExpand: vi.fn(),
        onToggleStatus: vi.fn(),
        onDueDateChange: vi.fn(),
        onDetailAnimationEnd: vi.fn(),
        onCopyJumpTag: vi.fn(),
        onModeChange: vi.fn(),
        onContentChange: vi.fn(),
        onRequestDelete: vi.fn(),
      }),
    );
    expect(emptyHtml).toContain("issues-view__empty");

    const openIssue: IssueRecord = { ...baseIssue, id: 1, title: "未完了課題" };
    const doneIssue: IssueRecord = {
      ...baseIssue,
      id: 2,
      statusCode: 9,
      title: "完了課題",
    };

    const populatedHtml = flattenTemplate(
      renderIssuesList({
        filteredIssues: [openIssue, doneIssue],
        expandedIssueIds: new Set([1]),
        collapsingIssueId: null,
        issueModeMap: new Map(),
        theme: "dark",
        commands: [],
        onToggleExpand: vi.fn(),
        onToggleStatus: vi.fn(),
        onDueDateChange: vi.fn(),
        onDetailAnimationEnd: vi.fn(),
        onCopyJumpTag: vi.fn(),
        onModeChange: vi.fn(),
        onContentChange: vi.fn(),
        onRequestDelete: vi.fn(),
      }),
    );

    expect(populatedHtml).toContain("未完了 (1)");
    expect(populatedHtml).toContain("完了 (1)");
    expect(populatedHtml).toContain("issues-view__divider");
    expect(populatedHtml).toContain("issues-view__detail-editor");
  });
});
