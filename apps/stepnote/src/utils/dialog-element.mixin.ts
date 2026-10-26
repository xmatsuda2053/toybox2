import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import { dispatchCustomEvent } from "@shared/utils";

/**
 * Mixin 適用対象の基底 LitElement コンストラクタ型定義。
 * ※ TypeScript の Mixin 言語仕様（TS2545: A mixin class must have a constructor with a single rest parameter of type 'any[]'）
 * に準拠するため、引数型には any[] を許容します。
 */
export type LitElementBaseConstructor<T = LitElement> = new (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => T;

/**
 * ダイアログ要素（モーダルダイアログ）の開閉状態・テーマ・閉鎖イベント連携を提供する基盤 Mixin。
 *
 * @export
 * @template T
 * @param {T} Base
 * @return {*}
 */
export function WithDialogBase<T extends LitElementBaseConstructor>(Base: T) {
  class DialogBaseElement extends Base {
    /** ダイアログの開閉状態 */
    @property({ type: Boolean, reflect: true })
    public open: boolean = false;

    /** 適用テーマ（light / dark） */
    @property({ type: String, attribute: "data-theme", reflect: true })
    public dataTheme?: string;

    /**
     * ダイアログを閉じ、指定されたイベント名のカスタムイベントを送信する。
     *
     * @param {string} [eventName] 送信するイベント名（任意）
     * @memberof DialogBaseElement
     */
    public closeDialog(eventName?: string): void {
      this.open = false;
      if (eventName) {
        dispatchCustomEvent(this, eventName);
      }
    }
  }

  return DialogBaseElement;
}
