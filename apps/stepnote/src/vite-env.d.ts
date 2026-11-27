/// <reference types="vite/client" />

/**
 * ビルド時に package.json から埋め込まれるアプリバージョン
 */
declare const __APP_VERSION__: string | undefined;

/**
 * SCSS インライン読み込み用アンビエントモジュール宣言（?inline で文字列として取得）
 */
declare module "*.scss?inline" {
  const content: string;
  export default content;
}
