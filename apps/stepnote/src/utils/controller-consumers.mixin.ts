import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import { consume } from "@lit/context";
import { labelsContext, taskContext } from "@/contexts/index.js";
import type { LabelsController } from "@/controllers/labels.controller";
import type { TaskController } from "@/controllers/task.controller";
import { ControllerSubscriber } from "./controller-subscriber.js";

/**
 * Mixin 適用対象のコンストラクタ型定義。
 * ※ TypeScript の Mixin 言語仕様（TS2545: A mixin class must have a constructor with a single rest parameter of type 'any[]'）
 * に準拠するため、引数型には any[] が必須となります。
 */
export type LitElementConstructor<T = SubscriberElement> = new (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => T;

/**
 * ControllerSubscriber を内包し、コントローラー購読ライフサイクルを一元管理する基底 LitElement クラス。
 *
 * @export
 * @class SubscriberElement
 * @extends {LitElement}
 */
export class SubscriberElement extends LitElement {
  public subscriber: ControllerSubscriber = new ControllerSubscriber(this);
}

/**
 * LabelsController を Lit Context 経由で受信・購読する Mixin。
 * コンポーネントにおける labelsController のプロパティ定義と購読ボイラープレートを集約する。
 *
 * @export
 * @template T
 * @param {T} Base 適用対象の SubscriberElement 派生クラス
 * @return {*}
 */
export function WithLabelsController<T extends LitElementConstructor>(Base: T) {
  class LabelsConsumerClass extends Base {
    private _labelsController?: LabelsController;

    /** ラベル管理コントローラー */
    public get labelsController(): LabelsController | undefined {
      return this._labelsController;
    }

    @consume({ context: labelsContext, subscribe: true })
    @property({ attribute: false })
    public set labelsController(controller: LabelsController | undefined) {
      this._labelsController = this.subscriber.bind(
        "labels",
        this._labelsController,
        controller,
      );
    }
  }
  return LabelsConsumerClass;
}

/**
 * TaskController を Lit Context 経由で受信・購読する Mixin。
 * コンポーネントにおける taskController のプロパティ定義と購読ボイラープレートを集約する。
 *
 * @export
 * @template T
 * @param {T} Base 適用対象の SubscriberElement 派生クラス
 * @return {*}
 */
export function WithTaskController<T extends LitElementConstructor>(Base: T) {
  class TaskConsumerClass extends Base {
    private _taskController?: TaskController;

    /** タスク管理コントローラー */
    public get taskController(): TaskController | undefined {
      return this._taskController;
    }

    @consume({ context: taskContext, subscribe: true })
    @property({ attribute: false })
    public set taskController(controller: TaskController | undefined) {
      this._taskController = this.subscriber.bind(
        "task",
        this._taskController,
        controller,
      );
    }
  }
  return TaskConsumerClass;
}
