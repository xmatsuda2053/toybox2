import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  SubscriberElement,
  WithScratchController,
} from "@/utils/controller-consumers.mixin.js";
import "@/components/notes/notes-view.js";
import styles from "./scratch-pane.scss?inline";

/**
 * 全画面スクラッチモード専用ペインコンポーネント (ScratchPane)
 *
 * アプリ共通メモ（Scratch）を全画面で編集・閲覧するための専用領域を提供する。
 *
 * @export
 * @class ScratchPane
 * @extends {WithScratchController(SubscriberElement)}
 */
@customElement("scratch-pane")
export class ScratchPane extends WithScratchController(SubscriberElement) {
  public static styles = unsafeCSS(styles);

  /**
   * カラーテーマ ("light" | "dark")
   */
  @property({ type: String, attribute: "data-theme" })
  public theme: string = "light";

  /**
   * 指定した Scratch ノートへ切り替えて選択表示する
   *
   * @param {number} scratchId
   * @return {Promise<void>}
   * @memberof ScratchPane
   */
  public navigateToScratch = async (scratchId: number): Promise<void> => {
    if (this.isConnected) {
      await this.updateComplete;
    }
    const notesView = this.renderRoot?.querySelector("notes-view") as
      | (HTMLElement & {
          handleSelectNote?: (id: number) => void;
          updateComplete?: Promise<unknown>;
        })
      | null;
    if (notesView?.isConnected) {
      await notesView.updateComplete;
    }
    notesView?.handleSelectNote?.(scratchId);
  };

  /**
   * ヘッダー部の描画
   *
   * @private
   * @return {HTMLTemplateResult}
   * @memberof ScratchPane
   */
  private renderHeader(): HTMLTemplateResult {
    return html`
      <div class="scratch-pane__header">
        <span class="scratch-pane__title">SCRATCH</span>
      </div>
    `;
  }

  /**
   * メインコンテンツ部の描画
   *
   * @private
   * @return {HTMLTemplateResult}
   * @memberof ScratchPane
   */
  private renderContent(): HTMLTemplateResult {
    return html`
      <div class="scratch-pane__content">
        <notes-view
          .theme=${this.theme}
          data-theme=${this.theme}
          .showTabId=${false}
          .jumpTagType=${"scratch"}
          .controller=${this.scratchController}
        ></notes-view>
      </div>
    `;
  }

  /**
   * メインレンダリング
   *
   * @return {HTMLTemplateResult}
   * @memberof ScratchPane
   */
  public override render(): HTMLTemplateResult {
    return html`
      <div class="scratch-pane">
        ${this.renderHeader()}
        ${this.renderContent()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "scratch-pane": ScratchPane;
  }
}
