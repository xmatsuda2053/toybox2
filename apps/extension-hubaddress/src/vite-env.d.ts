/// <reference types="vite/client" />

/**
 * Web Components カスタム要素ポリフィル用アンビエントモジュール宣言
 */
declare module "@webcomponents/custom-elements";

/**
 * SCSS インライン読み込み用アンビエントモジュール宣言（?inline で文字列として取得）
 */
declare module "*.scss?inline" {
  const content: string;
  export default content;
}
