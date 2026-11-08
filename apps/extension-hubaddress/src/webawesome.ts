import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/button-group/button-group.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import { registerIcons } from "@shared/icons";

/**
 * 拡張機能で利用される Web Awesome コンポーネント識別名一覧
 */
export const WEB_AWESOME_COMPONENTS = [
  "button",
  "button-group",
  "icon",
  "tooltip",
] as const;

/**
 * Web Awesome コンポーネント名の型
 */
export type WebAwesomeComponentName = (typeof WEB_AWESOME_COMPONENTS)[number];

/**
 * Web Awesome コンポーネント群およびローカル SVG アイコン基盤の初期化登録
 * 完全オフライン（スタンドアロン）保証のため、デフォルトライブラリ ('default') にも登録
 */
export function registerWebAwesome(): void {
  registerIcons();
  registerIcons({ libraryName: "default" });
}
