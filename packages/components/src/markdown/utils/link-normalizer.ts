/**
 * Markdown テキスト内のスペースを含むリンク記法を正規化する純粋関数
 *
 * CommonMark では [text](url) の url にスペースが含まれる場合、
 * 通常は構文エラーとなるが、山括弧 <url> で囲むことで許容される。
 * 入力された Markdown 内のスペースを含むリンク URL を自動で <url> 形式に補正する。
 *
 * @param markdown 入力 Markdown 文字列
 * @returns 補正後の Markdown 文字列
 */
export function normalizeMarkdownLinksWithSpaces(markdown: string): string {
  if (!markdown || !markdown.includes("](")) {
    return markdown;
  }

  // [text](url) の形式で、url にスペースが含まれ、かつ山括弧で囲まれていないものを置換
  return markdown.replace(
    /\[([^\]]+)\]\(([^)\n]+)\)/g,
    (match, label: string, urlContent: string) => {
      const trimmedUrl = urlContent.trim();
      // 既に <...> で囲まれている場合はそのまま
      if (trimmedUrl.startsWith("<") && trimmedUrl.endsWith(">")) {
        return match;
      }
      // スペースが含まれている場合
      if (trimmedUrl.includes(" ")) {
        // タイトルクォート（"title" や 'title'）が明示されている場合は除外
        const hasQuote = /["']/.test(trimmedUrl);
        if (!hasQuote) {
          return `[${label}](<${trimmedUrl}>)`;
        }
      }
      return match;
    },
  );
}
