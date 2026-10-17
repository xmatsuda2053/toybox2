import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flattenTemplate } from "@shared/utils";
import type { NoteRecord } from "@/db/models/journal.model";
import type { NotesController } from "@/controllers/notes.controller";
import type { TaskController } from "@/controllers/task.controller";
import { NotesView } from "./notes-view";

/**
 * 【NotesView 仕様 (Notes コンポーネント)】
 *
 * 1. 初期描画と空状態 (Initial Render & Empty State)
 *    - 1-1. notesController.state が空配列の場合、空状態メッセージ（.notes-view__empty）が表示されること
 *    - 1-2. ヘッダーに共通部品 search-input（.notes-view__search、size="s"）および新規追加ボタン（.notes-view__btn-add）が表示されること
 *    - 1-3. ノートが存在する場合、初期状態で先頭ノートがアクティブ（activeNoteId）として選択されること
 *
 * 2. ページタブ表示と切り替え (Page Tabs & Switch)
 *    - 2-1. ノートが存在する場合、wa-tab-group（.notes-view__tab-group）および wa-tab が描画されること
 *    - 2-2. 各 wa-tab に抽出されたノートタイトル（1行目見出し記号除去済み）が表示されること
 *    - 2-3. wa-tab-show イベントまたは handleSelectNote でアクティブなNoteID（activeNoteId）が切り替わること
 *    - 2-4. wa-tab-group の active 属性にアクティブなNoteIDがバインドされていること
 *    - 2-5. 各 wa-tab 内にノートID要素（.notes-view__tab-id）が描画され、#201 などのIDが表示されること
 *    - 2-6. アクティブなノートのタブID要素に修飾クラス（.notes-view__tab-id--active）が付与され、非アクティブなノートには付与されないこと
 *
 * 3. 検索フィルタリング (Search Filtering)
 *    - 3-1. search-input 入力（handleSearchInput）によりタブ一覧がリアルタイムに絞り込まれること
 *    - 3-2. 絞り込みによって現在アクティブなノートが除外された場合、絞り込み結果の先頭ノートへ自動でアクティブが切り替わること
 *    - 3-3. 絞り込み結果が0件の場合、検索ヒット0件メッセージ（.notes-view__no-results）が表示されること
 *
 * 4. Markdownエディタ（markdown-editor-preview）の連携
 *    - 4-1. アクティブなノートの本文が markdown-editor-preview に渡されて描画されること
 *    - 4-2. markdown-editor-preview に .darkTheme='soft' が設定されていること
 *    - 4-3. theme プロパティ（light / dark）に応じて .themeMode が設定されること
 *    - 4-4. markdown-editor-preview に showDeleteButton が設定されていること
 *    - 4-5. 内容変更（handleContentChange）は 300ms デバウンスされ、入力中は updateNote が呼ばれず、300ms 経過後に1度だけ呼び出されること
 *    - 4-6. handleContentChange が連続で呼び出された場合、前回のタイマーがキャンセルされ、最後の入力から 300ms 後に1度だけ呼び出されること
 *    - 4-7. disconnectedCallback 実行時に保留中のデバウンスタイマーがクリアされること
 *    - 4-8. 新規作成されたノートはエディタモード（.mode='edit'）で表示され、handleModeChange によりモードが更新されること
 *    - 4-9. ノートタブ切り替え時（handleSelectNote / handleTabShow）に、切り替え先ノートがプレビューモード（preview）で表示されること
 *    - 4-10. 親タスクが切り替わった場合（willUpdate で taskId 変更時）、全ノートのエディタモードがプレビューモードへリセット（noteModeMap が初期化）されること
 *    - 4-11. resetModesToPreview() の呼び出しにより、全ノートのエディタモードがプレビューモードへリセットされること
 *    - 4-12. 新規ノート作成後（handleCreateNote）に wa-tab-show イベントが発火してもエディタモード（edit）がプレビューモードで上書きされず維持されること
 *    - 4-13. handleTabShow 呼び出し時に event.stopPropagation() が呼び出され、親コンテナへのイベント伝播が防止されること
 *
 * 5. 新規ページ作成 (Create Page)
 *    - 5-1. 新規追加ボタンクリック（handleCreateNote）で notesController.createNote が初期値 "## Note" で呼び出され、作成された新しいNoteが自動的にアクティブになること
 *
 * 6. ページ削除 (Delete Page)
 *    - 6-1. エディタメニューからの削除リクエスト（handleRequestDelete）で削除確認ダイアログ（wa-dialog）が開くこと
 *    - 6-2. 削除ダイアログのキャンセルボタンクリック（handleCloseDeleteDialog）でダイアログが閉じること
 *    - 6-3. 削除ダイアログの確定ボタンクリック（handleConfirmDelete）で notesController.deleteNote が呼び出され、削除されたノートがアクティブから除外され、残りの先頭ノートへ切り替わること
 *    - 6-4. 最後の1件を削除した後は空状態（.notes-view__empty）に戻ること
 *
 * 7. BEM設計およびSCSSスタイルの検証
 *    - 7-1. SCSSスタイルシート（notes-view.scss）が存在し、ルートブロック .notes-view および主要BEMセレクタが定義されていること
 *    - 7-2. notes-view.scss に !important および @extend が一切含まれていないこと
 *    - 7-3. notes-view.scss 全体においてハードコードされたカラーコード（Hex/RGB/RGBA）が 0 件であること
 *    - 7-4. テーマ切替トランジション等のCSS変数指定（--stepnote-transition-theme または @include theme-transition）が定義されていること
 */
