import { html, nothing, type TemplateResult } from "lit";
import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";
import type { ImportPreview } from "../utils/import-preview.utils";

export interface StaffFormState {
  editingId?: number;
  staffId: string;
  name: string;
  department: string;
  title: string;
  emailsText: string;
  error: string | null;
}

export interface OrganizationFormState {
  editingId?: number;
  department: string;
  extra: string;
  location: string;
  title: string;
  extensionNumber: string;
  phoneNumber: string;
  faxNumber: string;
  notes: string;
  error: string | null;
}

export interface DeleteTargetState {
  kind: "staff" | "organization";
  id: number;
  label: string;
}

export interface EditorDialogsProps {
  staffForm: StaffFormState | null;
  orgForm: OrganizationFormState | null;
  deleteTarget: DeleteTargetState | null;
  pendingImport: ImportPreview | null;
  isClearAllConfirmOpen: boolean;
  onUpdateStaffForm: (patch: Partial<StaffFormState>) => void;
  onSaveStaffForm: () => void;
  onCloseStaffForm: () => void;
  onUpdateOrgForm: (patch: Partial<OrganizationFormState>) => void;
  onSaveOrgForm: () => void;
  onCloseOrgForm: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onConfirmImport: () => void;
  onCancelImport: () => void;
  onConfirmClearAll: () => void;
  onCancelClearAll: () => void;
}

export function createStaffFormState(staff?: StaffRecord): StaffFormState {
  return {
    editingId: staff?.id,
    staffId: staff?.staffId ?? "",
    name: staff?.name ?? "",
    department: staff?.department ?? "",
    title: staff?.title ?? "",
    emailsText: staff ? staff.emails.join(", ") : "",
    error: null,
  };
}

export function createOrganizationFormState(
  org?: OrganizationRecord,
): OrganizationFormState {
  return {
    editingId: org?.id,
    department: org?.department ?? "",
    extra: org?.extra ?? "",
    location: org?.location ?? "",
    title: org?.title ?? "",
    extensionNumber: org?.extensionNumber ?? "",
    phoneNumber: org?.phoneNumber ?? "",
    faxNumber: org?.faxNumber ?? "",
    notes: org?.notes ?? "",
    error: null,
  };
}

function readInputValue(event: Event): string {
  return (event.target as HTMLInputElement).value ?? "";
}

function renderStaffDialogFields(
  form: StaffFormState,
  onUpdate: (patch: Partial<StaffFormState>) => void,
): TemplateResult {
  return html`
    <wa-input
      label="氏名 *"
      size="small"
      .value=${form.name}
      @input=${(e: Event) => onUpdate({ name: readInputValue(e), error: null })}
    ></wa-input>
    <wa-input
      label="職員番号"
      size="small"
      .value=${form.staffId}
      @input=${(e: Event) => onUpdate({ staffId: readInputValue(e) })}
    ></wa-input>
    <wa-input
      label="所属"
      size="small"
      .value=${form.department}
      @input=${(e: Event) => onUpdate({ department: readInputValue(e) })}
    ></wa-input>
    <wa-input
      label="役職"
      size="small"
      .value=${form.title}
      @input=${(e: Event) => onUpdate({ title: readInputValue(e) })}
    ></wa-input>
    <wa-textarea
      label="メールアドレス（カンマ区切りで複数入力可）"
      size="small"
      rows="2"
      .value=${form.emailsText}
      @input=${(e: Event) => onUpdate({ emailsText: readInputValue(e) })}
    ></wa-textarea>
  `;
}

function renderStaffDialog(
  props: EditorDialogsProps,
): TemplateResult | typeof nothing {
  const form = props.staffForm;
  if (!form) {
    return nothing;
  }

  const dialogTitle =
    typeof form.editingId === "number" ? "職員情報を編集" : "職員を追加";

  return html`
    <wa-dialog
      label=${dialogTitle}
      open
      @wa-after-hide=${props.onCloseStaffForm}
    >
      <div class="editor-dialog__form">
        ${renderStaffDialogFields(form, props.onUpdateStaffForm)}
        ${
          form.error
            ? html`<p class="editor-dialog__error">${form.error}</p>`
            : nothing
        }
      </div>
      <div slot="footer" class="editor-dialog__footer">
        <wa-button size="small" @click=${props.onCloseStaffForm}>
          キャンセル
        </wa-button>
        <wa-button size="small" variant="brand" @click=${props.onSaveStaffForm}>
          保存
        </wa-button>
      </div>
    </wa-dialog>
  `;
}

function renderOrgBasicFields(
  form: OrganizationFormState,
  onUpdate: (patch: Partial<OrganizationFormState>) => void,
): TemplateResult {
  return html`
    <wa-input
      label="所属 *"
      size="small"
      .value=${form.department}
      @input=${(e: Event) =>
        onUpdate({ department: readInputValue(e), error: null })}
    ></wa-input>
    <wa-input
      label="その他（建物・階など）"
      size="small"
      .value=${form.extra}
      @input=${(e: Event) => onUpdate({ extra: readInputValue(e) })}
    ></wa-input>
    <wa-input
      label="場所"
      size="small"
      .value=${form.location}
      @input=${(e: Event) => onUpdate({ location: readInputValue(e) })}
    ></wa-input>
    <wa-input
      label="役職・席"
      size="small"
      .value=${form.title}
      @input=${(e: Event) => onUpdate({ title: readInputValue(e) })}
    ></wa-input>
  `;
}

