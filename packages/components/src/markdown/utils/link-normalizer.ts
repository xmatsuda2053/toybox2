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
 * [label]( の直後から、バランスした対応する閉じ括弧 ) のインデックスを探索する純粋関数
 *
 * @param text 対象テキスト
 * @param startIndex URL走査開始インデックス
 * @returns 終端閉じ括弧のインデックス（未検出時は -1）
 */
function findMatchingClosingParenIndex(text: string, startIndex: number): number {
  let openCount = 1;
  let isEscaped = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    if (char === "\n") return -1;

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === "\\") {
      isEscaped = true;
      continue;
    }

    if (char === "(") {
      openCount++;
    } else if (char === ")") {
      openCount--;
      if (openCount === 0) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * 単一のリンクURL内容をスペース・エスケープ・CommonMark仕様に応じて正規化する純粋関数
 *
 * @param label リンクテキスト
 * @param rawUrl 生のURLまたはパス文字列
 * @returns 正規化後の [label](url) 文字列
 */
function formatNormalizedLink(label: string, rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return `[${label}](${rawUrl})`;
  }
  if (/["']/.test(trimmed)) {
    return `[${label}](${rawUrl})`;
  }

  const escaped = trimmed.replace(/\\/g, "\\\\");
  if (escaped.includes(" ")) {
    return `[${label}](<${escaped}>)`;
  }
  if (escaped !== trimmed) {
    return `[${label}](${escaped})`;
  }
  return `[${label}](${rawUrl})`;
}

/**
 * Markdown テキスト内のスペースやバックスラッシュを含むリンク記法を正規化する純粋関数
 *
 * CommonMark では [text](url) の url にスペースが含まれる場合は構文エラーとなり、
 * バックスラッシュ（Windows パス等）が含まれる場合はエスケープシーケンスとして解釈される。
 * 入力された Markdown 内のリンク URL に対してバックスラッシュのエスケープおよび
 * スペースを含む場合の <url> 形式への補正を行う。
 * また、URL内の半角括弧 (...) のネストバランスを正しく考慮して終端を検出する。
 *
 * @param markdown 入力 Markdown 文字列
 * @returns 補正後の Markdown 文字列
 */
export function normalizeMarkdownLinksWithSpaces(markdown: string): string {
  if (!markdown || !markdown.includes("](")) {
    return markdown;
  }

  let result = "";
  let currentIndex = 0;
  const linkStartPattern = /\[([^\]\n]+)\]\(/g;
  let match: RegExpExecArray | null;

  while ((match = linkStartPattern.exec(markdown)) !== null) {
    const matchStart = match.index;
    const label = match[1];
    const urlStartIndex = matchStart + match[0].length;

    const closingIndex = findMatchingClosingParenIndex(markdown, urlStartIndex);
    if (closingIndex === -1) {
      continue;
    }

    result += markdown.slice(currentIndex, matchStart);
    const rawUrl = markdown.slice(urlStartIndex, closingIndex);
    result += formatNormalizedLink(label, rawUrl);

    currentIndex = closingIndex + 1;
    linkStartPattern.lastIndex = currentIndex;
  }

  result += markdown.slice(currentIndex);
  return result;
}
