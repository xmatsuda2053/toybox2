/**
 * cancel および flush メソッドの型補完を効かせるためのインターフェース
 * @template T - 元の関数の型
 * @property {(...args: Parameters<T>) => void} (...args: Parameters<T>) - 元の関数と同じ引数を受け取る関数
 * @property {() => void} cancel - 待機中の実行をキャンセルするメソッド
 * @property {() => void} flush - 待機中の実行があれば直ちに実行するメソッド
 */
export interface DebouncedFunction<T extends (...args: never[]) => unknown> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
}

/**
 * 指定された時間（ms）、実行を待機させるデバウンス関数
 * @template T - 元の関数の型
 * @param func 実行したい関数
 * @param wait 待機時間（ミリ秒）
 * @returns デバウンス処理された関数
 * @example
 * const debouncedFn = debounce((msg: string) => console.log(msg), 200);
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number,
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  // 実際に実行されるメイン関数
  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (lastArgs) {
        func(...lastArgs);
        lastArgs = null;
      }
      timeout = null;
    }, wait);
  }) as DebouncedFunction<T>;

  // タイマーを外部から破棄する
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = null;
  };

  // 待機中の処理を即座に実行する
  debounced.flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (lastArgs) {
      const argsToExecute = lastArgs;
      lastArgs = null;
      func(...argsToExecute);
    }
  };

  return debounced;
}