describe("NotesView Component", () => {
  let element: NotesView;
  let mockNotesController: {
    taskId?: number;
    setTaskId?: ReturnType<typeof vi.fn>;
    state: NoteRecord[];
    createNote: ReturnType<typeof vi.fn>;
    updateNote: ReturnType<typeof vi.fn>;
    deleteNote: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };
  let mockTaskController: {
    state: { id: number; name: string };
    subscribe: ReturnType<typeof vi.fn>;
  };

  const sampleNotes: NoteRecord[] = [
    {
      id: 201,
      taskId: 1,
      value: "## 仕様メモ\n画面レイアウトおよびデータフローの整理。",
      createdAt: new Date("2026-10-17T10:00:00Z"),
      updatedAt: new Date("2026-10-17T10:30:00Z"),
    },
    {
      id: 202,
      taskId: 1,
      value: "## 会議メモ\n定例ミーティングの議事録。",
      createdAt: new Date("2026-10-17T11:00:00Z"),
      updatedAt: new Date("2026-10-17T11:15:00Z"),
    },
  ];

  beforeEach(() => {
    mockNotesController = {
      taskId: 1,
      setTaskId: vi.fn(),
      state: [...sampleNotes],
      createNote: vi.fn().mockResolvedValue(203),
      updateNote: vi.fn().mockResolvedValue(undefined),
      deleteNote: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(() => {}),
    };

    mockTaskController = {
      state: { id: 1, name: "サンプルタスク" },
      subscribe: vi.fn().mockReturnValue(() => {}),
    };

    element = new NotesView();
    element.notesController = mockNotesController as unknown as NotesController;
    element.taskController = mockTaskController as unknown as TaskController;
  });

  describe("1. 初期描画と空状態 (Initial Render & Empty State)", () => {
    it("1-1. notesController.state が空配列の場合、空状態メッセージ（.notes-view__empty）が表示されること", () => {
      mockNotesController.state = [];
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain("notes-view__empty");
      expect(htmlStr).toContain("メモがありません");
    });

    it("1-2. ヘッダーに共通部品 search-input（.notes-view__search、size=\"s\"）および新規追加ボタン（.notes-view__btn-add）が表示されること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain("notes-view__header");
      expect(htmlStr).toContain("search-input");
      expect(htmlStr).toContain("notes-view__search");
      expect(htmlStr).toContain('size="s"');
      expect(htmlStr).toContain("notes-view__btn-add");
      expect(htmlStr).toContain("plus-solid-full");
    });

    it("1-3. ノートが存在する場合、初期状態で先頭ノートがアクティブ（activeNoteId）として選択されること", () => {
      expect(element.effectiveActiveNoteId).toBe(201);
    });
  });

  describe("2. ページタブ表示と切り替え (Page Tabs & Switch)", () => {
    it("2-1. ノートが存在する場合、wa-tab-group（.notes-view__tab-group）および wa-tab が描画されること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain("wa-tab-group");
      expect(htmlStr).toContain("notes-view__tab-group");
      expect(htmlStr).toContain("<wa-tab");
    });

    it("2-2. 各 wa-tab に抽出されたノートタイトル（1行目見出し記号除去済み）が表示されること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain("仕様メモ");
      expect(htmlStr).toContain("会議メモ");
    });

    it("2-3. wa-tab-show イベントまたは handleSelectNote でアクティブなNoteID（activeNoteId）が切り替わること", () => {
      element.handleSelectNote(202);
      expect(element.activeNoteId).toBe(202);
      expect(element.effectiveActiveNoteId).toBe(202);

      element.handleTabShow(
        new CustomEvent("wa-tab-show", {
          detail: { name: "201" },
        }) as unknown as CustomEvent<{ name: string }>,
      );
      expect(element.activeNoteId).toBe(201);
    });

    it("2-4. wa-tab-group の active 属性にアクティブなNoteIDがバインドされていること", () => {
      element.activeNoteId = 201;
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toMatch(/<wa-tab-group[^>]*\bactive=["']?201["']?/);
    });

    it("2-5. 各 wa-tab 内にノートID要素（.notes-view__tab-id）が描画され、#201 などのIDが表示されること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain("notes-view__tab-id");
      expect(htmlStr).toContain("#201");
      expect(htmlStr).toContain("#202");
    });

    it("2-6. アクティブなノートのタブID要素に修飾クラス（.notes-view__tab-id--active）が付与され、非アクティブなノートには付与されないこと", () => {
      element.activeNoteId = 201;
      const htmlStr = flattenTemplate(element.render());

      expect(htmlStr).toMatch(
        /class=["'][^"']*notes-view__tab-id--active[^"']*["'][^>]*>#201<\/span>/,
      );
      expect(htmlStr).not.toMatch(
        /class=["'][^"']*notes-view__tab-id--active[^"']*["'][^>]*>#202<\/span>/,
      );
    });
  });

  describe("3. 検索フィルタリング (Search Filtering)", () => {
    it("3-1. search-input 入力（handleSearchInput）によりタブ一覧がリアルタイムに絞り込まれること", () => {
      element.handleSearchInput("会議");
      expect(element.filteredNotes).toHaveLength(1);
      expect(element.filteredNotes[0].id).toBe(202);
    });

    it("3-2. 絞り込みによって現在アクティブなノートが除外された場合、絞り込み結果の先頭ノートへ自動でアクティブが切り替わること", () => {
      element.activeNoteId = 201;
      element.handleSearchInput("会議");
      expect(element.effectiveActiveNoteId).toBe(202);
    });

    it("3-3. 絞り込み結果が0件の場合、検索ヒット0件メッセージ（.notes-view__no-results）が表示されること", () => {
      element.handleSearchInput("該当なしxyz");
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain("notes-view__no-results");
      expect(htmlStr).toContain("一致するメモが見つかりません");
    });
  });

  describe("4. Markdownエディタ（markdown-editor-preview）の連携", () => {
    it("4-1. アクティブなノートの本文が markdown-editor-preview に渡されて描画されること", () => {
      element.activeNoteId = 201;
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toContain("markdown-editor-preview");
      expect(htmlStr).toContain("画面レイアウトおよびデータフローの整理。");
    });

    it("4-2. markdown-editor-preview に .darkTheme='soft' が設定されていること", () => {
      element.theme = "dark";
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toMatch(/<markdown-editor-preview[^>]*\.darkTheme=["']?soft["']?/);
    });

    it("4-3. theme プロパティ（light / dark）に応じて .themeMode が設定されること", () => {
      element.theme = "dark";
      let template = element.render();
      let htmlStr = flattenTemplate(template);
      expect(htmlStr).toMatch(/<markdown-editor-preview[^>]*\.themeMode=["']?dark["']?/);

      element.theme = "light";
      template = element.render();
      htmlStr = flattenTemplate(template);
      expect(htmlStr).toMatch(/<markdown-editor-preview[^>]*\.themeMode=["']?light["']?/);
    });

    it("4-4. markdown-editor-preview に .showDeleteButton=${true} が設定されていること", () => {
      const template = element.render();
      const htmlStr = flattenTemplate(template);

      expect(htmlStr).toMatch(/<markdown-editor-preview[^>]*\.showDeleteButton=["']?true["']?/);
    });

    it("4-5. 内容変更（handleContentChange）は 300ms デバウンスされ、入力中は updateNote が呼ばれず、300ms 経過後に1度だけ呼び出されること", () => {
      vi.useFakeTimers();
      element.handleContentChange(201, "更新されたメモ内容");

      expect(mockNotesController.updateNote).not.toHaveBeenCalled();

      vi.advanceTimersByTime(299);
      expect(mockNotesController.updateNote).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(mockNotesController.updateNote).toHaveBeenCalledTimes(1);
      expect(mockNotesController.updateNote).toHaveBeenCalledWith(201, {
        value: "更新されたメモ内容",
      });
      vi.useRealTimers();
    });

    it("4-6. handleContentChange が連続で呼び出された場合、前回のタイマーがキャンセルされ、最後の入力から 300ms 後に1度だけ呼び出されること", () => {
      vi.useFakeTimers();
      element.handleContentChange(201, "文字入力1");
      vi.advanceTimersByTime(150);

      element.handleContentChange(201, "文字入力2");
      vi.advanceTimersByTime(200);
      expect(mockNotesController.updateNote).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockNotesController.updateNote).toHaveBeenCalledTimes(1);
      expect(mockNotesController.updateNote).toHaveBeenCalledWith(201, {
        value: "文字入力2",
      });
      vi.useRealTimers();
    });

    it("4-7. disconnectedCallback 実行時に保留中のデバウンスタイマーがクリアされること", () => {
      vi.useFakeTimers();
      element.handleContentChange(201, "保留中の入力");
      element.disconnectedCallback();

      vi.advanceTimersByTime(500);
      expect(mockNotesController.updateNote).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("4-8. 新規作成されたノートはエディタモード（.mode='edit'）で表示され、handleModeChange によりモードが更新されること", async () => {
      mockNotesController.createNote.mockImplementation(async (note: { value: string }) => {
        const id = 203;
        mockNotesController.state.push({ id, taskId: 1, value: note.value });
        return id;
      });

      await element.handleCreateNote();
      expect(element.activeNoteId).toBe(203);
      expect(element.currentEditorMode).toBe("edit");

      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toMatch(/<markdown-editor-preview[^>]*\.mode=["']?edit["']?/);

      element.handleModeChange("preview");
      expect(element.currentEditorMode).toBe("preview");
    });

    it("4-9. ノートタブ切り替え時（handleSelectNote / handleTabShow）に、切り替え先ノートがプレビューモード（preview）で表示されること", () => {
      // 201 番ノートを edit にする
      element.handleSelectNote(201);
      element.handleModeChange("edit");
      expect(element.currentEditorMode).toBe("edit");

      // 202 番ノートを選択
      element.handleSelectNote(202);
      expect(element.currentEditorMode).toBe("preview");

      // 再度 201 番ノートに戻った場合もプレビューモードで初期化されること
      element.handleSelectNote(201);
      expect(element.currentEditorMode).toBe("preview");
    });

    it("4-10. 親タスクが切り替わった場合（willUpdate で taskId 変更時）、全ノートのエディタモードがプレビューモードへリセットされること", () => {
      element.handleSelectNote(201);
      element.handleModeChange("edit");
      expect(element.noteModeMap.get(201)).toBe("edit");

      // 親タスク切り替え
      mockTaskController.state = {
        ...mockTaskController.state!,
        id: 999,
      };
      element.willUpdate(new Map([["taskController", undefined]]));

      expect(element.noteModeMap.size).toBe(0);
      expect(element.currentEditorMode).toBe("preview");
    });

    it("4-11. resetModesToPreview() の呼び出しにより、全ノートのエディタモードがプレビューモードへリセットされること", () => {
      element.noteModeMap.set(201, "edit");
      element.noteModeMap.set(202, "edit");

      element.resetModesToPreview();

      expect(element.noteModeMap.size).toBe(0);
      expect(element.currentEditorMode).toBe("preview");
    });

    it("4-12. 新規ノート作成後（handleCreateNote）に wa-tab-show イベントが発火してもエディタモード（edit）がプレビューモードで上書きされず維持されること", async () => {
      mockNotesController.createNote.mockImplementation(async (note: { value: string }) => {
        const id = 203;
        mockNotesController.state.push({ id, taskId: 1, value: note.value });
        return id;
      });

      await element.handleCreateNote();
      expect(element.activeNoteId).toBe(203);
      expect(element.currentEditorMode).toBe("edit");

      // wa-tab-group からの wa-tab-show イベント発火をシミュレート
      element.handleTabShow(
        new CustomEvent("wa-tab-show", { detail: { name: "203" } }),
      );

      // 上書きされず edit モードのままであること
      expect(element.currentEditorMode).toBe("edit");
    });

    it("4-13. handleTabShow 呼び出し時に event.stopPropagation() が呼び出され、親コンテナへのイベント伝播が防止されること", () => {
      const event = new CustomEvent("wa-tab-show", { detail: { name: "201" } });
      const stopPropagationSpy = vi.spyOn(event, "stopPropagation");

      element.handleTabShow(event);

      expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("5. 新規ページ作成 (Create Page)", () => {
    it("5-1. 新規追加ボタンクリック（handleCreateNote）で notesController.createNote が初期値 '## Note' で呼び出され、作成された新しいNoteが自動的にアクティブになること", async () => {
      await element.handleCreateNote();

      expect(mockNotesController.createNote).toHaveBeenCalledTimes(1);
      expect(mockNotesController.createNote).toHaveBeenCalledWith({
        value: "## Note\n\n",
      });
      expect(element.activeNoteId).toBe(203);
    });
  });

  describe("6. ページ削除 (Delete Page)", () => {
    it("6-1. エディタメニューからの削除リクエスト（handleRequestDelete）で削除確認ダイアログ（wa-dialog）が開くこと", () => {
      expect(element.isDeleteDialogOpen).toBe(false);

      element.handleRequestDelete(201);
      expect(element.isDeleteDialogOpen).toBe(true);
      expect(element.deletingNoteId).toBe(201);

      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain("notes-view__delete-dialog");
      expect(htmlStr).toContain("このページを削除しますか？");
    });

    it("6-2. 削除ダイアログのキャンセルボタンクリック（handleCloseDeleteDialog）でダイアログが閉じること", () => {
      element.handleRequestDelete(201);
      expect(element.isDeleteDialogOpen).toBe(true);

      element.handleCloseDeleteDialog();
      expect(element.isDeleteDialogOpen).toBe(false);
      expect(element.deletingNoteId).toBeUndefined();
    });

    it("6-3. 削除ダイアログの確定ボタンクリック（handleConfirmDelete）で notesController.deleteNote が呼び出され、削除されたノートがアクティブから除外されること", async () => {
      element.handleRequestDelete(201);
      element.activeNoteId = 201;

      await element.handleConfirmDelete();

      expect(mockNotesController.deleteNote).toHaveBeenCalledTimes(1);
      expect(mockNotesController.deleteNote).toHaveBeenCalledWith(201);
      expect(element.isDeleteDialogOpen).toBe(false);
      expect(element.activeNoteId).not.toBe(201);
    });

    it("6-4. 最後の1件を削除した後は空状態（.notes-view__empty）に戻ること", async () => {
      mockNotesController.state = [
        {
          id: 201,
          taskId: 1,
          value: "単一ノート",
        },
      ];
      element.handleRequestDelete(201);
      element.activeNoteId = 201;

      mockNotesController.deleteNote.mockImplementation(async () => {
        mockNotesController.state = [];
      });

      await element.handleConfirmDelete();
      expect(element.activeNoteId).toBeUndefined();

      const template = element.render();
      const htmlStr = flattenTemplate(template);
      expect(htmlStr).toContain("notes-view__empty");
    });
  });

  describe("7. BEM設計およびSCSSスタイルの検証", () => {
    const scssPath = path.resolve(__dirname, "./notes-view.scss");

    it("7-1. SCSSスタイルシート（notes-view.scss）が存在し、ルートブロック .notes-view および主要BEMセレクタが定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");

      expect(content).toContain(".notes-view");
      expect(content).toContain(".notes-view__header");
      expect(content).toContain(".notes-view__search");
      expect(content).toContain(".notes-view__tab-group");
      expect(content).toContain(".notes-view__editor");
      expect(content).toContain(".notes-view__empty");
    });

    it("7-2. notes-view.scss に !important および @extend が一切含まれていないこと", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");

      expect(content).not.toContain("!important");
      expect(content).not.toContain("@extend");
    });

    it("7-3. notes-view.scss 全体においてハードコードされたカラーコード（Hex/RGB/RGBA）が 0 件であること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");

      const hexPattern = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
      const rgbPattern = /\brgba?\s*\([^)]*\)/g;

      expect(content.match(hexPattern)).toBeNull();
      expect(content.match(rgbPattern)).toBeNull();
    });

    it("7-4. テーマ切替トランジション等のCSS変数指定（--stepnote-transition-theme または @include theme-transition）が定義されていること", () => {
      expect(fs.existsSync(scssPath)).toBe(true);
      const content = fs.readFileSync(scssPath, "utf-8");

      const hasThemeTransition =
        content.includes("theme-transition") ||
        content.includes("var(--stepnote-transition-theme)");
      expect(hasThemeTransition).toBe(true);
    });
  });
});
