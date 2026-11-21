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
  MarkdownEditorCommand,
} from "@shared/components";
import type { TaskStatusCode } from "@/types";
import {
  SubscriberElement,
  WithIssuesController,
  WithTaskController,
  WithTaskTemplateController,
} from "@/utils/controller-consumers.mixin.js";
import {
  filterIssuesByKeyword,
  extractIssueTitle,
  parseBulkIssuesInput,
} from "@/utils/task-filter.utils.js";
import {
  KeyedDebounceManager,
  ExclusiveAccordionController,
  DeleteDialogState,
  resetModesToPreview,
  extractSearchQuery,
} from "@/utils/view-state.utils.js";
import {
  renderIssueDeleteDialog,
  renderIssueAddDialog,
  renderIssueTemplateDialog,
  parseSelectedTemplateId,
  applySelectedIssueTemplate,
} from "./issues-view.dialogs.js";
import {
  renderIssuesHeader,
  renderIssuesList,
} from "./issues-view.templates.js";
import styles from "./issues-view.scss?inline";

function isDirectTargetEvent(e?: Event): boolean {
  return !e || e.target === e.currentTarget;
}

/**
 * 課題管理（Issues）コンポーネント (IssuesView)
 *
 * 親タスクに紐づく Issue の一覧表示・インライン詳細展開・一括作成・完了分離・自動保存を提供する。
 * パネルに依存しないポータブルなコンポーネントとして動作する。
 *
 * @export
 * @class IssuesView
 * @extends {WithIssuesController(WithTaskController(WithTaskTemplateController(SubscriberElement)))}
 */
