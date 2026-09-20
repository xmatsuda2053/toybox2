import {
  LitElement,
  html,
  unsafeCSS,
  type HTMLTemplateResult,
  nothing,
} from "lit";
import { customElement, property } from "lit/decorators.js";
import { consume } from "@lit/context";
import { layoutUIContext, quickAccessContext } from "@/contexts/index.js";
import type { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import type { QuickAccessController } from "@/controllers/quick-access.controller.js";
import type { QuickAccessRecord } from "@/db/models/navigation.model.js";
import type { QuickAccessTaskCounts } from "@/types/view/navigation-view.type.js";
import quickAccessStyles from "./navigation-quick-access.scss?inline";

/**
 * クイックアクセスボタンの構成項目定義
 *
 * @interface QuickAccessButtonItem
 */
interface QuickAccessButtonItem {
  /** 一意識別子 */
  readonly id: string;
  /** 表示ラベルテキスト */
  readonly label: string;
  /** 先頭アイコン名 */
  readonly icon: string;
  /** QuickAccessRecord のステータスプロパティ名 */
  readonly stateKey: keyof QuickAccessRecord;
  /** ボタン押下時のハンドラー取得関数 */
  readonly getHandler: (cmp: NavigationQuickAccess) => () => void;
  /** 件数バッジを連携表示するキー（未指定時はバッジなし） */
  readonly countKey?: keyof QuickAccessTaskCounts;
  /** 目のトグルアイコン（表示/非表示）を表示するか */
  readonly hasEyeToggle?: boolean;
}

/**
 * クイックアクセスのボタングループ定義（グループ間に wa-divider を配置）
 */
const QUICK_ACCESS_BUTTON_GROUPS: readonly QuickAccessButtonItem[][] = [
  // グループ1: 基本属性（タスク件数バッジ対応）
  [
    {
      id: "bookmark",
      label: "ブックマーク",
      icon: "bookmark-solid-full",
      stateKey: "isBookmarkSelected",
      getHandler: (cmp) => cmp.handleToggleBookmark,
      countKey: "bookmark",
    },
    {
      id: "uncategorized",
      label: "未分類",
      icon: "question-solid-full",
      stateKey: "isUncategorizedSelected",
      getHandler: (cmp) => cmp.handleToggleUncategorized,
      countKey: "uncategorized",
    },
  ],
  // グループ2: 期限属性（タスク件数バッジ対応）
  [
    {
      id: "overdue",
      label: "期限切れ",
      icon: "fire-solid-full",
      stateKey: "isOverdueSelected",
      getHandler: (cmp) => cmp.handleToggleOverdue,
      countKey: "overdue",
    },
    {
      id: "asap",
      label: "期限当日",
      icon: "triangle-exclamation-solid-full",
      stateKey: "isAsapSelected",
      getHandler: (cmp) => cmp.handleToggleAsap,
      countKey: "asap",
    },
    {
      id: "upcoming",
      label: "期限間近",
      icon: "calendar-solid-full",
      stateKey: "isUpcomingSelected",
      getHandler: (cmp) => cmp.handleToggleUpcoming,
      countKey: "upcoming",
    },
  ],
  // グループ3: ステータス属性（目のトグルアイコン対応）
  [
    {
      id: "done",
      label: "完了",
      icon: "circle-check-solid-full",
      stateKey: "isDoneSelected",
      getHandler: (cmp) => cmp.handleToggleDone,
      hasEyeToggle: true,
    },
    {
      id: "progress",
      label: "対応中",
      icon: "circle-play-solid-full",
      stateKey: "isProgressSelected",
      getHandler: (cmp) => cmp.handleToggleProgress,
      hasEyeToggle: true,
    },
    {
      id: "pending",
      label: "開始待ち",
      icon: "circle-stop-solid-full",
      stateKey: "isPendingSelected",
      getHandler: (cmp) => cmp.handleTogglePending,
      hasEyeToggle: true,
    },
  ],
] as const;

/**
 * Quick Access コンポーネント (NavigationQuickAccess)
 *
 * Navigation ペイン上部に配置され、タスク一覧の各種絞り込み条件（ブックマーク、未分類、
 * 期限切れ/当日/間近、完了/対応中/開始待ち）をトグル制御する。
 * タイトル部に開閉トグルボタンを備え、アコーディオンアニメーションによる折りたたみが可能。
 *
 * @export
 * @class NavigationQuickAccess
 * @extends {LitElement}
 */
@customElement("navigation-quick-access")
export class NavigationQuickAccess extends LitElement {
  public static override styles = unsafeCSS(quickAccessStyles);

  /**
   * 外部から注入されるタスク件数（View Props）
   *
   * @type {QuickAccessTaskCounts}
   * @memberof NavigationQuickAccess
   */
  @property({ attribute: false })
  public taskCounts: QuickAccessTaskCounts = {
    bookmark: 5,
    uncategorized: 2,
    overdue: 3,
    asap: 4,
    upcoming: 6,
  };

  /**
   * LayoutUIController の購読解除関数
   *
   * @private
   * @type {(() => void) | undefined}
   * @memberof NavigationQuickAccess
   */
  private unsubLayoutUI?: () => void;

  /**
   * QuickAccessController の購読解除関数
   *
   * @private
   * @type {(() => void) | undefined}
   * @memberof NavigationQuickAccess
   */
  private unsubQuickAccess?: () => void;

  /**
   * 内部で保持する LayoutUIController インスタンス
   *
   * @private
   * @type {LayoutUIController | undefined}
   * @memberof NavigationQuickAccess
   */
  private _layoutUIController?: LayoutUIController;

  /**
   * 内部で保持する QuickAccessController インスタンス
   *
   * @private
   * @type {QuickAccessController | undefined}
   * @memberof NavigationQuickAccess
   */
  private _quickAccessController?: QuickAccessController;

  /**
   * レイアウト開閉状態管理コントローラーを取得する。
   *
   * @type {LayoutUIController | undefined}
   * @memberof NavigationQuickAccess
   */
  public get layoutUIController(): LayoutUIController | undefined {
    return this._layoutUIController;
  }

  /**
   * レイアウト開閉状態管理コントローラーを設定し、状態変更の購読を開始する。
   * コントローラーが差し替えられた場合は既存の購読を解除し、新たなインスタンスを購読します。
   *
   * @memberof NavigationQuickAccess
   */
  @consume({ context: layoutUIContext, subscribe: true })
  public set layoutUIController(controller: LayoutUIController | undefined) {
    if (this.unsubLayoutUI) {
      this.unsubLayoutUI();
      this.unsubLayoutUI = undefined;
    }
    this._layoutUIController = controller;
    if (controller && typeof controller.subscribe === "function") {
      this.unsubLayoutUI = controller.subscribe(() => {
        this.requestUpdate();
      });
    }
    this.requestUpdate();
  }

  /**
   * クイックアクセスフィルター状態管理コントローラーを取得する。
   *
   * @type {QuickAccessController | undefined}
   * @memberof NavigationQuickAccess
   */
  public get quickAccessController(): QuickAccessController | undefined {
    return this._quickAccessController;
  }

  /**
   * クイックアクセスフィルター状態管理コントローラーを設定し、状態変更の購読を開始する。
   * コントローラーが差し替えられた場合は既存の購読を解除し、新たなインスタンスを購読します。
   *
   * @memberof NavigationQuickAccess
   */
  @consume({ context: quickAccessContext, subscribe: true })
  public set quickAccessController(
    controller: QuickAccessController | undefined,
  ) {
    if (this.unsubQuickAccess) {
      this.unsubQuickAccess();
      this.unsubQuickAccess = undefined;
    }
    this._quickAccessController = controller;
    if (controller && typeof controller.subscribe === "function") {
      this.unsubQuickAccess = controller.subscribe(() => {
        this.requestUpdate();
      });
    }
    this.requestUpdate();
  }

  /**
   * コンポーネントが DOM から切断された際のクリーンアップ処理。
   * メモリリーク防止のため、各コントローラーへの購読を確実に解除する。
   *
   * @override
   * @memberof NavigationQuickAccess
   */
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.unsubLayoutUI) {
      this.unsubLayoutUI();
      this.unsubLayoutUI = undefined;
    }
    if (this.unsubQuickAccess) {
      this.unsubQuickAccess();
      this.unsubQuickAccess = undefined;
    }
  }

  /**
   * QUICK ACCESS の開閉トグルボタン押下ハンドラー。
   * LayoutUIController を通じて開閉フラグを反転させる。
   *
   * @return {void}
   * @memberof NavigationQuickAccess
   */
  public handleToggleQuickAccess = (): void => {
    this.layoutUIController?.toggleQuickAccess();
  };

  /**
   * 「ブックマーク」フィルターボタン押下ハンドラー。
   * QuickAccessController を通じてブックマークフィルターの選択状態を反転させる。
   *
   * @return {void}
   * @memberof NavigationQuickAccess
   */
  public handleToggleBookmark = (): void => {
    this.quickAccessController?.toggleBookmarkSelected();
  };

  /**
   * 「未分類」フィルターボタン押下ハンドラー。
   * QuickAccessController を通じて未分類フィルターの選択状態を反転させる。
   *
   * @return {void}
   * @memberof NavigationQuickAccess
   */
  public handleToggleUncategorized = (): void => {
    this.quickAccessController?.toggleUncategorizedSelected();
  };

  /**
   * 「期限切れ」フィルターボタン押下ハンドラー。
   * QuickAccessController を通じて期限切れフィルターの選択状態を排他的に反転させる。
   *
   * @return {void}
   * @memberof NavigationQuickAccess
   */
  public handleToggleOverdue = (): void => {
    this.quickAccessController?.toggleOverdueSelected();
  };

  /**
   * 「期限当日」フィルターボタン押下ハンドラー。
   * QuickAccessController を通じて期限当日フィルターの選択状態を排他的に反転させる。
   *
   * @return {void}
   * @memberof NavigationQuickAccess
   */
  public handleToggleAsap = (): void => {
    this.quickAccessController?.toggleAsapSelected();
  };

  /**
   * 「期限間近」フィルターボタン押下ハンドラー。
   * QuickAccessController を通じて期限間近フィルターの選択状態を排他的に反転させる。
   *
   * @return {void}
   * @memberof NavigationQuickAccess
   */
  public handleToggleUpcoming = (): void => {
    this.quickAccessController?.toggleUpcomingSelected();
  };

  /**
   * 「完了」フィルターボタン押下ハンドラー。
   * QuickAccessController を通じて完了フィルターの選択状態を反転させる。
   *
   * @return {void}
   * @memberof NavigationQuickAccess
   */
  public handleToggleDone = (): void => {
    this.quickAccessController?.toggleDoneSelected();
  };

  /**
   * 「対応中」フィルターボタン押下ハンドラー。
   * QuickAccessController を通じて対応中フィルターの選択状態を反転させる。
   *
   * @return {void}
   * @memberof NavigationQuickAccess
   */
  public handleToggleProgress = (): void => {
    this.quickAccessController?.toggleProgressSelected();
  };

  /**
   * 「開始待ち」フィルターボタン押下ハンドラー。
   * QuickAccessController を通じて開始待ちフィルターの選択状態を反転させる。
   *
   * @return {void}
   * @memberof NavigationQuickAccess
   */
  public handleTogglePending = (): void => {
    this.quickAccessController?.togglePendingSelected();
  };

  /**
   * ボタン末尾スロット（slot="end"）の要素をレンダリングする。
   * ステータス系は目のトグルアイコン、基本・期限系はタスク件数バッジを出力。
   *
   * @private
   * @param {QuickAccessButtonItem} item
   * @param {boolean} isActive
   * @return {*}
   * @memberof NavigationQuickAccess
   */
  private renderEndSlot(
    item: QuickAccessButtonItem,
    isActive: boolean,
  ): HTMLTemplateResult | typeof nothing {
    if (item.hasEyeToggle) {
      return html`
        <wa-icon
          slot="end"
          library="my-icons"
          name=${isActive ? "eye-solid-full" : "eye-slash-solid-full"}
          class="quick-access-button-icon"
        ></wa-icon>
      `;
    }

    if (item.countKey !== undefined) {
      const count = this.taskCounts[item.countKey];
      if (typeof count === "number" && count > 0) {
        return html`
          <span slot="end" class="quick-access-counter">${count}</span>
        `;
      }
    }

    return nothing;
  }

  /**
   * フィルターボタン1つを共通構造でレンダリングする。
   *
   * @private
   * @param {QuickAccessButtonItem} item
   * @param {boolean} isActive
   * @return {*}
   * @memberof NavigationQuickAccess
   */
  private renderFilterButton(
    item: QuickAccessButtonItem,
    isActive: boolean,
  ): HTMLTemplateResult | typeof nothing {
    return html`
      <wa-button
        class="quick-access-btn ${isActive ? "is-active" : ""}"
        variant="neutral"
        appearance=${isActive ? "filled" : "plain"}
        size="s"
        @click=${item.getHandler(this)}
      >
        <wa-icon
          slot="start"
          library="my-icons"
          name=${item.icon}
          class="quick-access-button-icon"
        ></wa-icon>
        ${isActive
          ? html`
              <wa-icon
                slot="start"
                library="my-icons"
                name="caret-right-solid-full"
                class="quick-access-button-icon"
              ></wa-icon>
            `
          : nothing}
        ${item.label} ${this.renderEndSlot(item, isActive)}
      </wa-button>
    `;
  }

  /**
   * コンポーネントの HTML テンプレートを生成・レンダリングする。
   *
   * @override
   * @return {import("lit").TemplateResult}
   * @memberof NavigationQuickAccess
   */
  override render(): HTMLTemplateResult | typeof nothing {
    const isOpen = this.layoutUIController?.state.isQuickAccessOpen ?? true;
    const qaState = this.quickAccessController?.state;

    const toggleLabel = isOpen
      ? "QUICK ACCESSを折りたたむ"
      : "QUICK ACCESSを展開する";

    return html`
      <div class="quick-access">
        <!-- タイトル部 (Header) -->
        <header class="section-header quick-access-header">
          <span class="section-title quick-access-title">QUICK ACCESS</span>
          <wa-button
            id="btn-toggle-quick-access"
            class="btn-toggle-section btn-toggle-quick-access"
            variant="neutral"
            appearance="plain"
            size="s"
            @click=${this.handleToggleQuickAccess}
          >
            <wa-icon
              library="my-icons"
              name="chevron-right"
              class="icon-toggle-section icon-toggle-quick-access ${isOpen
                ? "is-open"
                : "is-closed"}"
              label=${toggleLabel}
            ></wa-icon>
          </wa-button>
        </header>

        <!-- コンテンツ部 (Content: アコーディオンアニメーション) -->
        <div
          class="quick-access-content-wrapper ${isOpen
            ? "is-open"
            : "is-closed"}"
        >
          <div class="quick-access-content">
            ${QUICK_ACCESS_BUTTON_GROUPS.map(
              (group, groupIndex) => html`
                ${groupIndex > 0
                  ? html`<wa-divider class="quick-access-divider"></wa-divider>`
                  : nothing}
                ${group.map((item) =>
                  this.renderFilterButton(
                    item,
                    Boolean(qaState?.[item.stateKey]),
                  ),
                )}
              `,
            )}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "navigation-quick-access": NavigationQuickAccess;
  }
}
