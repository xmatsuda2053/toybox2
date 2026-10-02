/**
 * Web Awesome コンポーネント共通のサイズ指定型
 */
export type ComponentSize =
  | "s"
  | "m"
  | "l"
  | "small"
  | "medium"
  | "large";

/**
 * Web Awesome のサイズ属性（s, m, l）に正規化する。
 *
 * @export
 * @param {ComponentSize} size 入力サイズ
 * @return {("s" | "m" | "l")} 正規化されたサイズ属性値
 */
export function normalizeWaSize(size: ComponentSize): "s" | "m" | "l" {
  switch (size) {
    case "small":
      return "s";
    case "medium":
      return "m";
    case "large":
      return "l";
    default:
      return size;
  }
}
