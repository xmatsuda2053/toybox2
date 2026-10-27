import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  SubscriberElement,
  WithLabelsController,
} from "@/utils/controller-consumers.mixin.js";
import styles from "./task-create-button.scss?inline";

/**
 * タスク新規作成共通ボタンコンポーネント (TaskCreateButton)
 *
 * 最左メニューパネル（app-menu）およびタスクリストヘッダー（task-list）の双方から利用される、
 * 新規タスク起票用のアクションボタン。
 * LabelsController の登録状態に応じて自律的に活性/非活性およびツールチップを切り替え、
 * クリック時に request-task-create イベントをディスパッチする。
 *
 * @export
 * @class TaskCreateButton
 * @extends {WithLabelsController(SubscriberElement)}
 */
@customElement("task-create-button")
export class TaskCreateButton extends WithLabelsController(SubscriberElement) {
  public static override styles = unsafeCSS(styles);

  /**
   * ボタンサイズ ("s" | "m")
   */
  @property({ type: String })
  public size: "s" | "m" = "m";

  /**
   * ツールチップの表示位置 ("bottom" | "right" | "top" | "left")
   */
  @property({ type: String })
  public placement: "bottom" | "right" | "top" | "left" = "bottom";

  /**
   * ボタンの DOM ID
   */
  @property({ type: String })
  public buttonId: string = "task-create-btn";

  /**
   * ツールチップのトリガー種別 (デフォルト: "hover")
   */
  @property({ type: String })
  public trigger: string = "hover";

  /**
   * 外部からの明示的な無効化フラグ
   */
  @property({ type: Boolean })
  public disabled: boolean = false;

  /**
   * 登録済みラベルが存在するか判定する
   */
  public get hasLabels(): boolean {
    if (!this.labelsController) {
      return false;
    }
    return (
      this.labelsController.hasLabels ??
      ((this.labelsController.state?.length ?? 0) > 0)
    );
  }

  /**
   * ツールチップ文言
   */
  public get tooltipText(): string {
    return this.hasLabels
      ? "新規タスクを作成 (Alt+N)"
      : "ラベルを登録してください";
  }

  /**
   * クリックイベントハンドラー
   */
  public handleClick = (): void => {
    if (this.disabled || !this.hasLabels) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("request-task-create", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  public override render(): HTMLTemplateResult {
    const isButtonDisabled = this.disabled || !this.hasLabels;
    const tooltip = this.tooltipText;

    return html`
      <wa-tooltip
        for="${this.buttonId}"
        placement="${this.placement}"
        trigger="${this.trigger}"
      >
        ${tooltip}
      </wa-tooltip>
      <wa-button
        id="${this.buttonId}"
        class="task-create-btn"
        variant="neutral"
        appearance="plain"
        size="${this.size}"
        ?disabled=${isButtonDisabled}
        @click=${this.handleClick}
      >
        <wa-icon
          library="my-icons"
          name="plus-solid-full"
          class="task-create-btn__icon"
          label="${tooltip}"
        ></wa-icon>
      </wa-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-create-button": TaskCreateButton;
  }
}
