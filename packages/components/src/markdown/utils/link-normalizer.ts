/**
 * Markdown テキスト内のスペースやバックスラッシュを含むリンク記法を正規化する純粋関数
 *
 * CommonMark では [text](url) の url にスペースが含まれる場合は構文エラーとなり、
 * バックスラッシュ（Windows パス等）が含まれる場合はエスケープシーケンスとして解釈される。
 * 入力された Markdown 内のリンク URL に対してバックスラッシュのエスケープおよび
 * スペースを含む場合の <url> 形式への補正を行う。
 *
 * @param markdown 入力 Markdown 文字列
 * @returns 補正後の Markdown 文字列
 */
export function normalizeMarkdownLinksWithSpaces(markdown: string): string {
  if (!markdown || !markdown.includes("](")) {
    return markdown;
  }

  return markdown.replace(
    /\[([^\]]+)\]\(([^)\n]+)\)/g,
    (match, label: string, urlContent: string) => {
      const trimmedUrl = urlContent.trim();
      if (trimmedUrl.startsWith("<") && trimmedUrl.endsWith(">")) {
        return match;
      }
      if (/["']/.test(trimmedUrl)) {
        return match;
      }

      const escapedUrl = trimmedUrl.replace(/\\/g, "\\\\");
      if (escapedUrl.includes(" ")) {
        return `[${label}](<${escapedUrl}>)`;
      }
      if (escapedUrl !== trimmedUrl) {
        return `[${label}](${escapedUrl})`;
      }
      return match;
    },
  );
}
