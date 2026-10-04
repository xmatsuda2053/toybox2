import type { MarkdownActionType } from "./markdown-editor.js";

/**
 * 囲み構文挿入結果
 */
export interface SurroundingSyntaxResult {
  /** 挿入されるテキスト */
  insertText: string;
  /** 挿入後の選択開始オフセット */
  anchor: number;
  /** 挿入後の選択終了オフセット */
  head: number;
}

/**
 * エディタ未初期化時（または Node.js テスト環境）のフォールバック構文テキストを生成する
 *
 * @param action Markdown アクション種別
 * @param currentText 現在のテキスト値
 * @returns 挿入後のテキスト
 */
export function getFallbackMarkdownText(
  action: MarkdownActionType,
  currentText = "",
): string {
  switch (action) {
    case "bold":
      return currentText ? `**${currentText}**` : "**太字**";
    case "italic":
      return currentText ? `*${currentText}*` : "*斜体*";
    case "heading":
      return `### ${currentText || "見出し"}`;
    case "bullet-list":
      return `- ${currentText || "項目"}`;
    case "ordered-list":
      return `1. ${currentText || "項目"}`;
    case "task-list":
      return `- [ ] ${currentText || "タスク"}`;
    case "quote":
      return `> ${currentText || "引用文"}`;
    case "code":
      return currentText ? `\`${currentText}\`` : "`コード`";
    case "link":
      return `[${currentText || "リンク"}](url)`;
    case "table":
      return `${currentText ? currentText + "\n\n" : ""}| 列1 | 列2 | 列3 |\n| :--- | :--- | :--- |\n| 項目1 | 項目2 | 項目3 |\n`;
  }
}

/**
 * 行頭に付与するプレフィックス文字列を取得する。
 * 行頭装飾アクションでない場合は null を返す。
 *
 * @param action Markdown アクション種別
 * @returns 行頭プレフィックス文字列、または null
 */
export function getLinePrefixForAction(
  action: MarkdownActionType,
): string | null {
  switch (action) {
    case "heading":
      return "### ";
    case "bullet-list":
      return "- ";
    case "ordered-list":
      return "1. ";
    case "task-list":
      return "- [ ] ";
    case "quote":
      return "> ";
    default:
      return null;
  }
}

/**
 * 選択テキストに対する囲み構文テキストおよび選択カーソル位置を計算する
 *
 * @param action Markdown アクション種別
 * @param selectedText 選択中のテキスト文字列
 * @param from 選択開始オフセット
 * @param to 選択終了オフセット
 * @param isPrecededByNewline 直前の文字が改行かどうか（table のみ使用）
 * @returns 挿入テキストとカーソル位置
 */
function formatBold(
  selectedText: string,
  from: number,
  to: number,
): SurroundingSyntaxResult {
  if (selectedText) {
    return {
      insertText: `**${selectedText}**`,
      anchor: from + 2,
      head: to + 2,
    };
  }
  return {
    insertText: "**太字**",
    anchor: from + 2,
    head: from + 4,
  };
}

function formatItalic(
  selectedText: string,
  from: number,
  to: number,
): SurroundingSyntaxResult {
  if (selectedText) {
    return {
      insertText: `*${selectedText}*`,
      anchor: from + 1,
      head: to + 1,
    };
  }
  return {
    insertText: "*斜体*",
    anchor: from + 1,
    head: from + 3,
  };
}

function formatCode(
  selectedText: string,
  from: number,
  to: number,
): SurroundingSyntaxResult {
  if (selectedText.includes("\n")) {
    return {
      insertText: `\`\`\`\n${selectedText}\n\`\`\``,
      anchor: from + 4,
      head: to + 4,
    };
  }
  if (selectedText) {
    return {
      insertText: `\`${selectedText}\``,
      anchor: from + 1,
      head: to + 1,
    };
  }
  return {
    insertText: "`コード`",
    anchor: from + 1,
    head: from + 4,
  };
}

function formatLink(
  selectedText: string,
  from: number,
  to: number,
): SurroundingSyntaxResult {
  if (selectedText) {
    return {
      insertText: `[${selectedText}](url)`,
      anchor: to + 3,
      head: to + 6,
    };
  }
  return {
    insertText: "[リンク](url)",
    anchor: from + 1,
    head: from + 4,
  };
}

function formatTable(
  from: number,
  isPrecededByNewline: boolean,
): SurroundingSyntaxResult {
  const prefix = isPrecededByNewline ? "" : "\n\n";
  const insertText = `${prefix}| 列1 | 列2 | 列3 |\n| :--- | :--- | :--- |\n| 項目1 | 項目2 | 項目3 |\n`;
  const pos = from + insertText.length;
  return {
    insertText,
    anchor: pos,
    head: pos,
  };
}

/**
 * 選択テキストに対する囲み構文テキストおよび選択カーソル位置を計算する
 *
 * @param action Markdown アクション種別
 * @param selectedText 選択中のテキスト文字列
 * @param from 選択開始オフセット
 * @param to 選択終了オフセット
 * @param isPrecededByNewline 直前の文字が改行かどうか（table のみ使用）
 * @returns 挿入テキストとカーソル位置
 */
export function getSurroundingSyntax(
  action: MarkdownActionType,
  selectedText: string,
  from: number,
  to: number,
  isPrecededByNewline = true,
): SurroundingSyntaxResult {
  switch (action) {
    case "bold":
      return formatBold(selectedText, from, to);
    case "italic":
      return formatItalic(selectedText, from, to);
    case "code":
      return formatCode(selectedText, from, to);
    case "link":
      return formatLink(selectedText, from, to);
    case "table":
      return formatTable(from, isPrecededByNewline);
    default:
      return {
        insertText: "",
        anchor: from,
        head: to,
      };
  }
}

