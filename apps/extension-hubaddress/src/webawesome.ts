import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/button-group/button-group.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/option/option.js";
import "@awesome.me/webawesome/dist/components/select/select.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/switch/switch.js";
import "@awesome.me/webawesome/dist/components/tab/tab.js";
import "@awesome.me/webawesome/dist/components/tab-group/tab-group.js";
import "@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js";
import "@awesome.me/webawesome/dist/components/tag/tag.js";
import "@awesome.me/webawesome/dist/components/textarea/textarea.js";
import "@awesome.me/webawesome/dist/components/toast/toast.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import { registerIcons } from "@shared/icons";

/**
 * 拡張機能で利用される Web Awesome コンポーネント識別名一覧
 */
export const WEB_AWESOME_COMPONENTS = [
  "badge",
  "button",
  "button-group",
  "callout",
  "dialog",
  "divider",
  "icon",
  "input",
  "option",
  "select",
  "spinner",
  "switch",
  "tab",
  "tab-group",
  "tab-panel",
  "tag",
  "textarea",
  "toast",
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
