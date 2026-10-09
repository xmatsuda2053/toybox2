/**
 * 要素がダークモード属性またはクラスを保持しているか判定する
 */
function isElementDark(element: HTMLElement): boolean | undefined {
  const theme = element.getAttribute("data-theme");
  if (theme === "dark") return true;
  if (theme === "light") return false;
  if (element.classList.contains("wa-dark")) return true;
  if (element.classList.contains("wa-light")) return false;
  return undefined;
}

/**
 * 対象要素の直接の親要素、または Shadow DOM 内の場合はホスト要素を取得する
 *
 * @param element 対象要素
 * @returns 親要素またはホスト要素。存在しない場合は null
 */
export function getParentOrHost(
  element: HTMLElement | null | undefined,
): HTMLElement | null {
  if (!element) return null;
  if (element.parentElement) return element.parentElement;

  const root = element.getRootNode?.();
  if (root && root !== element && "host" in root) {
    return (root as ShadowRoot).host as HTMLElement;
  }

  return null;
}

/**
 * 祖先要素を辿ってテーマ（ダーク/ライト）を検知する
 */
function detectFromAncestors(element: HTMLElement): boolean | undefined {
  let current = getParentOrHost(element);
  while (current) {
    const result = isElementDark(current);
    if (result !== undefined) return result;
    current = getParentOrHost(current);
  }
  return undefined;
}

/**
 * document または body 要素からテーマ（ダーク/ライト）を検知する
 */
function detectFromDocument(): boolean | undefined {
  if (typeof document === "undefined") return undefined;

  const rootResult = isElementDark(document.documentElement);
  if (rootResult !== undefined) return rootResult;

  if (document.body) {
    return isElementDark(document.body);
  }

  return undefined;
}

/**
 * 現在の実行環境（祖先要素、ルート要素、OS設定）からダークモードかどうかを判定する
 *
 * @param element 判定対象の要素（任意）。要素自身のローカル属性ではなく親・祖先要素を辿って判定します。
 * @returns ダークモードの場合は true
 */
export function detectIsDarkMode(element?: HTMLElement): boolean {
  if (element) {
    const ancestorResult = detectFromAncestors(element);
    if (ancestorResult !== undefined) return ancestorResult;
  }

  const documentResult = detectFromDocument();
  if (documentResult !== undefined) return documentResult;

  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  return false;
}

/**
 * document.documentElement のテーマ属性（data-theme, class）の変更を監視する
 *
 * @param callback テーマ変更時に呼び出されるコールバック関数
 * @returns 監視を解除するクリーンアップ関数
 */
export function observeThemeChanges(
  callback: (isDark: boolean) => void,
): () => void {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return () => {};
  }

  const observer = new MutationObserver(() => {
    callback(detectIsDarkMode());
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "class"],
  });

  return () => observer.disconnect();
}

/**
 * 対象のホスト要素にダークモード／ライトモードの属性（data-theme）およびクラス（wa-dark / wa-light）を同期する
 *
 * @param element 対象要素
 * @param isDark ダークモード有効フラグ
 */
export function syncHostTheme(element: HTMLElement, isDark: boolean): void {
  const targetTheme = isDark ? "dark" : "light";

  if (typeof element.getAttribute === "function" && element.getAttribute("data-theme") !== targetTheme) {
    element.setAttribute("data-theme", targetTheme);
  }
  if (element.classList) {
    if (isDark) {
      element.classList.add("wa-dark");
      element.classList.remove("wa-light");
    } else {
      element.classList.remove("wa-dark");
      element.classList.add("wa-light");
    }
  }
}
