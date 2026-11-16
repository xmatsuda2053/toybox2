/**
 * ラベル一覧をラベル名（文字列）の昇順（五十音順・辞書順・自然順）でソートする純粋関数。
 *
 * `String.prototype.localeCompare` を使用し、日本語、アルファベット、
 * および数値を含む自然順（numeric: true）に対応する。
 * ラベル名が同一の場合は元の順序または ID 昇順で安定ソートする。
 *
 * @template T
 * @param {readonly T[]} labels ラベル一覧
 * @return {T[]} ソート済みの新しいラベル配列
 */
export function sortLabelsByNameAsc<T extends { name: string }>(
  labels: readonly T[],
): T[] {
  return [...labels].sort((a, b) =>
    a.name.localeCompare(b.name, "ja", {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

/**
 * ラベルテキスト要素が省略表示（...）されているかを判定する純粋関数。
 *
 * 非表示状態（clientWidth <= 0）の場合は常に false を返す。
 *
 * @param {number} scrollWidth 要素のコンテンツ全幅
 * @param {number} clientWidth 要素の可視幅
 * @return {boolean} 省略表示されている場合 true
 */
export function isLabelTextTruncated(
  scrollWidth: number,
  clientWidth: number,
): boolean {
  return clientWidth > 0 && scrollWidth > clientWidth;
}

/**
 * ラベルテキスト要素および wa-tooltip の紐づけに使用する一意の要素 ID を生成する純粋関数。
 *
 * @param {number | undefined} labelId ラベルレコードの ID
 * @param {number} index 一覧内の表示インデックス（ID 未採番時のフォールバック）
 * @return {string} 要素 ID
 */
export function getLabelTextElementId(
  labelId: number | undefined,
  index: number,
): string {
  return labelId !== undefined
    ? `label-text-${labelId}`
    : `label-text-idx-${index}`;
}
