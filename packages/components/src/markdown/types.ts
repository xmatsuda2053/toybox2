import type { Pluggable, Processor } from "unified";
import type { Extension } from "@codemirror/state";
import type { defaultSchema } from "rehype-sanitize";

/**
 * サニタイズスキーマ型（rehype-sanitize の defaultSchema 互換）
 */
export type SanitizeSchema = typeof defaultSchema;

/**
 * サニタイズスキーマをカスタマイズするための修飾関数
 */
export type SanitizeSchemaModifier = (baseSchema: SanitizeSchema) => SanitizeSchema;

/**
 * Markdown パイプライン設定オプション (DI用)
 */
export interface MarkdownProcessorOptions {
  /** 追加の remark プラグイン（構文解析・MDAST変換） */
  remarkPlugins?: Pluggable[];
  /** 追加の rehype プラグイン（HAST変換・HTML出力） */
  rehypePlugins?: Pluggable[];
  /** サニタイズスキーマのカスタマイズ関数 */
  sanitizeSchemaModifier?: SanitizeSchemaModifier;
}

/**
 * Markdown プロセッサの公開インターフェース
 */
export interface IMarkdownProcessor {
  /**
   * Markdown 文字列をパース・変換・サニタイズし、安全な HTML 文字列を出力する。
   *
   * @param markdown 入力 Markdown 文字列
   * @returns 変換された HTML 文字列
   */
  process(markdown: string): Promise<string>;

  /**
   * 内部で保持している unified プロセッサインスタンスを取得する（高度な検証用）。
   */
  readonly internalProcessor: Processor<any, any, any, any, any>;
}

/**
 * 統合 Markdown 拡張機能パッケージ (Feature Extension)
 *
 * 独自記法・構文拡張をプラグイン化する際、パイプライン処理・ツールバーアクション・構文ヘルプ解説を
 * 1つの自己完結したモジュールとしてバンドルし、認知負荷と保守コストを最小化する。
 */
export interface MarkdownFeatureExtension {
  /** 拡張機能の固有識別子 (例: "custom-badge") */
  id: string;

  /** 表示名 (例: "ステータスバッジ") */
  label: string;

  /** 構文の解説（ヘルプ・チートシートに表示） (例: "重要度や状態を表すカラーバッジを表示します") */
  description?: string;

  /** 挿入される構文テンプレート (例: ":badge[ラベル]:") */
  template: string;

  /** 使用例・サンプル (例: ":badge[優先度:高]:") */
  example?: string;

  /** 書式ツールバーに表示するボタン設定（省略時はツールバーにボタンを表示せずヘルプのみ提供） */
  toolbarItem?: {
    /** アイコン名 (登録済みアイコン。未指定時は "tag-solid-full") */
    icon?: string;
    /** ツールチップ表示名 (未指定時は label を使用) */
    title?: string;
  };

  /** unified (remark / rehype) パイプライン設定 */
  processor?: {
    remarkPlugins?: Pluggable[];
    rehypePlugins?: Pluggable[];
    sanitizeSchemaModifier?: SanitizeSchemaModifier;
  };

  /** CodeMirror 拡張機能 (ハイライトやキーバインド等を追加する場合) */
  editorExtensions?: Extension[];
}

