import { html, type HTMLTemplateResult } from "lit";
import type { TaskTemplateRecord } from "@/db/models/template.model.js";
import { extractIssueTitle } from "@/utils/task-filter.utils.js";

/** Issue 削除確認ダイアログ描画パラメーター */
export interface IssueDeleteDialogParams {
  open: boolean;
  onClose: (e?: Event) => void;
  onConfirm: () => Promise<void> | void;
}

/** Issue 追加ダイアログ描画パラメーター */
export interface IssueAddDialogParams {
  open: boolean;
  addText: string;
  onTextChange: (value: string) => void;
  onClose: (e?: Event) => void;
  onConfirm: () => Promise<void> | void;
}

/** Issue テンプレート適用ダイアログ描画パラメーター */
export interface IssueTemplateDialogParams {
  open: boolean;
  templates: readonly TaskTemplateRecord[];
  selectedTemplateId: number | null;
  onClose: (e?: Event) => void;
  onSelectTemplate: (e: Event) => void;
  onConfirm: () => Promise<void> | void;
}

/** テンプレート適用処理用パラメーター */
export interface ApplyIssueTemplateParams {
  template: TaskTemplateRecord;
  parentTaskId?: number;
  taskDueDate?: Date;
  issuesController: {
    taskId?: number;
    setTaskId?: (taskId?: number) => Promise<void> | void;
    applyTemplate: (
      template: TaskTemplateRecord,
      taskDueDate?: Date,
    ) => Promise<number[] | void>;
  };
}

/**
 * テンプレート選択イベント（wa-select）から選択 ID を安全に抽出する。
 */
export function parseSelectedTemplateId(e: Event): number | null {
  const target = (e.currentTarget ?? e.target) as
    | (HTMLElement & { value?: string })
    | null;
  const value = target?.value;
  if (!value) {
    return null;
  }
  const id = Number(value);
  return Number.isNaN(id) ? null : id;
}

/**
 * 親タスク ID の同期補正を行ったうえで選択テンプレートを Issue 群として適用する。
 */
export async function applySelectedIssueTemplate(
  params: ApplyIssueTemplateParams,
): Promise<void> {
  const { template, parentTaskId, taskDueDate, issuesController } = params;
  if (
    parentTaskId !== undefined &&
    issuesController.taskId !== parentTaskId &&
    typeof issuesController.setTaskId === "function"
  ) {
    await issuesController.setTaskId(parentTaskId);
  }
  await issuesController.applyTemplate(template, taskDueDate);
}

/**
 * Issue 削除確認ダイアログを描画する。
 */
export function renderIssueDeleteDialog(
  params: IssueDeleteDialogParams,
): HTMLTemplateResult {
  return html`
    <wa-dialog
      class="issues-view__delete-dialog"
      label="Issueの削除確認"
      ?open=${params.open}
      @wa-after-hide=${params.onClose}
    >
      <div class="issues-view__delete-dialog-body">
        このIssueを削除してもよろしいですか？<br />
        ※この操作は取り消せません。
      </div>
      <div slot="footer" class="issues-view__delete-dialog-footer">
        <wa-button
          variant="neutral"
          appearance="plain"
          size="s"
          @click=${params.onClose}
        >
          キャンセル
        </wa-button>
        <wa-button variant="danger" size="s" @click=${params.onConfirm}>
          削除
        </wa-button>
      </div>
    </wa-dialog>
  `;
}

/**
 * Issue 追加ダイアログを描画する。
 */
