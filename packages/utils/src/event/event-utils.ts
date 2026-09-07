/**
 * CustomEventOptions<T> は、カスタムイベントを作成する際に使用されるオプションの型定義
 */
export interface CustomEventOptions<T = unknown> {
  /** イベントとともに送信するペイロードデータ */
  detail?: T;
  /** DOMツリーを上方向にバブリング（伝播）させるか (デフォルト: true) */
  bubbles?: boolean;
  /** Shadow DOMの境界を越えて親要素へ伝播させるか (デフォルト: true) */
  composed?: boolean;
  /** event.preventDefault() によるキャンセルを許可するか (デフォルト: true) */
  cancelable?: boolean;
}

/**
 * 型安全な CustomEvent インスタンスを生成するユーティリティ
 *
 * @export
 * @template T
 * @param {string} eventName イベント名
 * @param {CustomEventOptions<T>} [options={}] オプション。detail, bubbles, composed, cancelable を指定可能
 * @return {*}  {CustomEvent<T>} 生成された CustomEvent インスタンス
 */
export function createCustomEvent<T = undefined>(
  eventName: string,
  options: CustomEventOptions<T> = {},
): CustomEvent<T> {
  const {
    detail,
    bubbles = true,
    composed = true,
    cancelable = true,
  } = options;

  return new CustomEvent<T>(eventName, {
    detail: detail as T,
    bubbles,
    composed,
    cancelable,
  });
}

/**
 * 指定した HTMLElement / LitElement からカスタムイベントを発火（dispatch）するユーティリティ
 *
 * @export
 * @template T
 * @param {HTMLElement} target イベントの発火元となる要素（this / HTMLElement）
 * @param {string} eventName イベント名
 * @param {CustomEventOptions<T>} [options={}] イベントオプション
 * @return {*}  {boolean} dispatchEvent の戻り値。イベントがキャンセルされた場合は false、それ以外は true
 * @example
 * // 例: detail にオブジェクトを渡す場合
 * dispatchCustomEvent<{ id: number; name: string }>(this, 'my-event', {
 *  detail: { id: 1, name: 'example' },
 *  bubbles: true,
 *  composed: true,
 *  cancelable: true,
 * });
 */
export function dispatchCustomEvent<T = undefined>(
  target: HTMLElement,
  eventName: string,
  options: CustomEventOptions<T> = {},
): boolean {
  const event = createCustomEvent<T>(eventName, options);
  return target.dispatchEvent(event);
}
