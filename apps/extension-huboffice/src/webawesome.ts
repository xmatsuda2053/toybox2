import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/button-group/button-group.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/popover/popover.js";
import "@awesome.me/webawesome/dist/components/qr-code/qr-code.js";
import "@awesome.me/webawesome/dist/components/tag/tag.js";
import "@awesome.me/webawesome/dist/components/textarea/textarea.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import { registerIconLibrary } from "@awesome.me/webawesome/dist/webawesome.js";
import {
  createIconResolver,
  DEFAULT_ICON_LIBRARY_NAME,
  icons,
} from "@shared/icons";

/**
 * HubOffice 固有のローカル SVG アイコン定義（完全オフライン動作保証）
 */
const HUBOFFICE_EXTRA_ICONS: Record<string, string> = {
  "qrcode-solid-full":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 80C0 53.5 21.5 32 48 32l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48L0 80zM64 96l0 64 64 0 0-64L64 96zM0 336c0-26.5 21.5-48 48-48l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48l0-96zm64 16l0 64 64 0 0-64-64 0zM304 32l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48zm80 64l-64 0 0 64 64 0 0-64zM256 304c0-8.8 7.2-16 16-16l64 0c8.8 0 16 7.2 16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s7.2-16 16-16s16 7.2 16 16l0 96c0 8.8-7.2 16-16 16l-64 0c-8.8 0-16-7.2-16-16s-7.2-16-16-16s-16 7.2-16 16l0 64c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-160zM368 480a16 16 0 1 1 0-32 16 16 0 1 1 0 32zm64 0a16 16 0 1 1 0-32 16 16 0 1 1 0 32z"/></svg>',
  "thumbtack-solid-full":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M32 32C32 14.3 46.3 0 64 0L320 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-29.5 0 11.4 148.2c36.7 19.9 65.7 53.2 79.5 94.7l1 3c3.3 9.8 1.6 20.5-4.4 28.8s-15.7 13.3-26 13.3L32 352c-10.3 0-19.9-4.9-26-13.3s-7.7-19.1-4.4-28.8l1-3c13.8-41.5 42.8-74.8 79.5-94.7L93.5 64 64 64C46.3 64 32 49.7 32 32zM160 384l64 0 0 96c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-96z"/></svg>',
  "up-down-solid-full":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M150.6 54.4c-8-8.5-21.2-8.5-29.2 0l-80 85.3c-11.9 12.7-2.9 33.3 14.6 33.3H104v259c0 17.7 14.3 32 32 32s32-14.3 32-32V173h48c17.5 0 26.5-20.6 14.6-33.3l-80-85.3zM361.4 457.6c8 8.5 21.2 8.5 29.2 0l80-85.3c11.9-12.7 2.9-33.3-14.6-33.3H408V80c0-17.7-14.3-32-32-32s-32 14.3-32 32v259h-48c-17.5 0-26.5 20.6-14.6 33.3l80 85.3z"/></svg>',
};

const MERGED_ICONS: Record<string, string> = {
  ...icons,
  ...HUBOFFICE_EXTRA_ICONS,
};

/**
 * 拡張機能で利用される Web Awesome コンポーネント識別名一覧
 */
export const WEB_AWESOME_COMPONENTS = [
  "badge",
  "button",
  "button-group",
  "callout",
  "divider",
  "icon",
  "input",
  "popover",
  "qr-code",
  "tag",
  "textarea",
  "tooltip",
] as const;

export type WebAwesomeComponentName = (typeof WEB_AWESOME_COMPONENTS)[number];

/**
 * Web Awesome コンポーネント群およびローカル SVG アイコン基盤の初期化登録
 * 完全オフライン動作保証のためデフォルトライブラリにも登録する
 */
export function registerWebAwesome(): void {
  const resolver = createIconResolver(MERGED_ICONS);
  const mutator = (svg: SVGElement): void => {
    svg.setAttribute("fill", "currentColor");
  };

  registerIconLibrary(DEFAULT_ICON_LIBRARY_NAME, { resolver, mutator });
  registerIconLibrary("default", { resolver, mutator });
}