export function renderIssueAddDialog(
  params: IssueAddDialogParams,
): HTMLTemplateResult {
  return html`
    <wa-dialog
      class="issues-view__add-dialog"
      label="Issueの追加"
      ?open=${params.open}
      @wa-after-hide=${params.onClose}
    >
      <div class="issues-view__add-dialog-body">
        <div class="issues-view__add-dialog-description">
          1行につき1件のIssueを作成します。
        </div>
        <wa-textarea
          class="issues-view__add-textarea"
          rows="6"
          placeholder="Issueタイトルを入力（改行で複数件追加）...&#10;例:&#10;仕様の確認&#10;画面モック作成&#10;API結合テスト"
          .value=${params.addText}
          @input=${(e: Event) => {
            params.onTextChange((e.target as HTMLTextAreaElement).value);
          }}
        ></wa-textarea>
      </div>
      <div slot="footer" class="issues-view__add-dialog-footer">
        <wa-button
          variant="neutral"
          appearance="plain"
          size="s"
          @click=${params.onClose}
        >
          キャンセル
        </wa-button>
        <wa-button variant="brand" size="s" @click=${params.onConfirm}>
          作成
        </wa-button>
      </div>
    </wa-dialog>
  `;
}

function renderTemplatePreview(
  template: TaskTemplateRecord,
): HTMLTemplateResult {
  const issues = template.issues ?? [];
  if (issues.length === 0) {
    return html`
      <div class="issues-view__template-preview">
        <div class="issues-view__template-preview-empty">
          このテンプレートにはIssueが登録されていません。
        </div>
      </div>
    `;
  }
  return html`
    <div class="issues-view__template-preview">
      <div class="issues-view__template-preview-header">
        含まれるIssue（${issues.length}件）:
      </div>
      <ul class="issues-view__template-preview-list">
        ${issues.map(
          (issue) => html`
            <li class="issues-view__template-preview-item">
              ${issue.value ? extractIssueTitle(issue.value) : "（無題）"}
            </li>
          `,
        )}
      </ul>
    </div>
  `;
}

function renderTemplateDialogBody(
  templates: readonly TaskTemplateRecord[],
  selectedTemplateId: number | null,
  onSelectTemplate: (e: Event) => void,
  selectedTemplate?: TaskTemplateRecord,
): HTMLTemplateResult {
  if (templates.length === 0) {
    return html`
      <div class="issues-view__template-empty-message">
        利用可能なテンプレートがありません（設定画面から作成できます）。
      </div>
    `;
  }

  return html`
    <div class="issues-view__template-select-container">
      <label
        class="issues-view__template-label"
        for="issues-view-template-select"
      >
        適用するテンプレート
      </label>
      <wa-select
        id="issues-view-template-select"
        class="issues-view__template-select"
        placeholder="テンプレートを選択..."
        .value=${selectedTemplateId !== null ? String(selectedTemplateId) : ""}
        @change=${onSelectTemplate}
      >
        ${templates.map(
          (t) =>
            html`<wa-option value=${String(t.id)}>${t.name}</wa-option>`,
        )}
      </wa-select>
    </div>
    ${selectedTemplate ? renderTemplatePreview(selectedTemplate) : null}
  `;
}

/**
 * Issue テンプレート適用ダイアログを描画する。
 */
export function renderIssueTemplateDialog(
  params: IssueTemplateDialogParams,
): HTMLTemplateResult {
  const selectedTemplate = params.templates.find(
    (t) => t.id === params.selectedTemplateId,
  );
  const isApplyDisabled =
    params.selectedTemplateId === null ||
    !selectedTemplate ||
    (selectedTemplate.issues?.length ?? 0) === 0;

  return html`
    <wa-dialog
      class="issues-view__template-dialog"
      label="Issueテンプレートの適用"
      ?open=${params.open}
      @wa-after-hide=${params.onClose}
    >
      <div class="issues-view__template-dialog-body">
        ${renderTemplateDialogBody(
          params.templates,
          params.selectedTemplateId,
          params.onSelectTemplate,
          selectedTemplate,
        )}
      </div>
      <div slot="footer" class="issues-view__template-dialog-footer">
        <wa-button
          variant="neutral"
          appearance="plain"
          size="s"
          @click=${params.onClose}
        >
          キャンセル
        </wa-button>
        <wa-button
          id="issues-view-btn-confirm-apply"
          variant="brand"
          size="s"
          ?disabled=${isApplyDisabled}
          @click=${params.onConfirm}
        >
          適用
        </wa-button>
      </div>
    </wa-dialog>
  `;
}
