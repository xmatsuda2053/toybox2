import type { ReactiveControllerHost } from "lit";
import type { TaskTemplateRepository } from "@/repositories/template.repository";
import type { TaskTemplateRecord } from "@/db/models/template.model";
import { BaseDataController } from "./base-reactive.controller";

/**
 * タスクテンプレートの状態管理およびCRUD・複製操作を提供する Reactive Controller
 *
 * @export
 * @class TaskTemplateController
 * @extends {BaseDataController<TaskTemplateRepository, ReadonlyArray<TaskTemplateRecord>>}
 */
export class TaskTemplateController extends BaseDataController<
  TaskTemplateRepository,
  ReadonlyArray<TaskTemplateRecord>
> {
  /**
   * 現在マスター・ディテール画面等で選択中のテンプレートID
   */
  public selectedTemplateId?: number;

  /**
   * コンストラクタ
   * @param {ReactiveControllerHost} host コントローラーを保持するホスト
   * @param {TaskTemplateRepository} repository テンプレートリポジトリ
   */
  constructor(host: ReactiveControllerHost, repository: TaskTemplateRepository) {
    super(host, repository, []);
  }

  /**
   * 現在選択中のテンプレートレコード
   *
   * @readonly
   * @type {(TaskTemplateRecord | undefined)}
   */
  public get selectedTemplate(): TaskTemplateRecord | undefined {
    return this.state.find((item) => item.id === this.selectedTemplateId);
  }

  /**
   * テンプレート一覧をリポジトリから取得し、全購読者へ通知する。
   *
   * @protected
   * @return {*} {Promise<void>}
   */
  protected async loadState(): Promise<void> {
    const records = await this.repository.getAll();
    this._state = [...records];
    if (
      this.selectedTemplateId !== undefined &&
      !this._state.some((t) => t.id === this.selectedTemplateId)
    ) {
      this.selectedTemplateId = this._state[0]?.id;
    }
    this.notify();
  }

  /**
   * 選択中のテンプレートIDを変更する。
   *
   * @param {number} [id] 選択するテンプレートID
   */
  public selectTemplate(id?: number): void {
    this.selectedTemplateId = id;
    this.notify();
  }

  /**
   * 新規テンプレートを作成する。
   *
   * @param {Omit<TaskTemplateRecord, "id">} data
   * @return {Promise<number>}
   */
  public createTemplate = async (
    data: Omit<TaskTemplateRecord, "id">,
  ): Promise<number> => {
    const now = new Date();
    const itemData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    const newId = await this.repository.add(itemData);
    await this.loadState();
    return newId;
  };

  /**
   * テンプレートを更新する。
   *
   * @param {number} id
   * @param {Partial<Omit<TaskTemplateRecord, "id">>} data
   * @return {Promise<void>}
   */
  public updateTemplate = async (
    id: number,
    data: Partial<Omit<TaskTemplateRecord, "id">>,
  ): Promise<void> => {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    await this.repository.update(id, updateData);
    await this.loadState();
  };

  /**
   * テンプレートを削除する。
   *
   * @param {number} id
   * @return {Promise<void>}
   */
  public deleteTemplate = async (id: number): Promise<void> => {
    await this.repository.delete(id);
    if (this.selectedTemplateId === id) {
      this.selectedTemplateId = undefined;
    }
    await this.loadState();
  };

  /**
   * テンプレートを複製する。
   *
   * @param {number} id
   * @return {Promise<number>}
   */
  public cloneTemplate = async (id: number): Promise<number> => {
    const clonedId = await this.repository.clone(id);
    await this.loadState();
    return clonedId;
  };
}

