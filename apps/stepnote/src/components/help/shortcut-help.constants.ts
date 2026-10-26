/**
 * ショートカットヘルプ定義 (shortcut-help.constants.ts)
 *
 * StepNote 内で使用可能な主要キーボードショートカットの定義・マスタデータ。
 */

export interface ShortcutItem {
  readonly keys: readonly string[];
  readonly description: string;
}

export interface ShortcutCategory {
  readonly title: string;
  readonly items: readonly ShortcutItem[];
}

export const SHORTCUT_CATEGORIES: readonly ShortcutCategory[] = [
  {
    title: "全体・基本操作",
    items: [
      { keys: ["Ctrl", "K"], description: "全体検索モーダルを開く" },
      { keys: ["Alt", "N"], description: "新規タスク作成モーダルを開く" },
      { keys: ["Ctrl", "/"], description: "ショートカット一覧ヘルプの開閉" },
      { keys: ["Esc"], description: "開いているモーダル・ヘルプを閉じる" },
    ],
  },
  {
    title: "ビュー・ペイン切替",
    items: [
      { keys: ["Ctrl", "Alt", "Z"], description: "集中モード（Zen Mode）の切替" },
      { keys: ["Ctrl", "Alt", "S"], description: "全画面スクラッチパッドの切替" },
    ],
  },
  {
    title: "Markdown エディタ記法",
    items: [
      { keys: ["Ctrl", "B"], description: "太字（Bold）" },
      { keys: ["Ctrl", "I"], description: "斜体（Italic）" },
      { keys: ["Ctrl", "Shift", "X"], description: "取り消し線（Strikethrough）" },
      { keys: ["Ctrl", "Shift", "T"], description: "表（Table）の挿入" },
    ],
  },
] as const;
