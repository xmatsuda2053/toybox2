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
 * 現在の実行環境（祖先要素、ルート要素、OS設定）からダークモードかどうかを判定する
 *
 * @param element 判定対象の要素（任意）。要素自身のローカル属性ではなく親・祖先要素を辿って判定します。
 * @returns ダークモードの場合は true
 */
export function detectIsDarkMode(element?: HTMLElement): boolean {
  if (element) {
    let current: HTMLElement | null =
      element.parentElement ??
      ((element as any).getRootNode?.() as ShadowRoot)?.host as HTMLElement ??
      null;

    while (current) {
      const parentResult = isElementDark(current);
      if (parentResult !== undefined) return parentResult;

      current =
        current.parentElement ??
        ((current as any).getRootNode?.() as ShadowRoot)?.host as HTMLElement ??
        null;
    }
  }

  if (typeof document !== "undefined") {
    const rootResult = isElementDark(document.documentElement);
    if (rootResult !== undefined) return rootResult;

    if (document.body) {
      const bodyResult = isElementDark(document.body);
      if (bodyResult !== undefined) return bodyResult;
    }
  }

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
