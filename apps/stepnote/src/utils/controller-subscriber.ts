import type { ReactiveController, ReactiveControllerHost } from "lit";

/**
 * 購読可能なコントローラーの最小インターフェース
 */
export interface SubscribableController {
  subscribe(listener: () => void): () => void;
}

/**
 * コンポーネント内のコントローラー購読を一元管理する ReactiveController。
 *
 * コントローラー差し替え時の旧購読解除・新購読登録、および
 * コンポーネント切断時（disconnectedCallback / hostDisconnected）の一括クリーンアップを担う。
 *
 * @export
 * @class ControllerSubscriber
 * @implements {ReactiveController}
 */
export class ControllerSubscriber implements ReactiveController {
  private readonly _unsubs: Map<string, () => void> = new Map();

  /**
   * Creates an instance of ControllerSubscriber.
   * @param {ReactiveControllerHost} host 連動する LitElement ホスト
   */
  constructor(private readonly host: ReactiveControllerHost) {
    this.host.addController(this);
  }

  /**
   * 指定したキーのコントローラー購読を更新する。
   * 既存の購読がある場合は解除し、新コントローラーが存在する場合は新規に購読を登録する。
   *
   * @template T
   * @param {string} key コントローラーの識別キー
   * @param {T | undefined} controller 購読対象のコントローラーインスタンス
   * @param {(() => void)} [onUpdate] 更新通知時のコールバック（省略時は host.requestUpdate()）
   */
  public subscribe<T extends SubscribableController>(
    key: string,
    controller: T | undefined,
    onUpdate?: () => void,
  ): void {
    this.unsubscribe(key);

    if (controller && typeof controller.subscribe === "function") {
      const unsub = controller.subscribe(() => {
        if (onUpdate) {
          onUpdate();
        } else {
          this.host.requestUpdate();
        }
      });
      this._unsubs.set(key, unsub);
    }
  }

  /**
   * 指定したキーの購読を明示的に解除する。
   *
   * @param {string} key コントローラーの識別キー
   */
  public unsubscribe(key: string): void {
    const unsub = this._unsubs.get(key);
    if (unsub) {
      unsub();
      this._unsubs.delete(key);
    }
  }

  /**
   * 保持しているすべてのコントローラー購読を一括解除する。
   */
  public unsubscribeAll(): void {
    for (const unsub of this._unsubs.values()) {
      unsub();
    }
    this._unsubs.clear();
  }

  /**
   * LitElement 切断ライフサイクルフック（切断時の自動クリーンアップ）
   */
  public hostDisconnected(): void {
    this.unsubscribeAll();
  }
}
