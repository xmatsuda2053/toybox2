import {
  html,
  unsafeCSS,
  type HTMLTemplateResult,
  type PropertyValues,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@shared/components";
import type {
  SearchInputEventDetail,
  MarkdownDisplayMode,
} from "@shared/components";
import type { NoteItemRecord, NotesManagerController } from "@/types/view/ui.types.js";
import {
  SubscriberElement,
  WithNotesController,
  WithTaskController,
} from "@/utils/controller-consumers.mixin.js";
import {
  extractNoteTitle,
  filterNotes,
  sortNotesByCreatedAtAsc,
} from "./notes-view.utils.js";
import styles from "./notes-view.scss?inline";

/**
 * ノート（Notes）コンポーネント (NotesView)
 *
 * タスクに紐づく複数ページのメモ・備忘録を水平タブ（wa-tab-group）で管理し、
 * 統合 Markdown エディタによる編集・自動保存・削除・検索機能を提供する。
 *
 * @export
 * @class NotesView
 * @extends {WithNotesController(WithTaskController(SubscriberElement))}
 */
@customElement("notes-view")
export class NotesView extends WithNotesController(
  WithTaskController(SubscriberElement),
) {
  public static override styles = unsafeCSS(styles);

  @property({ type: String, attribute: "data-theme", reflect: true })
  public theme: string = "light";

  private _controller?: NotesManagerController;

  /** 外部から注入されるノート管理コントローラー（未指定時は Context の notesController を使用） */
  @property({ attribute: false })
  public get controller(): NotesManagerController | undefined {
    return this._controller;
  }

  public set controller(value: NotesManagerController | undefined) {
    this._controller = this.subscriber.bind<NotesManagerController>(
      "injectedNotesController",
      this._controller,
      value,
    );
  }

  /** タブにノートID（#番号）を表示するかどうか */
  @property({ type: Boolean })
  public showTabId: boolean = true;

  @state()
  public searchQuery: string = "";

  @state()
  public activeNoteId?: number;

  @state()
  public isDeleteDialogOpen: boolean = false;

  @state()
  public deletingNoteId?: number;

  @state()
  public noteModeMap: Map<number, MarkdownDisplayMode> = new Map();

  private debounceTimerMap: Map<number, ReturnType<typeof setTimeout>> =
    new Map();

  /** 現在アクティブなコントローラーを取得する */
  public get activeController(): NotesManagerController | undefined {
    return this.controller ?? this.notesController;
  }

  /** ソート済み全ノート一覧を取得する */
  public get effectiveNotes(): NoteItemRecord[] {
    const raw = this.activeController?.state ?? [];
    return sortNotesByCreatedAtAsc(raw);
  }

  /** 検索クエリで絞り込まれたノート一覧を取得する */
  public get filteredNotes(): NoteItemRecord[] {
    return filterNotes(this.effectiveNotes, this.searchQuery);
  }

  /** 現在有効なアクティブNoteIDを取得する */
  public get effectiveActiveNoteId(): number | undefined {
    const filtered = this.filteredNotes;
    if (filtered.length === 0) {
      return undefined;
    }

    if (
      this.activeNoteId !== undefined &&
      filtered.some((n) => n.id === this.activeNoteId)
    ) {
      return this.activeNoteId;
    }

    return filtered[0]?.id;
  }

  /** 現在アクティブなノートオブジェクトを取得する */
  public get activeNote(): NoteItemRecord | undefined {
    const activeId = this.effectiveActiveNoteId;
    if (activeId === undefined) return undefined;
    return this.filteredNotes.find((n) => n.id === activeId);
  }

  /** 現在アクティブなノートの表示モードを取得する（新規追加直後は 'edit'） */
  public get currentEditorMode(): MarkdownDisplayMode {
    const targetId = this.effectiveActiveNoteId ?? this.activeNoteId;
    if (targetId !== undefined && this.noteModeMap.has(targetId)) {
      return this.noteModeMap.get(targetId)!;
    }
    return "preview";
  }

  private lastTaskId?: number;

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (!this.controller) {
      const parentTaskId = this.taskController?.state?.id;
      if (this.lastTaskId !== parentTaskId) {
        this.lastTaskId = parentTaskId;
        this.noteModeMap.clear();
        this.activeNoteId = undefined;
      }
      if (
        this.notesController &&
        parentTaskId !== undefined &&
        this.notesController.taskId !== parentTaskId
      ) {
        this.notesController.setTaskId(parentTaskId);
      }
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const timer of this.debounceTimerMap.values()) {
      clearTimeout(timer);
    }
    this.debounceTimerMap.clear();
  }

  /** 全ノートのエディタモードをプレビューモードへリセットする */
  public resetModesToPreview(): void {
    this.noteModeMap.clear();
    this.requestUpdate();
  }

  /** 検索入力ハンドラー */
  public handleSearchInput = (
    eventOrQuery: CustomEvent<SearchInputEventDetail> | string,
  ): void => {
    const query =
      typeof eventOrQuery === "string"
        ? eventOrQuery
        : (eventOrQuery.detail?.keyword ?? "");
    this.searchQuery = query;
  };

  /** タブ選択ハンドラー（別ノートへの切り替え時のみプレビューモードで初期化） */
  public handleSelectNote = (noteId: number): void => {
    if (this.activeNoteId !== noteId) {
      this.activeNoteId = noteId;
      this.noteModeMap.set(noteId, "preview");
    }
  };

  /** wa-tab 切り替えハンドラー */
  public handleTabShow = (e: CustomEvent<{ name: string }>): void => {
    e.stopPropagation();
    const tabName = e.detail?.name;
    if (tabName) {
      const id = Number(tabName);
      if (!isNaN(id)) {
        this.handleSelectNote(id);
      }
    }
  };

  /** エディタ表示モード変更ハンドラー */
  public handleModeChange = (mode: MarkdownDisplayMode): void => {
    const activeId = this.effectiveActiveNoteId;
    if (activeId !== undefined) {
      this.noteModeMap.set(activeId, mode);
      this.requestUpdate();
    }
  };

  /** 新規ノート作成ハンドラー（初期値 "## Note\n\n"、エディタモード初期化） */
  public handleCreateNote = async (): Promise<void> => {
    const ctrl = this.activeController;
    if (!ctrl) return;

    const newId = await ctrl.createNote({
      value: "## Note\n\n",
    });

    if (newId !== undefined) {
      this.activeNoteId = newId;
      this.noteModeMap.set(newId, "edit");
    }
  };

  /** Markdown 内容変更ハンドラー（300ms デバウンス自動保存） */
  public handleContentChange = (
    noteId: number,
    value: string,
  ): void => {
    const existingTimer = this.debounceTimerMap.get(noteId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const saveAction = async (): Promise<void> => {
      const ctrl = this.activeController;
      if (ctrl) {
        await ctrl.updateNote(noteId, { value });
      }
      this.debounceTimerMap.delete(noteId);
    };

    this.debounceTimerMap.set(noteId, setTimeout(saveAction, 300));
  };

  /** 削除リクエストハンドラー（ダイアログを開く） */
  public handleRequestDelete = (noteId: number): void => {
    this.deletingNoteId = noteId;
    this.isDeleteDialogOpen = true;
  };

  /** 削除確認ダイアログを閉じる */
  public handleCloseDeleteDialog = (): void => {
    this.isDeleteDialogOpen = false;
    this.deletingNoteId = undefined;
  };

  /** 削除確定ハンドラー */
  public handleConfirmDelete = async (): Promise<void> => {
    const ctrl = this.activeController;
    if (this.deletingNoteId !== undefined && ctrl) {
      const deletedId = this.deletingNoteId;
      await ctrl.deleteNote(deletedId);

      this.noteModeMap.delete(deletedId);
      if (this.activeNoteId === deletedId) {
        const remaining = this.effectiveNotes.filter((n) => n.id !== deletedId);
        this.activeNoteId = remaining[0]?.id;
      }
    }
    this.handleCloseDeleteDialog();
  };

  /** ヘッダーツールバーの描画 */
  private renderHeader(): HTMLTemplateResult {
    return html`
      <div class="notes-view__header">
        <search-input
          class="notes-view__search"
          size="s"
          placeholder="メモを検索..."
          .value=${this.searchQuery}
          @search-input=${this.handleSearchInput}
        ></search-input>

        <div class="notes-view__actions">
          <wa-tooltip
            for="notes-view-btn-add"
            placement="bottom"
            trigger="hover"
          >
            新規ページを追加
          </wa-tooltip>
          <wa-button
            id="notes-view-btn-add"
            class="notes-view__btn-add"
            variant="neutral"
            appearance="plain"
            size="s"
            aria-label="新規ページを追加"
            @click=${this.handleCreateNote}
          >
            <wa-icon
              library="my-icons"
              name="plus-solid-full"
              label="新規ページを追加"
            ></wa-icon>
          </wa-button>
        </div>
      </div>
    `;
  }

  /** ページタブバー（wa-tab-group）の描画 */
  private renderTabs(notes: NoteItemRecord[]): HTMLTemplateResult {
    const activeId = this.effectiveActiveNoteId;

    return html`
      <wa-tab-group
        class="notes-view__tab-group"
        active=${String(activeId ?? "")}
        @wa-tab-show=${this.handleTabShow}
      >
        ${notes.map((note, index) => {
          const title = extractNoteTitle(note.value, index + 1);
          const isActive = note.id === activeId;
          const idClass = isActive
            ? "notes-view__tab-id notes-view__tab-id--active"
            : "notes-view__tab-id";
          return html`
            <wa-tab slot="nav" panel=${String(note.id)}>
              ${this.showTabId && note.id !== undefined
                ? html`<span class="${idClass}">#${note.id}</span>`
                : ""}
              <span class="notes-view__tab-title">${title}</span>
            </wa-tab>
          `;
        })}
      </wa-tab-group>
    `;
  }

  /** Markdown エディタ領域の描画 */
  private renderEditor(activeNote: NoteItemRecord): HTMLTemplateResult {
    const themeMode = this.theme === "dark" ? "dark" : "light";

    return html`
      <div class="notes-view__editor">
        <markdown-editor-preview
          .value=${activeNote.value}
          .mode=${this.currentEditorMode}
          .themeMode=${themeMode}
          .darkTheme=${"soft"}
          .showDeleteButton=${true}
          ?show-delete-button=${true}
          @mode-change=${(e: CustomEvent<{ mode: MarkdownDisplayMode }>) =>
            this.handleModeChange(e.detail.mode)}
          @markdown-change=${(e: CustomEvent<{ value: string }>) =>
            activeNote.id !== undefined &&
            this.handleContentChange(activeNote.id, e.detail.value)}
          @markdown-delete=${() =>
            activeNote.id !== undefined &&
            this.handleRequestDelete(activeNote.id)}
          @markdown-request-delete=${() =>
            activeNote.id !== undefined &&
            this.handleRequestDelete(activeNote.id)}
        ></markdown-editor-preview>
      </div>
    `;
  }

  /** 削除確認ダイアログの描画 */
  private renderDeleteDialog(): HTMLTemplateResult {
    return html`
      <wa-dialog
        class="notes-view__delete-dialog"
        label="ページの削除"
        ?open=${this.isDeleteDialogOpen}
        @wa-after-hide=${this.handleCloseDeleteDialog}
      >
        <p>このページを削除しますか？この操作は取り消せません。</p>
        <wa-button
          slot="footer"
          variant="neutral"
          appearance="plain"
          size="s"
          @click=${this.handleCloseDeleteDialog}
        >
          キャンセル
        </wa-button>
        <wa-button
          slot="footer"
          variant="danger"
          size="s"
          @click=${this.handleConfirmDelete}
        >
          削除
        </wa-button>
      </wa-dialog>
    `;
  }

  /** メインレンダリング */
  public override render(): HTMLTemplateResult {
    const totalNotes = this.effectiveNotes;
    const filtered = this.filteredNotes;
    const activeNote = this.activeNote;

    return html`
      <div class="notes-view">
        ${this.renderHeader()}
        ${totalNotes.length === 0
          ? html`<div class="notes-view__empty">メモがありません。「+」ボタンから新規ページを追加してください。</div>`
          : filtered.length === 0
            ? html`<div class="notes-view__no-results">一致するメモが見つかりません。</div>`
            : html`
                ${this.renderTabs(filtered)}
                ${activeNote ? this.renderEditor(activeNote) : html``}
              `}
        ${this.renderDeleteDialog()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "notes-view": NotesView;
  }
}
