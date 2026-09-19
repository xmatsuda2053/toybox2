import { registerIconLibrary } from "@awesome.me/webawesome/dist/webawesome.js";
import { icons } from "./icons";

/**
 * デフォルトのアイコンライブラリ識別名
 */
export const DEFAULT_ICON_LIBRARY_NAME = "my-icons";

/**
 * registerIcons に指定可能なオプション
 */
export interface RegisterIconsOptions {
  /** 登録するアイコンライブラリ名（デフォルト: 'my-icons'） */
  libraryName?: string;
  /** SVG 要素描画直前に適用する mutator コールバック（デフォルト: fill="currentColor" 付与） */
  mutator?: (svg: SVGElement) => void;
}

/**
 * 指定されたアイコンマップから Data URL を解決するリゾルバ関数を生成する。
 *
 * @param iconsRecord アイコン名と SVG 文字列のマッピングオブジェクト
 * @returns Web Awesome 用の resolver 関数
 */
export function createIconResolver(
  iconsRecord: Record<string, string>,
): (name: string) => string {
  return (name: string): string => {
    if (name in iconsRecord) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(iconsRecord[name])}`;
    }
    return "";
  };
}

/**
 * 指定されたアイコン名がローカルアイコン集に登録されているか判定する。
 *
 * @param name アイコン名
 * @returns 登録されていれば true、それ以外は false
 */
export function hasIcon(name: string): boolean {
  return name in icons;
}

/**
 * 指定されたアイコン名の SVG 文字列を取得する。
 *
 * @param name アイコン名
 * @returns SVG 文字列（未登録の場合は undefined）
 */
export function getIconSvg(name: string): string | undefined {
  return icons[name];
}

/**
 * ローカル SVG アイコンを Web Awesome のアイコンライブラリとして登録する。
 *
 * @param options ライブラリ名や mutator などの設定オプション
 */
export function registerIcons(options?: RegisterIconsOptions): void {
  const libraryName = options?.libraryName ?? DEFAULT_ICON_LIBRARY_NAME;
  const mutator =
    options?.mutator ??
    ((svg: SVGElement) => {
      svg.setAttribute("fill", "currentColor");
    });

  registerIconLibrary(libraryName, {
    resolver: createIconResolver(icons),
    mutator,
  });
}
