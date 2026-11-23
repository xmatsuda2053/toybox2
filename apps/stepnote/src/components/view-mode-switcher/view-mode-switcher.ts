import { html, unsafeCSS, type HTMLTemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { AppViewMode } from "@/types";
import {
  SubscriberElement,
  WithLayoutUIController,
} from "@/utils/controller-consumers.mixin.js";
import viewModeSwitcherStyles from "./view-mode-switcher.scss?inline";

interface ViewModeOption {
  readonly value: AppViewMode;
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

const VIEW_MODE_OPTIONS: readonly ViewModeOption[] = [
  {
    value: "standard",
    id: "btn-view-mode-standard",
    label: "標準モード",
    icon: "table-columns-solid-full",
  },
  {
    value: "list",
    id: "btn-view-mode-list",
    label: "一覧モード",
    icon: "table-solid-full",
  },
] as const;

/**
 * 表示モード切り替えセグメントボタングループコンポーネント (ViewModeSwitcher)
 *
 * ヘッダーに配置され、標準モード（5ペイン）と一覧モードの切り替えUIを提供する。
 */
@customElement("view-mode-switcher")
export class ViewModeSwitcher extends WithLayoutUIController(
  SubscriberElement,
) {
  public static override styles = unsafeCSS(viewModeSwitcherStyles);

  /** Scratch / Settings 等による操作無効化フラグ */
  @property({ type: Boolean, reflect: true })
  public disabled: boolean = false;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.subscriber.unsubscribeAll();
  }

  /**
   * ボタンクリックで表示モードを変更する
   */
  public handleViewModeChange = (mode: AppViewMode): void => {
    if (this.disabled) return;
    this.layoutUIController?.setViewMode(mode);
    this.requestUpdate();
  };

  private renderModeButton(
    option: ViewModeOption,
    currentMode: AppViewMode,
  ): HTMLTemplateResult {
    const isActive = currentMode === option.value;
    const appearance = isActive ? "filled" : "plain";
    const ariaPressed = isActive ? "true" : "false";
    const className = isActive
      ? "view-mode-switcher__btn view-mode-switcher__btn--active"
      : "view-mode-switcher__btn";

    return html`
      <wa-button
        id="${option.id}"
        class="${className}"
        variant="neutral"
        appearance="${appearance}"
        size="s"
        aria-pressed="${ariaPressed}"
        ?disabled=${this.disabled}
        @click=${() => this.handleViewModeChange(option.value)}
      >
        <wa-icon
          library="my-icons"
          name="${option.icon}"
          label="${option.label}"
        ></wa-icon>
      </wa-button>
    `;
  }

  /**
   * 各ボタンに対応するツールチップ群を描画する。
   */
  private renderTooltips(): HTMLTemplateResult[] {
    return VIEW_MODE_OPTIONS.map(
      (option) =>
        html`<wa-tooltip for="${option.id}" trigger="hover">
          ${option.label}
        </wa-tooltip>`,
    );
  }

  public override render(): HTMLTemplateResult {
    const currentMode: AppViewMode =
      this.layoutUIController?.state.viewMode ?? "standard";

    return html`
      <wa-button-group class="view-mode-switcher" label="表示モード切り替え">
        ${VIEW_MODE_OPTIONS.map((opt) =>
          this.renderModeButton(opt, currentMode),
        )}
      </wa-button-group>
      ${this.renderTooltips()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "view-mode-switcher": ViewModeSwitcher;
  }
}