function renderOrgContactFields(
  form: OrganizationFormState,
  onUpdate: (patch: Partial<OrganizationFormState>) => void,
): TemplateResult {
  return html`
    <wa-input
      label="内線番号"
      size="small"
      .value=${form.extensionNumber}
      @input=${(e: Event) => onUpdate({ extensionNumber: readInputValue(e) })}
    ></wa-input>
    <wa-input
      label="外線番号"
      size="small"
      .value=${form.phoneNumber}
      @input=${(e: Event) => onUpdate({ phoneNumber: readInputValue(e) })}
    ></wa-input>
    <wa-input
      label="FAX番号"
      size="small"
      .value=${form.faxNumber}
      @input=${(e: Event) => onUpdate({ faxNumber: readInputValue(e) })}
    ></wa-input>
    <wa-textarea
      label="備考"
      size="small"
      rows="2"
      .value=${form.notes}
      @input=${(e: Event) => onUpdate({ notes: readInputValue(e) })}
    ></wa-textarea>
  `;
}

function renderOrgDialogFields(
  form: OrganizationFormState,
  onUpdate: (patch: Partial<OrganizationFormState>) => void,
): TemplateResult {
  return html`
    ${renderOrgBasicFields(form, onUpdate)}
    ${renderOrgContactFields(form, onUpdate)}
  `;
}

function renderOrgDialog(
  props: EditorDialogsProps,
): TemplateResult | typeof nothing {
  const form = props.orgForm;
  if (!form) {
    return nothing;
  }

  const dialogTitle =
    typeof form.editingId === "number" ? "組織情報を編集" : "組織を追加";

  return html`
    <wa-dialog label=${dialogTitle} open @wa-after-hide=${props.onCloseOrgForm}>
      <div class="editor-dialog__form">
        ${renderOrgDialogFields(form, props.onUpdateOrgForm)}
        ${
          form.error
            ? html`<p class="editor-dialog__error">${form.error}</p>`
            : nothing
        }
      </div>
      <div slot="footer" class="editor-dialog__footer">
        <wa-button size="small" @click=${props.onCloseOrgForm}>
          キャンセル
        </wa-button>
        <wa-button size="small" variant="brand" @click=${props.onSaveOrgForm}>
          保存
        </wa-button>
      </div>
    </wa-dialog>
  `;
}

function renderDeleteDialog(
  props: EditorDialogsProps,
): TemplateResult | typeof nothing {
  const target = props.deleteTarget;
  if (!target) {
    return nothing;
  }

  return html`
    <wa-dialog label="削除の確認" open @wa-after-hide=${props.onCancelDelete}>
      <p class="editor-dialog__summary">
        「${target.label}」を削除しますか？この操作は元に戻せません。
      </p>
      <div slot="footer" class="editor-dialog__footer">
        <wa-button size="small" @click=${props.onCancelDelete}>
          キャンセル
        </wa-button>
        <wa-button
          size="small"
          variant="danger"
          @click=${props.onConfirmDelete}
        >
          削除する
        </wa-button>
      </div>
    </wa-dialog>
  `;
}

function renderImportPreviewBody(preview: ImportPreview): TemplateResult {
  return html`
    <div class="editor-dialog__form">
      <p class="editor-dialog__summary">
        ファイル「${preview.fileName}」を取り込み、既存データを置き換えます。
      </p>
      ${
        preview.encoding
          ? html`<p class="editor-dialog__meta">
              判定文字コード: ${preview.encoding.toUpperCase()}
            </p>`
          : nothing
      }
      ${
        preview.kind !== "org-csv"
          ? html`<p class="editor-dialog__meta">
              職員データ: 現在 ${preview.currentStaffCount} 件 → 取込後
              ${preview.staffCount} 件
            </p>`
          : nothing
      }
      ${
        preview.kind !== "staff-csv"
          ? html`<p class="editor-dialog__meta">
              組織データ: 現在 ${preview.currentOrganizationCount} 件 → 取込後
              ${preview.organizationCount} 件
            </p>`
          : nothing
      }
    </div>
  `;
}

function renderImportConfirmDialog(
  props: EditorDialogsProps,
): TemplateResult | typeof nothing {
  const preview = props.pendingImport;
  if (!preview) {
    return nothing;
  }

  return html`
    <wa-dialog
      label="インポートの確認（全件洗い替え）"
      open
      @wa-after-hide=${props.onCancelImport}
    >
      ${renderImportPreviewBody(preview)}
      <div slot="footer" class="editor-dialog__footer">
        <wa-button size="small" @click=${props.onCancelImport}>
          キャンセル
        </wa-button>
        <wa-button size="small" variant="brand" @click=${props.onConfirmImport}>
          インポートを実行
        </wa-button>
      </div>
    </wa-dialog>
  `;
}

function renderClearAllDialog(
  props: EditorDialogsProps,
): TemplateResult | typeof nothing {
  if (!props.isClearAllConfirmOpen) {
    return nothing;
  }

  return html`
    <wa-dialog
      label="全データ削除の確認"
      open
      @wa-after-hide=${props.onCancelClearAll}
    >
      <p class="editor-dialog__summary">
        登録されているすべての職員・組織データを削除しますか？（お気に入り設定は維持されます）
      </p>
      <div slot="footer" class="editor-dialog__footer">
        <wa-button size="small" @click=${props.onCancelClearAll}>
          キャンセル
        </wa-button>
        <wa-button
          size="small"
          variant="danger"
          @click=${props.onConfirmClearAll}
        >
          すべて削除
        </wa-button>
      </div>
    </wa-dialog>
  `;
}

/**
 * 追加・編集・削除・インポート確認ダイアログ群をレンダリングする
 */
export function renderEditorDialogs(props: EditorDialogsProps): TemplateResult {
  return html`
    ${renderStaffDialog(props)} ${renderOrgDialog(props)}
    ${renderDeleteDialog(props)} ${renderImportConfirmDialog(props)}
    ${renderClearAllDialog(props)}
  `;
}