@customElement("issues-view")
export class IssuesView extends WithIssuesController(
  WithTaskController(WithTaskTemplateController(SubscriberElement)),
) {
  public static override styles = unsafeCSS(styles);

  private static readonly ISSUE_COMMANDS: readonly MarkdownEditorCommand[] = [
    { label: "ジャンプ用タグをコピー", eventName: "copy-jump-tag" },
  ];

  @property({ type: String, attribute: "data-theme", reflect: true })
  public theme: string = "light";

  @state()
  public searchKeyword: string = "";

  @state()
  public expandedIssueIds: Set<number> = new Set();

  @state()
  public collapsingIssueId: number | null = null;

  @state()
  public isDeleteDialogOpen: boolean = false;

  @state()
  public deletingIssueId?: number;

  @state()
  public isAddDialogOpen: boolean = false;

  @state()
  public addText: string = "";

  @state()
  public isTemplateDialogOpen: boolean = false;

  @state()
  public selectedTemplateId: number | null = null;

  @state()
  public issueModeMap: Map<number, MarkdownDisplayMode> = new Map();

  private readonly accordion = new ExclusiveAccordionController();
  private readonly deleteDialog = new DeleteDialogState();
  private readonly debounceManager = new KeyedDebounceManager();
  private lastTaskId?: number;

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    this.syncParentTaskState();
  }

  private syncParentTaskState(): void {
    const parentTaskId = this.taskController?.state?.id;
    this.syncControllerTaskId(parentTaskId);

    if (this.lastTaskId === parentTaskId) {
      return;
    }

    this.lastTaskId = parentTaskId;
    this.accordion.reset();
    this.expandedIssueIds = new Set();
    this.collapsingIssueId = null;
    this.issueModeMap.clear();
  }

  private syncControllerTaskId(parentTaskId?: number): void {
    if (
      this.issuesController &&
      parentTaskId !== undefined &&
      this.issuesController.taskId !== parentTaskId
    ) {
      this.issuesController.setTaskId(parentTaskId);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.debounceManager.clear();
    this.accordion.reset();
  }

  /** 全 Issue のエディタモードをプレビューモードへリセットする */
  public resetModesToPreview(): void {
    resetModesToPreview(this.issueModeMap);
    this.requestUpdate();
  }

  /** 検索入力ハンドラー */
  public handleSearchInput = (
    eventOrQuery: CustomEvent<SearchInputEventDetail> | string,
  ): void => {
    this.searchKeyword = extractSearchQuery(eventOrQuery);
  };

  /** インライン詳細の開閉トグルハンドラー */
  public handleToggleExpand = (issueId: number): void => {
    this.accordion.expandedIds = new Set(this.expandedIssueIds);
    this.accordion.collapsingId = this.collapsingIssueId;

    this.accordion.toggle(
      issueId,
      (id) => this.issueModeMap.set(id, "preview"),
      (id) => this.handleDetailAnimationEnd(id),
    );

    this.expandedIssueIds = this.accordion.expandedIds;
    this.collapsingIssueId = this.accordion.collapsingId;
  };

  /** 指定した Issue を展開状態にする */
  public expandIssue = (issueId: number): void => {
    if (!this.expandedIssueIds.has(issueId)) {
      this.handleToggleExpand(issueId);
    }
  };

  /** ジャンプ用タグのクリップボードコピーハンドラー */
  public handleCopyJumpTag = async (issueId: number): Promise<void> => {
    const issue = this.issuesController?.state?.find((i) => i.id === issueId);
    if (!issue) return;

    const copyText = `#[${issueId}]{${issue.title}}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(copyText);
    }
  };

  /** エディタ表示モード変更ハンドラー */
  public handleModeChange = (
    issueId: number,
    mode: MarkdownDisplayMode,
  ): void => {
    this.issueModeMap.set(issueId, mode);
    this.requestUpdate();
  };

  /** 詳細パネルのアニメーション終了ハンドラー */
  public handleDetailAnimationEnd = (issueId: number): void => {
    if (this.accordion.handleAnimationEnd(issueId)) {
      this.collapsingIssueId = null;
      this.requestUpdate();
    }
  };

  /** Issue追加ダイアログを開く */
  public handleOpenAddDialog = (): void => {
    this.addText = "";
    this.isAddDialogOpen = true;
  };

  /** Issue追加ダイアログを閉じる */
  public handleCloseAddDialog = (e?: Event): void => {
    if (!isDirectTargetEvent(e)) return;
    this.isAddDialogOpen = false;
    this.addText = "";
  };

  /** Issue追加確定ハンドラー（単一・複数行一括対応） */
  public handleConfirmAdd = async (): Promise<void> => {
    const titles = parseBulkIssuesInput(this.addText);
    if (titles.length > 0 && this.issuesController) {
      await this.issuesController.createMultipleIssues(titles);
    }
    this.handleCloseAddDialog();
  };

  /** テンプレート適用ダイアログを開く */
  public handleOpenTemplateDialog = (): void => {
    this.isTemplateDialogOpen = true;
    this.selectedTemplateId = null;
  };

  /** テンプレート適用ダイアログを閉じる（子要素からのバブリングを無視） */
  public handleCloseTemplateDialog = (e?: Event): void => {
    if (!isDirectTargetEvent(e)) return;
    this.isTemplateDialogOpen = false;
    this.selectedTemplateId = null;
  };

  /** テンプレート選択変更ハンドラー */
  public handleSelectTemplate = (e: Event): void => {
    this.selectedTemplateId = parseSelectedTemplateId(e);
  };

  /** テンプレート適用確定ハンドラー */
  public handleConfirmApplyTemplate = async (): Promise<void> => {
    if (this.selectedTemplateId === null || !this.issuesController) {
      return;
    }
    const template = this.taskTemplateController?.state.find(
      (t) => t.id === this.selectedTemplateId,
    );
    if (!template) {
      return;
    }

    try {
      await applySelectedIssueTemplate({
        template,
        parentTaskId: this.taskController?.state?.id,
        taskDueDate: this.taskController?.state?.dueDate,
        issuesController: this.issuesController,
      });
    } catch (error) {
      console.error("Failed to apply issue template:", error);
    } finally {
      this.handleCloseTemplateDialog();
    }
  };

  /** 行内でのステータス変更ハンドラー */
  public handleStatusChange = async (
    issueId: number,
    statusCode: TaskStatusCode,
    event?: Event,
  ): Promise<void> => {
    event?.stopPropagation();
    if (this.issuesController) {
      await this.issuesController.updateIssue(issueId, { statusCode });
    }
  };

  /** 行内でのステータストグル（0 ⇄ 9）ハンドラー */
  public handleToggleStatus = async (
    issueId: number,
    currentStatusCode: TaskStatusCode,
    event?: Event,
  ): Promise<void> => {
    event?.stopPropagation();
    const nextStatusCode: TaskStatusCode = currentStatusCode === 9 ? 0 : 9;
    if (this.issuesController) {
      await this.issuesController.updateIssue(issueId, {
        statusCode: nextStatusCode,
      });
    }
  };

  /** 行内での期日変更ハンドラー */
  public handleDueDateChange = async (
    issueId: number,
    dueDate: Date | null,
    event?: Event,
  ): Promise<void> => {
    event?.stopPropagation();
    if (this.issuesController) {
      await this.issuesController.updateIssue(issueId, {
        dueDate: dueDate ?? undefined,
      });
    }
  };

  /** Markdown 内容変更ハンドラー（300ms デバウンス自動保存、1行目をタイトルに同期） */
  public handleContentChange = (issueId: number, value: string): void => {
    this.debounceManager.debounce(
      issueId,
      async () => {
        if (this.issuesController) {
          const title = extractIssueTitle(value);
          await this.issuesController.updateIssue(issueId, { title, value });
        }
      },
      300,
    );
  };

  /** 削除リクエストハンドラー（ダイアログを開く） */
  public handleRequestDelete = (issueId: number): void => {
    this.deleteDialog.open(issueId);
    this.isDeleteDialogOpen = this.deleteDialog.isOpen;
    this.deletingIssueId = this.deleteDialog.deletingId;
  };

  /** 削除確認ダイアログを閉じる（子要素からのバブリングを無視） */
  public handleCloseDeleteDialog = (e?: Event): void => {
    if (!isDirectTargetEvent(e)) return;
    this.deleteDialog.close();
    this.isDeleteDialogOpen = false;
    this.deletingIssueId = undefined;
  };

  /** 削除確定ハンドラー */
  public handleConfirmDelete = async (): Promise<void> => {
    if (this.deletingIssueId !== undefined && this.issuesController) {
      await this.issuesController.deleteIssue(this.deletingIssueId);
      this.issueModeMap.delete(this.deletingIssueId);
      const nextSet = new Set(this.expandedIssueIds);
      nextSet.delete(this.deletingIssueId);
      this.expandedIssueIds = nextSet;
      this.accordion.expandedIds = nextSet;
    }
    this.handleCloseDeleteDialog();
  };

  private renderDialogs(): HTMLTemplateResult {
    return html`
      ${renderIssueDeleteDialog({
        open: this.isDeleteDialogOpen,
        onClose: this.handleCloseDeleteDialog,
        onConfirm: this.handleConfirmDelete,
      })}
      ${renderIssueAddDialog({
        open: this.isAddDialogOpen,
        addText: this.addText,
        onTextChange: (value) => {
          this.addText = value;
        },
        onClose: this.handleCloseAddDialog,
        onConfirm: this.handleConfirmAdd,
      })}
      ${renderIssueTemplateDialog({
        open: this.isTemplateDialogOpen,
        templates: this.taskTemplateController?.state ?? [],
        selectedTemplateId: this.selectedTemplateId,
        onClose: this.handleCloseTemplateDialog,
        onSelectTemplate: this.handleSelectTemplate,
        onConfirm: this.handleConfirmApplyTemplate,
      })}
    `;
  }

  override render(): HTMLTemplateResult {
    const allIssues = this.issuesController?.state ?? [];
    const filteredIssues = filterIssuesByKeyword(allIssues, this.searchKeyword);

    return html`
      <div class="issues-view">
        ${renderIssuesHeader({
          searchKeyword: this.searchKeyword,
          onSearchInput: this.handleSearchInput,
          onOpenTemplateDialog: this.handleOpenTemplateDialog,
          onOpenAddDialog: this.handleOpenAddDialog,
        })}
        ${renderIssuesList({
          filteredIssues,
          expandedIssueIds: this.expandedIssueIds,
          collapsingIssueId: this.collapsingIssueId,
          issueModeMap: this.issueModeMap,
          theme: this.theme,
          commands: IssuesView.ISSUE_COMMANDS,
          onToggleExpand: this.handleToggleExpand,
          onToggleStatus: this.handleToggleStatus,
          onDueDateChange: this.handleDueDateChange,
          onDetailAnimationEnd: this.handleDetailAnimationEnd,
          onCopyJumpTag: this.handleCopyJumpTag,
          onModeChange: this.handleModeChange,
          onContentChange: this.handleContentChange,
          onRequestDelete: this.handleRequestDelete,
        })}
        ${this.renderDialogs()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "issues-view": IssuesView;
  }
}
