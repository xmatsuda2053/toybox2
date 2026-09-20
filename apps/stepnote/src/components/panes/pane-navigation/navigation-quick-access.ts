import { LitElement, html, unsafeCSS, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { consume } from "@lit/context";
import { layoutUIContext, quickAccessContext } from "@/contexts/index.js";
import type { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import type { QuickAccessController } from "@/controllers/quick-access.controller.js";
import quickAccessStyles from "./navigation-quick-access.scss?inline";

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
   * コンポーネントの HTML テンプレートを生成・レンダリングする。
   *
   * @override
   * @return {import("lit").TemplateResult}
   * @memberof NavigationQuickAccess
   */
  override render() {
    const isOpen = this.layoutUIController?.state.isQuickAccessOpen ?? true;
    const qaState = this.quickAccessController?.state;

    const isBookmark = qaState?.isBookmarkSelected ?? false;
    const isUncategorized = qaState?.isUncategorizedSelected ?? false;
    const isOverdue = qaState?.isOverdueSelected ?? false;
    const isAsap = qaState?.isAsapSelected ?? false;
    const isUpcoming = qaState?.isUpcomingSelected ?? false;
    const isDone = qaState?.isDoneSelected ?? false;
    const isProgress = qaState?.isProgressSelected ?? false;
    const isPending = qaState?.isPendingSelected ?? false;

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
            <!-- 1. ブックマーク -->
            <wa-button
              class="quick-access-btn ${isBookmark ? "is-active" : ""}"
              variant="neutral"
              appearance=${isBookmark ? "filled" : "plain"}
              size="s"
              @click=${this.handleToggleBookmark}
            >
              <wa-icon
                slot="start"
                library="my-icons"
                name="bookmark-solid-full"
                class="quick-access-button-icon"
              ></wa-icon>
              ${isBookmark
                ? html` <wa-icon
                    slot="start"
                    library="my-icons"
                    name="caret-right-solid-full"
                    class="quick-access-button-icon"
                  ></wa-icon>`
                : nothing}
              ブックマーク
            </wa-button>

            <!-- 2. 未分類 -->
            <wa-button
              class="quick-access-btn ${isUncategorized ? "is-active" : ""}"
              variant="neutral"
              appearance=${isUncategorized ? "filled" : "plain"}
              size="s"
              @click=${this.handleToggleUncategorized}
            >
              <wa-icon
                slot="start"
                library="my-icons"
                name="question-solid-full"
                class="quick-access-button-icon"
              ></wa-icon>
              ${isUncategorized
                ? html` <wa-icon
                    slot="start"
                    library="my-icons"
                    name="caret-right-solid-full"
                    class="quick-access-button-icon"
                  ></wa-icon>`
                : nothing}
              未分類
            </wa-button>

            <wa-divider class="quick-access-divider"></wa-divider>

            <!-- 3. 期限切れ -->
            <wa-button
              class="quick-access-btn ${isOverdue ? "is-active" : ""}"
              variant="neutral"
              appearance=${isOverdue ? "filled" : "plain"}
              size="s"
              @click=${this.handleToggleOverdue}
            >
              <wa-icon
                slot="start"
                library="my-icons"
                name="fire-solid-full"
                class="quick-access-button-icon"
              ></wa-icon>
              ${isOverdue
                ? html` <wa-icon
                    slot="start"
                    library="my-icons"
                    name="caret-right-solid-full"
                    class="quick-access-button-icon"
                  ></wa-icon>`
                : nothing}
              期限切れ
            </wa-button>

            <!-- 4. 期限当日 -->
            <wa-button
              class="quick-access-btn ${isAsap ? "is-active" : ""}"
              variant="neutral"
              appearance=${isAsap ? "filled" : "plain"}
              size="s"
              @click=${this.handleToggleAsap}
            >
              <wa-icon
                slot="start"
                library="my-icons"
                name="triangle-exclamation-solid-full"
                class="quick-access-button-icon"
              ></wa-icon>
              ${isAsap
                ? html` <wa-icon
                    slot="start"
                    library="my-icons"
                    name="caret-right-solid-full"
                    class="quick-access-button-icon"
                  ></wa-icon>`
                : nothing}
              期限当日
            </wa-button>

            <!-- 5. 期限間近 -->
            <wa-button
              class="quick-access-btn ${isUpcoming ? "is-active" : ""}"
              variant="neutral"
              appearance=${isUpcoming ? "filled" : "plain"}
              size="s"
              @click=${this.handleToggleUpcoming}
            >
              <wa-icon
                slot="start"
                library="my-icons"
                name="calendar-solid-full"
                class="quick-access-button-icon"
              ></wa-icon>
              ${isUpcoming
                ? html` <wa-icon
                    slot="start"
                    library="my-icons"
                    name="caret-right-solid-full"
                    class="quick-access-button-icon"
                  ></wa-icon>`
                : nothing}
              期限間近
            </wa-button>

            <wa-divider class="quick-access-divider"></wa-divider>

            <!-- 6. 完了 -->
            <wa-button
              class="quick-access-btn ${isDone ? "is-active" : ""}"
              variant="neutral"
              appearance=${isDone ? "filled" : "plain"}
              size="s"
              @click=${this.handleToggleDone}
            >
              <wa-icon
                slot="start"
                library="my-icons"
                name="circle-check-solid-full"
                class="quick-access-button-icon"
              ></wa-icon>
              ${isDone
                ? html` <wa-icon
                    slot="start"
                    library="my-icons"
                    name="caret-right-solid-full"
                    class="quick-access-button-icon"
                  ></wa-icon>`
                : nothing}
              完了
              <wa-icon
                slot="end"
                library="my-icons"
                name=${isDone ? "eye-solid-full" : "eye-slash-solid-full"}
                class="quick-access-button-icon"
              ></wa-icon>
            </wa-button>

            <!-- 7. 対応中 -->
            <wa-button
              class="quick-access-btn ${isProgress ? "is-active" : ""}"
              variant="neutral"
              appearance=${isProgress ? "filled" : "plain"}
              size="s"
              @click=${this.handleToggleProgress}
            >
              <wa-icon
                slot="start"
                library="my-icons"
                name="circle-play-solid-full"
                class="quick-access-button-icon"
              ></wa-icon>
              ${isProgress
                ? html` <wa-icon
                    slot="start"
                    library="my-icons"
                    name="caret-right-solid-full"
                    class="quick-access-button-icon"
                  ></wa-icon>`
                : nothing}
              対応中
              <wa-icon
                slot="end"
                library="my-icons"
                name=${isProgress ? "eye-solid-full" : "eye-slash-solid-full"}
                class="quick-access-button-icon"
              ></wa-icon>
            </wa-button>

            <!-- 8. 開始待ち -->
            <wa-button
              class="quick-access-btn ${isPending ? "is-active" : ""}"
              variant="neutral"
              appearance=${isPending ? "filled" : "plain"}
              size="s"
              @click=${this.handleTogglePending}
            >
              <wa-icon
                slot="start"
                library="my-icons"
                name="circle-stop-solid-full"
                class="quick-access-button-icon"
              ></wa-icon>
              ${isPending
                ? html` <wa-icon
                    slot="start"
                    library="my-icons"
                    name="caret-right-solid-full"
                    class="quick-access-button-icon"
                  ></wa-icon>`
                : nothing}
              開始待ち
              <wa-icon
                slot="end"
                library="my-icons"
                name=${isPending ? "eye-solid-full" : "eye-slash-solid-full"}
                class="quick-access-button-icon"
              ></wa-icon>
            </wa-button>
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
