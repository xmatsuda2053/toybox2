/**
 * Markdown リンク種別
 * - url: Web URL や標準 URI スキーム (https://, http://, mailto: 等)
 * - path: ローカル・ネットワークのフォルダパス・ファイルパス (C:\..., \\server\..., file://... 等)
 * - text: 上記以外の任意のコピー用テキスト
 */
export type MarkdownLinkType = "url" | "path" | "text";

/**
 * Markdown リンクの視覚判別メタ情報
 */
export interface MarkdownLinkMeta {
  readonly type: MarkdownLinkType;
  readonly icon: string;
  readonly title: string;
}

const URL_SCHEME_PATTERN = /^(?:https?|ftp|mailto|tel):|^www\./i;
const PATH_PATTERN =
  /^(?:file:\/\/|[a-zA-Z]:[\\/]|\\\\[^\\]+|\/|~\/|\.\/|\.\.\/)/i;

const LINK_META_CONFIG: Record<
  MarkdownLinkType,
  { readonly icon: string; readonly labelPrefix: string }
> = {
  url: { icon: "link-solid-full", labelPrefix: "[URL]" },
  path: { icon: "folder-solid-full", labelPrefix: "[フォルダパス]" },
  text: { icon: "copy-solid-full", labelPrefix: "[テキスト]" },
};

/**
 * リンクの href 文字列を安全に URI デコードする純粋関数
 */
export function decodeLinkHref(href: string): string {
  try {
    return decodeURI(href);
  } catch {
    return href;
  }
}

/**
 * リンクの href（デコード後文字列）からリンク種別（url / path / text）を判定する純粋関数
 */
export function classifyMarkdownLinkType(href: string): MarkdownLinkType {
  const decoded = decodeLinkHref(href).trim();
  if (URL_SCHEME_PATTERN.test(decoded)) {
    return "url";
  }
  if (PATH_PATTERN.test(decoded)) {
    return "path";
  }
  return "text";
}

/**
 * リンクの href から視覚判別用のメタ情報（種別・アイコン名・title 属性文字列）を解決する純粋関数
 */
export function resolveMarkdownLinkMeta(href: string): MarkdownLinkMeta {
  const decoded = decodeLinkHref(href).trim();
  const type = classifyMarkdownLinkType(decoded);
  const config = LINK_META_CONFIG[type];
  return {
    type,
    icon: config.icon,
    title: `${config.labelPrefix} ${decoded}`,
  };
}

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
