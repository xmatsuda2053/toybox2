import {
  html,
  unsafeCSS,
  type HTMLTemplateResult,
  type PropertyValues,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  SearchInputEventDetail,
  MarkdownDisplayMode,
} from "@shared/components";
import type { LogRecord } from "@/db/models/journal.model";
import {
  SubscriberElement,
  WithLogsController,
  WithTaskController,
} from "@/utils/controller-consumers.mixin.js";
import {
  extractLogTitle,
  filterLogs,
  formatLogDate,
  sortLogsByCreatedAtDesc,
} from "./logs-view.utils.js";
import styles from "./logs-view.scss?inline";

/**
 * 作業ログ（Logs）コンポーネント (LogsView)
 *
 * タスクに紐づく作業ログを Git Graph 風のタイムライン一覧で表示し、
 * インラインアコーディオン展開による Markdown 編集・自動保存を提供する。
 * パネルに依存しないポータブルなコンポーネントとして動作する。
 *
 * @export
 * @class LogsView
 * @extends {WithLogsController(WithTaskController(SubscriberElement))}
 */
@customElement("logs-view")
export class LogsView extends WithLogsController(
  WithTaskController(SubscriberElement),
) {
  public static override styles = unsafeCSS(styles);

  @property({ type: String, attribute: "data-theme", reflect: true })
  public theme: string = "light";

  @state()
  public searchQuery: string = "";

  @state()
  public expandedLogIds: Set<number> = new Set();

  @state()
  public collapsingLogId: number | null = null;

  @state()
  public isDeleteDialogOpen: boolean = false;

  @state()
  public deletingLogId?: number;

  @state()
  public logModeMap: Map<number, MarkdownDisplayMode> = new Map();

  private debounceTimerMap: Map<number, ReturnType<typeof setTimeout>> =
    new Map();

  private collapseTimer: ReturnType<typeof setTimeout> | null = null;

  private lastTaskId?: number;

  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    const parentTaskId = this.taskController?.state?.id;
    if (this.lastTaskId !== parentTaskId) {
      this.lastTaskId = parentTaskId;
      this.expandedLogIds = new Set();
      this.collapsingLogId = null;
      this.logModeMap.clear();
      if (this.collapseTimer) {
        clearTimeout(this.collapseTimer);
        this.collapseTimer = null;
      }
    }
    if (
      this.logsController &&
      parentTaskId !== undefined &&
      this.logsController.taskId !== parentTaskId
    ) {
      this.logsController.setTaskId(parentTaskId);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const timer of this.debounceTimerMap.values()) {
      clearTimeout(timer);
    }
    this.debounceTimerMap.clear();

    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
      this.collapseTimer = null;
    }
  }

  /** 全ログのエディタモードをプレビューモードへリセットする */
  public resetModesToPreview(): void {
    for (const key of this.logModeMap.keys()) {
      this.logModeMap.set(key, "preview");
    }
    this.requestUpdate();
  }

  /** 検索入力ハンドラー（search-input カスタムイベントまたは文字列） */
  public handleSearchInput = (
    eventOrQuery: CustomEvent<SearchInputEventDetail> | string,
  ): void => {
    const query =
      typeof eventOrQuery === "string"
        ? eventOrQuery
        : (eventOrQuery.detail?.keyword ?? "");
    this.searchQuery = query;
  };

  /** インライン詳細の開閉トグルハンドラー（排他展開および折りたたみアニメーション遷移、プレビューモード初期化） */
  public handleToggleExpand = (logId: number): void => {
    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
      this.collapseTimer = null;
    }

    const nextSet = new Set(this.expandedLogIds);
    const currentlyExpanded = Array.from(nextSet)[0];

    if (currentlyExpanded === logId) {
      nextSet.clear();
      this.collapsingLogId = logId;
      this.collapseTimer = setTimeout(() => {
        this.handleDetailAnimationEnd(logId);
      }, 320);
    } else {
      if (currentlyExpanded !== undefined) {
        this.collapsingLogId = currentlyExpanded;
        this.collapseTimer = setTimeout(() => {
          this.handleDetailAnimationEnd(currentlyExpanded);
        }, 320);
      } else if (this.collapsingLogId === logId) {
        this.collapsingLogId = null;
      }
      nextSet.clear();
      nextSet.add(logId);
      this.logModeMap.set(logId, "preview");
    }

    this.expandedLogIds = nextSet;
  };

  /** エディタ表示モード変更ハンドラー */
  public handleModeChange = (
    logId: number,
    mode: MarkdownDisplayMode,
  ): void => {
    this.logModeMap.set(logId, mode);
    this.requestUpdate();
  };

  /** 詳細パネルのアニメーション終了ハンドラー（アンマウントクリーンアップ） */
  public handleDetailAnimationEnd = (logId: number): void => {
    if (this.collapsingLogId === logId) {
      if (this.collapseTimer) {
        clearTimeout(this.collapseTimer);
        this.collapseTimer = null;
      }
      this.collapsingLogId = null;
      this.requestUpdate();
    }
  };

  /** 新規ログ作成ハンドラー（初期作成して自動展開、エディタモード初期化） */
  public handleCreateLog = async (): Promise<void> => {
    if (!this.logsController) return;

    const now = new Date();
    const newId = await this.logsController.createLog({
      value: "### 新規ログ\n\n記録内容をここに入力してください。",
      createdAt: now,
      updatedAt: now,
    });

    if (newId !== undefined) {
      this.handleToggleExpand(newId);
      this.logModeMap.set(newId, "edit");
    }
  };

  /** Markdown 内容変更ハンドラー（300ms デバウンス自動保存） */
  public handleContentChange = (
    logId: number,
    value: string,
  ): void => {
    const existingTimer = this.debounceTimerMap.get(logId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const saveAction = async (): Promise<void> => {
      if (this.logsController) {
        await this.logsController.updateLog(logId, { value });
      }
      this.debounceTimerMap.delete(logId);
    };

    this.debounceTimerMap.set(logId, setTimeout(saveAction, 300));
  };

  /** ログ削除リクエストハンドラー（ダイアログを開く） */
  public handleRequestDelete = (logId: number): void => {
    this.deletingLogId = logId;
    this.isDeleteDialogOpen = true;
  };

  /** 削除確認ダイアログを閉じる */
  public handleCloseDeleteDialog = (): void => {
    this.isDeleteDialogOpen = false;
    this.deletingLogId = undefined;
  };

  /** 削除確定ハンドラー */
  public handleConfirmDelete = async (): Promise<void> => {
    if (this.deletingLogId !== undefined && this.logsController) {
      await this.logsController.deleteLog(this.deletingLogId);
      this.logModeMap.delete(this.deletingLogId);
      const nextSet = new Set(this.expandedLogIds);
      nextSet.delete(this.deletingLogId);
      this.expandedLogIds = nextSet;
    }
    this.handleCloseDeleteDialog();
  };

  /** ヘッダーツールバーの描画 */
  private renderHeader(): HTMLTemplateResult {
    return html`
      <div class="logs-view__header">
        <search-input
          class="logs-view__search"
          size="s"
          placeholder="ログを検索..."
          .value=${this.searchQuery}
          @search-input=${this.handleSearchInput}
        ></search-input>

        <div class="logs-view__actions">
          <wa-tooltip
            for="logs-view-btn-add"
            placement="bottom"
            trigger="hover"
          >
            新規ログを追加
          </wa-tooltip>
          <wa-button
            id="logs-view-btn-add"
            class="logs-view__btn-add"
            variant="neutral"
            appearance="plain"
            size="s"
            aria-label="新規ログを追加"
            @click=${this.handleCreateLog}
          >
            <wa-icon
              library="my-icons"
              name="plus-solid-full"
              label="新規ログを追加"
            ></wa-icon>
          </wa-button>
        </div>
      </div>
    `;
  }

  /** 一覧テーブルヘッダーの描画 */
  private renderListHeader(): HTMLTemplateResult {
    return html`
      <div class="logs-view__list-header">
        <div
          class="logs-view__list-header-cell logs-view__list-header-cell--graph"
        >
          Graph
        </div>
        <div
          class="logs-view__list-header-cell logs-view__list-header-cell--description"
        >
          Description
        </div>
        <div
          class="logs-view__list-header-cell logs-view__list-header-cell--date"
        >
          Date
        </div>
      </div>
    `;
  }

  /** タイムライングラフセルの描画 */
  private renderGraphCell(
    index: number,
    total: number,
  ): HTMLTemplateResult {
    const hasTop = index > 0;
    const hasBottom = index < total - 1;

    return html`
      <div class="logs-view__cell logs-view__cell--graph">
        <div class="logs-view__graph-container">
          ${hasTop
            ? html`<div class="logs-view__graph-line-top"></div>`
            : ""}
          <div class="logs-view__graph-node"></div>
          ${hasBottom
            ? html`<div class="logs-view__graph-line-bottom"></div>`
            : ""}
        </div>
      </div>
    `;
  }

  /** インライン詳細エディタの描画 */
  private renderInlineDetail(
    log: LogRecord,
    hasBottom: boolean = false,
    isCollapsing: boolean = false,
  ): HTMLTemplateResult {
    const themeMode = this.theme === "dark" ? "dark" : "light";
    const containerClass = isCollapsing
      ? "logs-view__detail-container logs-view__detail-container--collapsing"
      : "logs-view__detail-container";
    const currentMode =
      (log.id !== undefined && this.logModeMap.get(log.id)) || "preview";

    return html`
      <div
        class=${containerClass}
        @animationend=${() =>
          log.id !== undefined && this.handleDetailAnimationEnd(log.id)}
      >
        <div class="logs-view__detail">
          <div class="logs-view__detail-graph">
            ${hasBottom
              ? html`<div class="logs-view__graph-line-through"></div>`
              : ""}
          </div>
          <div class="logs-view__detail-editor">
            <markdown-editor-preview
              .value=${log.value}
              .mode=${currentMode}
              .themeMode=${themeMode}
              .darkTheme=${"soft"}
              deleteAction="enabled"
              @mode-change=${(e: CustomEvent<{ mode: MarkdownDisplayMode }>) =>
                log.id !== undefined &&
                this.handleModeChange(log.id, e.detail.mode)}
              @markdown-change=${(e: CustomEvent<{ value: string }>) =>
                log.id !== undefined &&
                this.handleContentChange(log.id, e.detail.value)}
              @markdown-request-delete=${() =>
                log.id !== undefined && this.handleRequestDelete(log.id)}
            ></markdown-editor-preview>
          </div>
        </div>
      </div>
    `;
  }

  /** 日時セルの描画（1行日時およびホバー時ツールチップ） */
  private renderDateCell(logId: number, createdAt?: Date): HTMLTemplateResult {
    const dateStr = formatLogDate(createdAt);

    return html`
      <div
        class="logs-view__cell logs-view__cell--date"
        id="logs-view-date-${logId}"
      >
        ${dateStr}
      </div>
      ${createdAt
        ? html`
            <wa-tooltip
              for="logs-view-date-${logId}"
              placement="top"
              trigger="hover"
            >
              <wa-relative-time
                .date=${createdAt}
                sync
              ></wa-relative-time>
            </wa-tooltip>
          `
        : ""}
    `;
  }

  /** ログ単一行の描画 */
  private renderLogRow(
    log: LogRecord,
    index: number,
    total: number,
  ): HTMLTemplateResult {
    if (log.id === undefined) return html``;

    const isExpanded = this.expandedLogIds.has(log.id);
    const isCollapsing = this.collapsingLogId === log.id;
    const hasBottom = index < total - 1;
    const title = extractLogTitle(log.value);
    const rowClass = isExpanded
      ? "logs-view__row logs-view__row--expanded"
      : "logs-view__row";

    return html`
      <div
        class=${rowClass}
        data-log-id=${String(log.id)}
        @click=${() => this.handleToggleExpand(log.id!)}
      >
        ${this.renderGraphCell(index, total)}
        <div class="logs-view__cell logs-view__cell--description">
          ${title}
        </div>
        ${this.renderDateCell(log.id, log.createdAt)}
      </div>
      ${isExpanded || isCollapsing
        ? this.renderInlineDetail(log, hasBottom, isCollapsing)
        : ""}
    `;
  }

  /** 空状態の描画 */
  private renderEmptyState(): HTMLTemplateResult {
    return html`
      <div class="logs-view__empty">
        <wa-icon name="book-open-solid-full"></wa-icon>
        <span>作業ログがありません</span>
      </div>
    `;
  }

  /** ログ一覧リストの描画 */
  private renderLogList(filteredLogs: LogRecord[]): HTMLTemplateResult {
    if (filteredLogs.length === 0) {
      return this.renderEmptyState();
    }

    return html`
      <div class="logs-view__list">
        ${this.renderListHeader()}
        ${filteredLogs.map((log, index) =>
          this.renderLogRow(log, index, filteredLogs.length),
        )}
      </div>
    `;
  }

  /** 削除確認ダイアログの描画 */
  private renderDeleteDialog(): HTMLTemplateResult {
    return html`
      <wa-dialog
        class="logs-view__delete-dialog"
        label="ログの削除"
        ?open=${this.isDeleteDialogOpen}
        @wa-after-hide=${this.handleCloseDeleteDialog}
      >
        本当にこの作業ログを削除してもよろしいですか？
        <wa-button
          slot="footer"
          appearance="plain"
          @click=${this.handleCloseDeleteDialog}
        >
          キャンセル
        </wa-button>
        <wa-button
          slot="footer"
          variant="danger"
          @click=${this.handleConfirmDelete}
        >
          削除
        </wa-button>
      </wa-dialog>
    `;
  }

  /** メインレンダリング */
  public override render(): HTMLTemplateResult {
    const rawLogs = this.logsController?.state ?? [];
    const sortedLogs = sortLogsByCreatedAtDesc(rawLogs);
    const filteredLogs = filterLogs(sortedLogs, this.searchQuery);

    return html`
      <div class="logs-view">
        ${this.renderHeader()}
        ${this.renderLogList(filteredLogs)}
        ${this.renderDeleteDialog()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "logs-view": LogsView;
  }
}
