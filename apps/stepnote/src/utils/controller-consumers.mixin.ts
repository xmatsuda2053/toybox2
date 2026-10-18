import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import { consume } from "@lit/context";
import {
  labelsContext,
  taskContext,
  issuesContext,
  notesContext,
  logsContext,
  layoutUIContext,
  scratchContext,
} from "@/contexts/index.js";
import type { LabelsController } from "@/controllers/labels.controller";
import type { TaskController } from "@/controllers/task.controller";
import type { IssuesController } from "@/controllers/issues.controller";
import type { NotesController } from "@/controllers/notes.controller";
import type { LogsController } from "@/controllers/logs.controller";
import type { LayoutUIController } from "@/controllers/layout-ui.controller";
import type { ScratchController } from "@/controllers/scratch.controller";
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

/**
 * IssuesController を Lit Context 経由で受信・購読する Mixin。
 * コンポーネントにおける issuesController のプロパティ定義と購読ボイラープレートを集約する。
 *
 * @export
 * @template T
 * @param {T} Base 適用対象の SubscriberElement 派生クラス
 * @return {*}
 */
export function WithIssuesController<T extends LitElementConstructor>(Base: T) {
  class IssuesConsumerClass extends Base {
    private _issuesController?: IssuesController;

    /** 課題（サブタスク）管理コントローラー */
    public get issuesController(): IssuesController | undefined {
      return this._issuesController;
    }

    @consume({ context: issuesContext, subscribe: true })
    @property({ attribute: false })
    public set issuesController(controller: IssuesController | undefined) {
      this._issuesController = this.subscriber.bind(
        "issues",
        this._issuesController,
        controller,
      );
    }
  }
  return IssuesConsumerClass;
}

/**
 * NotesController を Lit Context 経由で受信・購読する Mixin。
 * コンポーネントにおける notesController のプロパティ定義と購読ボイラープレートを集約する。
 *
 * @export
 * @template T
 * @param {T} Base 適用対象の SubscriberElement 派生クラス
 * @return {*}
 */
export function WithNotesController<T extends LitElementConstructor>(Base: T) {
  class NotesConsumerClass extends Base {
    private _notesController?: NotesController;

    /** メモ管理コントローラー */
    public get notesController(): NotesController | undefined {
      return this._notesController;
    }

    @consume({ context: notesContext, subscribe: true })
    @property({ attribute: false })
    public set notesController(controller: NotesController | undefined) {
      this._notesController = this.subscriber.bind(
        "notes",
        this._notesController,
        controller,
      );
    }
  }
  return NotesConsumerClass;
}

/**
 * LogsController を Lit Context 経由で受信・購読する Mixin。
 * コンポーネントにおける logsController のプロパティ定義と購読ボイラープレートを集約する。
 *
 * @export
 * @template T
 * @param {T} Base 適用対象の SubscriberElement 派生クラス
 * @return {*}
 */
export function WithLogsController<T extends LitElementConstructor>(Base: T) {
  class LogsConsumerClass extends Base {
    private _logsController?: LogsController;

    /** 作業ログ管理コントローラー */
    public get logsController(): LogsController | undefined {
      return this._logsController;
    }

    @consume({ context: logsContext, subscribe: true })
    @property({ attribute: false })
    public set logsController(controller: LogsController | undefined) {
      this._logsController = this.subscriber.bind(
        "logs",
        this._logsController,
        controller,
      );
    }
  }
  return LogsConsumerClass;
}

/**
 * LayoutUIController を Lit Context 経由で受信・購読する Mixin。
 * コンポーネントにおける layoutUIController のプロパティ定義と購読ボイラープレートを集約する。
 *
 * @export
 * @template T
 * @param {T} Base 適用対象の SubscriberElement 派生クラス
 * @return {*}
 */
export function WithLayoutUIController<T extends LitElementConstructor>(Base: T) {
  class LayoutUIConsumerClass extends Base {
    private _layoutUIController?: LayoutUIController;

    /** レイアウト管理コントローラー */
    public get layoutUIController(): LayoutUIController | undefined {
      return this._layoutUIController;
    }

    @consume({ context: layoutUIContext, subscribe: true })
    @property({ attribute: false })
    public set layoutUIController(controller: LayoutUIController | undefined) {
      this._layoutUIController = this.subscriber.bind(
        "layoutUI",
        this._layoutUIController,
        controller,
      );
    }
  }
  return LayoutUIConsumerClass;
}

/**
 * ScratchController を Lit Context 経由で受信・購読する Mixin。
 * コンポーネントにおける scratchController のプロパティ定義と購読ボイラープレートを集約する。
 *
 * @export
 * @template T
 * @param {T} Base 適用対象の SubscriberElement 派生クラス
 * @return {*}
 */
export function WithScratchController<T extends LitElementConstructor>(Base: T) {
  class ScratchConsumerClass extends Base {
    private _scratchController?: ScratchController;

    /** スクラッチ管理コントローラー */
    public get scratchController(): ScratchController | undefined {
      return this._scratchController;
    }

    @consume({ context: scratchContext, subscribe: true })
    @property({ attribute: false })
    public set scratchController(controller: ScratchController | undefined) {
      this._scratchController = this.subscriber.bind(
        "scratch",
        this._scratchController,
        controller,
      );
    }
  }
  return ScratchConsumerClass;
}


