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
  private _labelId?: number;

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
   * 現在選択中のラベルIDフィルタ
   *
   * @readonly
   * @type {(number | undefined)}
   * @memberof TaskListController
   */
  public get labelId(): number | undefined {
    return this._labelId;
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
   * 現在の会計年度およびラベルフィルタに合致するタスクレコードをDBから取得・ソートし、全購読者へ通知する。
   *
   * @protected
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  protected async loadState(): Promise<void> {
    const tasks = await this.repository.getByFiscalYear(this._fiscalYear);

    // ラベルによる絞り込み（指定時のみ）
    let filtered =
      this._labelId !== undefined
        ? tasks.filter((t) => t.labelId === this._labelId)
        : tasks;

    // ソート処理（第1キー: 期限日昇順、第2キー: タスク名昇順）
    filtered = [...filtered].sort((a, b) => {
      const timeA = new Date(a.dueDate).getTime();
      const timeB = new Date(b.dueDate).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.name.localeCompare(b.name, "ja");
    });

    this._state = filtered;
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
   * 表示対象のラベルフィルタを変更し、タスク一覧を再読み込みする。
   *
   * @param {(number | undefined)} labelId 絞り込み対象のラベルID（全件時は undefined）
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  public setLabelFilter = async (labelId?: number): Promise<void> => {
    if (this._labelId === labelId) {
      return;
    }
    this._labelId = labelId;
    await this.loadState();
  };

  /**
   * 指定したIDのタスクを選択状態にし、一覧を再読み込みする。
   *
   * @param {number} id
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  public selectTask = async (id: number): Promise<void> => {
    await this.repository.select(id);
    await this.loadState();
  };

  /**
   * 指定したIDのタスクのブックマーク状態を反転更新し、一覧を再読み込みする。
   *
   * @param {number} id
   * @param {boolean} currentBookmark 現在のブックマーク状態
   * @return {*}  {Promise<void>}
   * @memberof TaskListController
   */
  public toggleBookmark = async (
    id: number,
    currentBookmark: boolean,
  ): Promise<void> => {
    await this.repository.update(id, { bookmark: !currentBookmark });
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
