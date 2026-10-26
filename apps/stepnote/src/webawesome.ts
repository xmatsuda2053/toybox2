/**
 * Web Awesome コンポーネント登録基盤
 *
 * アプリケーション全体で使用される Web Awesome（Web Components）の読み込みを一括集約し、
 * 個別コンポーネント内での直接・二重インポートを防止するための登録基盤モジュール。
 */

// Web Awesome コンポーネント群の一括登録（副作用インポート）
import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/button-group/button-group.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import "@awesome.me/webawesome/dist/components/drawer/drawer.js";
import "@awesome.me/webawesome/dist/components/dropdown/dropdown.js";
import "@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/option/option.js";
import "@awesome.me/webawesome/dist/components/popover/popover.js";
import "@awesome.me/webawesome/dist/components/relative-time/relative-time.js";
import "@awesome.me/webawesome/dist/components/select/select.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/switch/switch.js";
import "@awesome.me/webawesome/dist/components/tab/tab.js";
import "@awesome.me/webawesome/dist/components/tab-group/tab-group.js";
import "@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js";
import "@awesome.me/webawesome/dist/components/textarea/textarea.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";

/**
 * 登録対象の Web Awesome コンポーネント識別名一覧
 */
export const WEB_AWESOME_COMPONENTS = [
  "badge",
  "button",
  "button-group",
  "dialog",
  "divider",
  "drawer",
  "dropdown",
  "dropdown-item",
  "icon",
  "input",
  "option",
  "popover",
  "relative-time",
  "select",
  "spinner",
  "switch",
  "tab",
  "tab-group",
  "tab-panel",
  "textarea",
  "tooltip",
] as const;

/**
 * Web Awesome コンポーネント名の型
 */
export type WebAwesomeComponentName = (typeof WEB_AWESOME_COMPONENTS)[number];

/**
 * 登録対象の Web Awesome カスタム要素タグ名一覧（'wa-' プレフィックス付き）
 */
export const WEB_AWESOME_TAG_NAMES: readonly string[] = Object.freeze(
  WEB_AWESOME_COMPONENTS.map((name) => `wa-${name}`),
);

/**
 * 指定されたコンポーネント識別名に対応する Web Awesome タグ名を取得する。
 *
 * @param name コンポーネント識別名（例: 'button'）
 * @returns 'wa-' プレフィックス付きのタグ名（例: 'wa-button'）
 */
export function getWebAwesomeTagName(name: string): string {
  return `wa-${name}`;
}

/**
 * 指定されたコンポーネント名が登録済み Web Awesome コンポーネントに含まれるか判定する。
 *
 * @param name 判定対象のコンポーネント識別名
 * @returns 登録済みであれば true、それ以外は false
 */
export function isRegisteredWebAwesomeComponent(name: string): boolean {
  return (WEB_AWESOME_COMPONENTS as readonly string[]).includes(name);
}

/**
 * Web Awesome コンポーネント群の登録を明示的に実行・確認するエントリー関数。
 * 本モジュールのインポート時に自動登録されますが、明示的な呼び出しにも対応します。
 */
export function registerWebAwesome(): void {
  // モジュールインポート時に customElements への登録が完了するため、
  // エントリーポイントからの明示的な初期化ステップとしても機能する。
}
