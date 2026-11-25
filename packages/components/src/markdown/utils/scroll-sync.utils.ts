/**
 * スプリットモード時の Markdown エディタ ↔ プレビュー間スクロール同期用純粋関数群
 */

export type EditorPositionSource = "cursor" | "scroll";

export interface EditorScrollPosition {
  /** 通知のトリガー種別 ("cursor": 入力・カーソル移動, "scroll": スクロール操作) */
  readonly source: EditorPositionSource;
  /** 対象のソース行番号（1始まり） */
  readonly lineNumber: number;
  /** エディタ表示領域上端からの相対 Y 位置割合 (0.0〜1.0) */
  readonly viewportRatio: number;
  /** エディタ全体のスクロール位置割合 (0.0〜1.0) */
  readonly scrollRatio: number;
  /** ドキュメント総行数 */
  readonly totalLines: number;
}

export interface SourceLineOffset {
  /** ソース行番号（1始まり） */
  readonly line: number;
  /** プレビューコンテナ先頭からの Y 座標（px） */
  readonly offsetTop: number;
}

export interface ComputePreviewScrollParams {
  readonly position: EditorScrollPosition;
  readonly anchors: readonly SourceLineOffset[];
  readonly previewScrollHeight: number;
  readonly previewClientHeight: number;
}

/**
 * 数値を指定範囲 [min, max] に制限する純粋関数
 */
export function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * コンテナ要素が内部スクロール可能な固定サイズ状態かどうかを判定する純粋関数。
 * 内容に合わせて高さが伸びるレイアウトでは scrollHeight <= clientHeight となるため false を返す。
 */
export function canScrollContainer(
  scrollHeight: number,
  clientHeight: number,
): boolean {
  if (clientHeight <= 0) return false;
  return scrollHeight > clientHeight + 1;
}

/**
 * 2点間（行番号と Y 座標）を線形補間する純粋関数
 */
function interpolateLinearY(
  targetLine: number,
  startLine: number,
  startY: number,
  endLine: number,
  endY: number,
): number {
  const span = endLine - startLine;
  if (span <= 0) return startY;
  const ratio = clampNumber((targetLine - startLine) / span, 0, 1);
  return startY + (endY - startY) * ratio;
}

/**
 * ソース行番号に対応するプレビュー内のドキュメント Y 座標をアンカー配列から補間算出する純粋関数
 */
export function interpolateTargetDocumentY(
  lineNumber: number,
  anchors: readonly SourceLineOffset[],
  previewScrollHeight: number,
  totalLines: number,
): number {
  if (anchors.length === 0) return 0;

  const first = anchors[0];
  if (lineNumber <= first.line) {
    if (lineNumber === first.line || first.line <= 1) {
      return first.offsetTop;
    }
    return interpolateLinearY(lineNumber, 1, 0, first.line, first.offsetTop);
  }

  for (let i = 0; i < anchors.length - 1; i++) {
    const curr = anchors[i];
    const next = anchors[i + 1];
    if (lineNumber === curr.line) return curr.offsetTop;
    if (lineNumber < next.line) {
      return interpolateLinearY(
        lineNumber,
        curr.line,
        curr.offsetTop,
        next.line,
        next.offsetTop,
      );
    }
  }

  const last = anchors[anchors.length - 1];
  if (lineNumber === last.line || totalLines <= last.line) {
    return last.offsetTop;
  }
  return interpolateLinearY(
    lineNumber,
    last.line,
    last.offsetTop,
    totalLines,
    previewScrollHeight,
  );
}

/**
 * エディタ位置情報とプレビュー要素の計測値から、プレビュー側の目標 scrollTop を算出する純粋関数。
 * 内部スクロール不可の状態では null を返す。
 */
export function computeTargetPreviewScrollTop(
  params: ComputePreviewScrollParams,
): number | null {
  const { position, anchors, previewScrollHeight, previewClientHeight } =
    params;
  if (!canScrollContainer(previewScrollHeight, previewClientHeight)) {
    return null;
  }

  const maxScrollTop = Math.max(0, previewScrollHeight - previewClientHeight);
  if (anchors.length === 0) {
    return Math.round(clampNumber(position.scrollRatio, 0, 1) * maxScrollTop);
  }

  const targetDocY = interpolateTargetDocumentY(
    position.lineNumber,
    anchors,
    previewScrollHeight,
    position.totalLines,
  );

  const rawScrollTop =
    position.source === "cursor"
      ? targetDocY -
        clampNumber(position.viewportRatio, 0, 1) * previewClientHeight
      : targetDocY;

  return Math.round(clampNumber(rawScrollTop, 0, maxScrollTop));
}
