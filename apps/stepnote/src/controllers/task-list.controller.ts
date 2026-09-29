import type { ReactiveControllerHost } from "lit";
import { getCurrentFiscalYear } from "@shared/utils";
import type { TaskRepository } from "@/repositories/task.repository";
import type { TaskRecord } from "@/db/models/task.model";
import { BaseDataController } from "./base-reactive.controller";

/**
 * Task List ペインにおけるタスク一覧および年度・検索・フィルタ状態を管理する Reactive Controller
 *
 * @export
 * @class TaskListController
 * @extends {BaseDataController<TaskRepository, readonly TaskRecord[]>}
 */
export class TaskListController extends BaseDataController<
  TaskRepository,
  readonly TaskRecord[]
> {
  private _fiscalYear: number;

  /**
   * 現在選択中の会計年度
   *
   * @readonly
   * @type {number}
   * @memberof TaskListController
   */
  public get fiscalYear(): number {
    return this._fiscalYear;
  }

  /**
   * Creates an instance of TaskListController.
   * @param {ReactiveControllerHost} host ホストコンポーネント
   * @param {TaskRepository} repository タスクリポジトリ
   * @param {number} [fiscalYear=getCurrentFiscalYear()] 初期対象年度
   * @memberof TaskListController
   */
  constructor(
    host: ReactiveControllerHost,
    repository: TaskRepository,
    fiscalYear: number = getCurrentFiscalYear(),
  ) {
    super(host, repository, []);
    this._fiscalYear = fiscalYear;
  }

  /**
   * 現在の会計年度に合致するタスクレコードをDBから取得し、全購読者へ通知する。
   *
   * @protected
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  protected async loadState(): Promise<void> {
    const tasks = await this.repository.getByFiscalYear(this._fiscalYear);
    this._state = [...tasks];
    this.notify();
  }

  /**
   * 表示対象の会計年度を変更し、タスク一覧を再読み込みする。
   * 指定年度が現在と同じ場合は処理をスキップする。
   *
   * @param {number} fiscalYear 変更後の会計年度
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  public setFiscalYear = async (fiscalYear: number): Promise<void> => {
    if (this._fiscalYear === fiscalYear) {
      return;
    }
    this._fiscalYear = fiscalYear;
    await this.loadState();
  };

  /**
   * hostConnected
   *
   * @memberof TaskListController
   */
  hostConnected(): void {}

  /**
   * hostDisconnected
   *
   * @memberof TaskListController
   */
  hostDisconnected(): void {}
}
