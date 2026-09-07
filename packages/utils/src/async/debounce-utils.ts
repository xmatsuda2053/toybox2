/**
 * cancel メソッドの型補完を効かせるためのインターフェース
 * @template T - 元の関数の型
 * @property {(...args: Parameters<T>) => void} (...args: Parameters<T>) - 元の関数と同じ引数を受け取る関数
 * @property {() => void} cancel - 待機中の実行をキャンセルするメソッド
 */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

/**
 * 指定された時間（ms）、実行を待機させるデバウンス関数
 * @param func 実行したい関数
 * @param wait 待機時間（ミリ秒）
 * @returns デバウンス処理された関数
 * @example
 * const debouncedFn = debounce((msg: string) => console.log(msg), 200);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  // 実際に実行されるメイン関数
  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };

  // タイマーを外部から破棄する
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}
