import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { LayoutState } from "@/types/view/ui.types";

/**
 * 画面全体のレイアウト状態（各パネル・ドロワーの開閉フラグ）を管理する Reactive Controller
 *
 * @export
 * @class LayoutUIController
 * @implements {ReactiveController}
 */
export class LayoutUIController implements ReactiveController {
  /**
   * このコントローラーを保持する Lit コンポーネントのホスト参照
   *
   * @private
   * @type {ReactiveControllerHost}
   * @memberof LayoutUIController
   */
  private host: ReactiveControllerHost;

  /**
   * 画面開閉の状態を保持するステートオブジェクト
   *
   * @type {LayoutState}
   * @memberof LayoutUIController
   */
  public state: LayoutState = {
    isQuickAccessOpen: true,
    isArea1Open: true,
    isArea2Open: true,
  };

  /**
   * Creates an instance of LayoutUIController.
   * @param {ReactiveControllerHost} host
   * @memberof LayoutUIController
   */
  constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.host.addController(this);
  }

  /**
   * QUICK ACCESS の 開閉状態を反転させ、ホストへ再描画を要求する。
   *
   * @memberof LayoutUIController
   */
  public toggleQuickAccess(): void {
    this.state.isQuickAccessOpen = !this.state.isQuickAccessOpen;
    this.host.requestUpdate();
  }

  /**
   * エリア1の開閉状態を反転させ、ホストへ再描画を要求する。
   *
   * @memberof LayoutUIController
   */
  public toggleArea1(): void {
    this.state.isArea1Open = !this.state.isArea1Open;
    this.host.requestUpdate();
  }

  /**
   * エリア2の開閉状態を反転させ、ホストへ再描画を要求する。
   *
   * @memberof LayoutUIController
   */
  public toggleArea2(): void {
    this.state.isArea2Open = !this.state.isArea2Open;
    this.host.requestUpdate();
  }

  /**
   * QUICK ACCESS の 開閉状態を明示的に設定し、ホストへ再描画を要求する。
   *
   * @param {boolean} isOpen
   * @memberof LayoutUIController
   */
  public setQuickAccessOpen(isOpen: boolean): void {
    if (this.state.isQuickAccessOpen === isOpen) return;
    this.state.isQuickAccessOpen = isOpen;
    this.host.requestUpdate();
  }

  /**
   * エリア1 の 開閉状態を明示的に設定し、ホストへ再描画を要求する。
   *
   * @param {boolean} isOpen
   * @memberof LayoutUIController
   */
  public setArea1Open(isOpen: boolean): void {
    if (this.state.isArea1Open === isOpen) return;
    this.state.isArea1Open = isOpen;
    this.host.requestUpdate();
  }

  /**
   * エリア2 の 開閉状態を明示的に設定し、ホストへ再描画を要求する。
   *
   * @param {boolean} isOpen
   * @memberof LayoutUIController
   */
  public setArea2Open(isOpen: boolean): void {
    if (this.state.isArea2Open === isOpen) return;
    this.state.isArea2Open = isOpen;
    this.host.requestUpdate();
  }

  hostConnected(): void {}
  hostDisconnected(): void {}
}
