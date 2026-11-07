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
