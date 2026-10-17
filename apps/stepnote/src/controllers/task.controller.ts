import type { ReactiveControllerHost } from "lit";
import type { TaskRepository } from "@/repositories/task.repository";
import type { IssuesRepository } from "@/repositories/issues.repository";
import type { LabelsRepository } from "@/repositories/labels.repository";
import type { SystemLogService } from "@/services/system-log.service";
import type { TaskRecord } from "@/db/models/task.model";
import type { CreateTaskInput, Summary, Property, TaskStatusCode } from "@/types";
import { BaseTaskScopeController } from "./base-reactive.controller";

/**
 * 単一タスク関連イベント・状態を管理する Reactive Controller
 *
 * @export
 * @class TaskController
 * @extends {BaseTaskScopeController}
 */
export class TaskController extends BaseTaskScopeController<
  TaskRepository,
  TaskRecord | undefined
> {
  private issuesRepository?: IssuesRepository;
  private systemLogService?: SystemLogService;
  private labelsRepository?: LabelsRepository;

  constructor(
    host: ReactiveControllerHost,
    repository: TaskRepository,
    taskId?: number,
    issuesRepository?: IssuesRepository,
    systemLogService?: SystemLogService,
    labelsRepository?: LabelsRepository,
  ) {
    super(host, repository, undefined, taskId);
    this.issuesRepository = issuesRepository;
    this.systemLogService = systemLogService;
    this.labelsRepository = labelsRepository;
  }

  /**
   * タスクを保持しているかどうかの真偽値
   *
   * @readonly
   * @type {boolean}
   * @memberof TaskController
   */
  public get hasTask(): boolean {
    return this._state !== undefined;
  }

  /**
   * 選択中タスクの単一レコードをDBから取得し、変更を全購読者へ通知する。
   * taskId が未指定の場合は、DB上で選択状態（selected: true）のタスクを自動復元する。
   */
  protected async loadState(): Promise<void> {
    if (this._taskId === undefined) {
      const selectedTask = await this.repository.getSelected();
      if (selectedTask && selectedTask.id !== undefined) {
        this._taskId = selectedTask.id;
        this._state = { ...selectedTask };
        this.notify();
        return;
      }

      this._state = undefined;
      this.notify();
      return;
    }

    const task = await this.repository.getById(this._taskId);
    if (task) {
      this._state = { ...task };
    } else {
      this._state = undefined;
      this._taskId = undefined;
    }

    this.notify();
  }

  /**
   * 対象とするタスクIDを変更し、データを再ロードする。
   * undefined が指定された場合は明示的な選択解除として状態をクリアする。
   *
   * @param {(number | undefined)} id
   * @return {*} {Promise<void>}
   * @memberof TaskController
   */
  public override setTaskId = async (id: number | undefined): Promise<void> => {
    this._taskId = id;
    if (id === undefined) {
      this._state = undefined;
      this.notify();
      return;
    }
    await this.loadState();
  };

  /**
   * 新規タスクを作成し、作成したタスクを自身の管理対象に設定する。
   *
   * @param {CreateTaskInput} input
   * @return {*}  {Promise<number>}
   * @memberof TaskController
   */
  public createTask = async (input: CreateTaskInput): Promise<number> => {
    const taskData: Omit<TaskRecord, "id"> = {
      name: input.name,
      dueDate: input.dueDate,
      fiscalYear: input.fiscalYear,
      labelId: input.labelId,
      statusCode: input.statusCode ?? 0,
      bookmark: input.bookmark ?? false,
      contacts: input.contacts ? [...input.contacts] : [],
      description: input.description ?? "",
      selected: input.selected ?? true,
      createdAt: input.createdAt ?? new Date(),
      updatedAt: input.updatedAt ?? new Date(),
    };

    const newId = await this.repository.add(taskData);
    this._taskId = newId;
    await this.loadState();
    await this.recordTaskCreateLog(newId, input);
    return newId;
  };

  /**
   * 対象タスクの内容を部分更新する。
   * updatedAt が指定されていない場合は自動的に現在時刻が設定される。
   *
   * @param {Partial<Omit<TaskRecord, "id">>} partial
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  public updateTask = async (
    partial: Partial<Omit<TaskRecord, "id">>,
  ): Promise<void> => {
    if (this._taskId === undefined) {
      return;
    }
    const before = this._state ? { ...this._state } : undefined;
    await this.repository.update(this._taskId, {
      ...partial,
      updatedAt: partial.updatedAt ?? new Date(),
    });
    await this.loadState();
    if (before) {
      await this.recordTaskUpdateLogs(before, partial);
    }
  };

  /** ラベルIDからラベル名を取得するヘルパー */
  private async resolveLabelName(labelId: number): Promise<string> {
    if (this.labelsRepository) {
      const label = await this.labelsRepository.getById(labelId);
      if (label?.name) return label.name;
    }
    return `ラベル ${labelId}`;
  }

  /** タスク作成ログの記録 */
  private async recordTaskCreateLog(
    newId: number,
    input: CreateTaskInput,
  ): Promise<void> {
    if (!this.systemLogService) return;
    const labelName = await this.resolveLabelName(input.labelId);
    await this.systemLogService.logTaskCreated(newId, {
      name: input.name,
      dueDate: input.dueDate,
      labelName,
      fiscalYear: input.fiscalYear,
      statusCode: input.statusCode,
    });
  }

  /** タスク更新時のシステムログ記録（委譲） */
  private async recordTaskUpdateLogs(
    before: TaskRecord,
    partial: Partial<Omit<TaskRecord, "id">>,
  ): Promise<void> {
    if (!this.systemLogService || this._taskId === undefined) return;
    await this.recordTaskBasicChanges(this._taskId, before, partial);
    await this.recordTaskPropertyChanges(this._taskId, before, partial);
  }

  /** タスク基本情報（名前、ステータス、関係者）の変更ログ記録 */
  private async recordTaskBasicChanges(
    taskId: number,
    before: TaskRecord,
    partial: Partial<Omit<TaskRecord, "id">>,
  ): Promise<void> {
    if (!this.systemLogService) return;

    if (partial.name !== undefined && partial.name !== before.name) {
      await this.systemLogService.logTaskNameChanged(taskId, before.name, partial.name);
    }
    if (partial.statusCode !== undefined && partial.statusCode !== before.statusCode) {
      await this.systemLogService.logTaskStatusChanged(taskId, before.statusCode, partial.statusCode);
    }
  }

  /** タスク属性情報（期日、年度、ラベル）の変更ログ記録 */
  private async recordTaskPropertyChanges(
    taskId: number,
    before: TaskRecord,
    partial: Partial<Omit<TaskRecord, "id">>,
  ): Promise<void> {
    if (!this.systemLogService) return;

    if (partial.dueDate !== undefined && partial.dueDate.getTime() !== before.dueDate.getTime()) {
      await this.systemLogService.logTaskDueDateChanged(taskId, before.dueDate, partial.dueDate);
    }
    if (partial.fiscalYear !== undefined && partial.fiscalYear !== before.fiscalYear) {
      await this.systemLogService.logTaskFiscalYearChanged(taskId, before.fiscalYear, partial.fiscalYear);
    }
    if (partial.labelId !== undefined && partial.labelId !== before.labelId) {
      const beforeLabel = await this.resolveLabelName(before.labelId);
      const afterLabel = await this.resolveLabelName(partial.labelId);
      await this.systemLogService.logTaskLabelChanged(taskId, beforeLabel, afterLabel, before.labelId, partial.labelId);
    }
  }

  /**
   * 対象タスクのサマリー項目を更新する。
   *
   * @param {Partial<Summary>} summary
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  public updateSummary = async (
    summary: Partial<Summary>,
  ): Promise<void> => {
    await this.updateTask(summary);
  };

  /**
   * 対象タスクのプロパティ項目を更新する。
   *
   * @param {Partial<Property>} property
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  public updateProperty = async (
    property: Partial<Property>,
  ): Promise<void> => {
    await this.updateTask(property);
  };

  /**
   * 対象タスクが完了（ステータス 9）可能かどうかを判定する。
   * 未完了（statusCode !== 9）の Issue が存在する場合は false を返す。
   *
   * @return {*}  {Promise<boolean>}
   * @memberof TaskController
   */
  public canCompleteTask = async (): Promise<boolean> => {
    if (this._taskId === undefined || !this.issuesRepository) {
      return true;
    }
    const issues = await this.issuesRepository.getByTaskId(this._taskId);
    return !issues.some((issue) => issue.statusCode !== 9);
  };

  /**
   * 対象タスクのステータスコードを更新する。
   * 完了（statusCode: 9）に更新する場合、未完了の Issue が残っていれば更新を防止する。
   *
   * @param {TaskStatusCode} statusCode
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  public updateStatus = async (
    statusCode: TaskStatusCode,
  ): Promise<void> => {
    if (statusCode === 9) {
      const canComplete = await this.canCompleteTask();
      if (!canComplete) {
        return;
      }
    }
    await this.updateTask({ statusCode });
  };

  /**
   * 対象タスクを削除し、内部状態をクリアする。
   *
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  public deleteTask = async (): Promise<void> => {
    if (this._taskId === undefined) {
      return;
    }
    await this.repository.delete(this._taskId);
    this._taskId = undefined;
    await this.loadState();
  };

  /**
   * hostConnected
   *
   * @memberof TaskController
   */
  hostConnected(): void {}

  /**
   * hostDisconnected
   *
   * @memberof TaskController
   */
  hostDisconnected(): void {}
}
