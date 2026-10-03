import type { Pluggable, Processor } from "unified";
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
