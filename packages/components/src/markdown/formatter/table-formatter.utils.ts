/**
 * テーブルフォーマッター ユーティリティ
 *
 * Markdown テーブル内の全角文字（日本語等）の表示幅を計算し、
 * パイプ（|）の位置を縦一列に揃えてきれいに整形する純粋関数群。
 */

export type ColumnAlignment = "left" | "center" | "right" | "none";

/**
 * 1文字あたりの表示幅を計算する（半角=1, 全角=2, 制御文字=0）
 */
export function getCharacterWidth(char: string): number {
  const code = char.codePointAt(0);
  if (code === undefined) {
    return 0;
  }
  // 半角ASCIIおよび半角カナ
  if (
    (code >= 0x0020 && code <= 0x007e) ||
    (code >= 0xff61 && code <= 0xff9f)
  ) {
    return 1;
  }
  // 制御文字
  if (code < 0x0020 || (code >= 0x007f && code <= 0x009f)) {
    return 0;
  }
  // 全角文字（CJK統合漢字、ひらがな、カタカナ、全角英数・記号等）
  return 2;
}

/**
 * 文字列の合計表示幅を計算する
 */
export function getStringDisplayWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += getCharacterWidth(char);
  }
  return width;
}

/**
 * セパレータセルのアライメント（:---, :---:, ---:, ---）を判定する
 */
export function parseSeparatorCell(cell: string): ColumnAlignment | null {
  const trimmed = cell.trim();
  if (!/^:?-+:?$/.test(trimmed)) {
    return null;
  }
  const startsWithColon = trimmed.startsWith(":");
  const endsWithColon = trimmed.endsWith(":");

  if (startsWithColon && endsWithColon) {
    return "center";
  }
  if (startsWithColon) {
    return "left";
  }
  if (endsWithColon) {
    return "right";
  }
  return "none";
}

/**
 * テーブルの1行を行構文としてパースし、各セルの文字列配列を返す
 */
export function parseTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|") || trimmed.length < 2) {
    return null;
  }

  const inner = trimmed.slice(1, -1);
  const rawCells: string[] = [];
  let current = "";
  let isEscaped = false;

  for (let i = 0; i < inner.length; i++) {
    const char = inner[i];
    if (isEscaped) {
      current += char;
      isEscaped = false;
    } else if (char === "\\") {
      current += char;
      isEscaped = true;
    } else if (char === "|") {
      rawCells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  rawCells.push(current.trim());

  return rawCells;
}

/**
 * アライメントと指定幅に応じたセパレータ文字列を生成する
 */
export function formatSeparatorCell(align: ColumnAlignment, width: number): string {
  if (align === "center") {
    const dashes = Math.max(1, width - 2);
    return `:${"-".repeat(dashes)}:`;
  }
  if (align === "left") {
    const dashes = Math.max(1, width - 1);
    return `:${"-".repeat(dashes)}`;
  }
  if (align === "right") {
    const dashes = Math.max(1, width - 1);
    return `${"-".repeat(dashes)}:`;
  }
  return "-".repeat(Math.max(1, width));
}

/**
 * 指定されたアライメントと幅に合わせてセル文字列をパディングする
 */
export function padCellContent(content: string, width: number, align: ColumnAlignment): string {
  const contentWidth = getStringDisplayWidth(content);
  const totalPadding = Math.max(0, width - contentWidth);

  if (align === "right") {
    return " ".repeat(totalPadding) + content;
  }
  if (align === "center") {
    const leftPad = Math.floor(totalPadding / 2);
    const rightPad = totalPadding - leftPad;
    return " ".repeat(leftPad) + content + " ".repeat(rightPad);
  }
  return content + " ".repeat(totalPadding);
}

/**
 * セパレータセル群から各列のアライメント一覧を抽出する
 */
export function extractAlignments(separatorCells: string[], numColumns: number): ColumnAlignment[] {
  const alignments: ColumnAlignment[] = [];
  for (let col = 0; col < numColumns; col++) {
    const cell = separatorCells[col] ?? "";
    alignments.push(parseSeparatorCell(cell) ?? "none");
  }
  return alignments;
}

/**
 * 各列の必要表示幅（データ最大幅とアライメント最小幅の大きい方）を計算する
 */
export function computeColumnWidths(
  tableRows: string[][],
  alignments: ColumnAlignment[],
  numColumns: number
): number[] {
  const columnWidths: number[] = [];

  for (let col = 0; col < numColumns; col++) {
    let minWidth = 3;
    const align = alignments[col] ?? "none";
    if (align === "center") minWidth = 5;
    else if (align === "left" || align === "right") minWidth = 4;

    let maxWidth = minWidth;
    for (const row of tableRows) {
      const cell = row[col] ?? "";
      const cellWidth = getStringDisplayWidth(cell);
      if (cellWidth > maxWidth) {
        maxWidth = cellWidth;
      }
    }
    columnWidths.push(maxWidth);
  }

  return columnWidths;
}

/**
 * 単一のテーブルブロック行配列を縦揃え整形する
 */
export function formatSingleTableBlock(rawLines: string[]): string[] {
  const parsedRows: string[][] = [];
  let separatorIndex = -1;

  for (let i = 0; i < rawLines.length; i++) {
    const row = parseTableRow(rawLines[i]);
    if (!row) return rawLines;
    parsedRows.push(row);
    if (separatorIndex === -1 && row.every((c) => parseSeparatorCell(c) !== null)) {
      separatorIndex = i;
    }
  }

  if (separatorIndex === -1) {
    return rawLines;
  }

  const numColumns = Math.max(...parsedRows.map((r) => r.length));
  const alignments = extractAlignments(parsedRows[separatorIndex], numColumns);
  const dataRows = parsedRows.filter((_, idx) => idx !== separatorIndex);
  const columnWidths = computeColumnWidths(dataRows, alignments, numColumns);

  return parsedRows.map((row, idx) => {
    if (idx === separatorIndex) {
      const sepCells = alignments.map((align, col) => formatSeparatorCell(align, columnWidths[col]));
      return `| ${sepCells.join(" | ")} |`;
    }
    const paddedCells = row.map((cell, col) => padCellContent(cell, columnWidths[col], alignments[col] ?? "none"));
    return `| ${paddedCells.join(" | ")} |`;
  });
}

/**
 * Markdown テキスト内の全テーブルブロックを検出し、日本語表示幅に対応した縦揃えフォーマットを行う
 */
export function formatMarkdownTables(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let currentTableLines: string[] = [];

  const flushTable = () => {
    if (currentTableLines.length > 0) {
      result.push(...formatSingleTableBlock(currentTableLines));
      currentTableLines = [];
    }
  };

  for (const line of lines) {
    if (parseTableRow(line) !== null) {
      currentTableLines.push(line);
    } else {
      flushTable();
      result.push(line);
    }
  }
  flushTable();

  return result.join("\n");
}
