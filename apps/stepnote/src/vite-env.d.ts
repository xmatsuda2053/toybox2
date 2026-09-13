/// <reference types="vite/client" />

/**
 * SCSS インライン読み込み用アンビエントモジュール宣言（?inline で文字列として取得）
 */
declare module "*.scss?inline" {
  const content: string;
  export default content;
}
