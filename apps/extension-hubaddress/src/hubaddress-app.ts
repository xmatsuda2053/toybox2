import { LitElement, html, nothing, unsafeCSS, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import shellStyles from "./hubaddress-app.scss?inline";
import cardStyles from "./components/directory-cards.scss?inline";
import settingsStyles from "./components/settings-view.scss?inline";
import dialogStyles from "./components/editor-dialogs.scss?inline";
import { DirectoryController } from "./controllers/directory.controller";
import {
  renderOrganizationCard,
  renderStaffCard,
} from "./components/directory-cards";
import { renderSettingsView } from "./components/settings-view";
import {
  createOrganizationFormState,
  createStaffFormState,
  renderEditorDialogs,
  type DeleteTargetState,
  type OrganizationFormState,
  type StaffFormState,
} from "./components/editor-dialogs";
import { parseEmailsInput } from "./utils/directory-validation.utils";
import { triggerFileDownload } from "./utils/download.utils";
import type { ImportKind } from "./utils/import-preview.utils";
import type {
  ActiveTab,
  OrganizationRecord,
  StaffRecord,
} from "./models/directory.model";

/**
 * HubAddress Side Panel アプリケーションルートコンポーネント
 */
@customElement("hubaddress-app")
export class HubAddressApp extends LitElement {
  static styles = [
    unsafeCSS(shellStyles),
    unsafeCSS(cardStyles),
    unsafeCSS(settingsStyles),
    unsafeCSS(dialogStyles),
  ];

  readonly controller = new DirectoryController(this);

  @state() private staffForm: StaffFormState | null = null;
  @state() private orgForm: OrganizationFormState | null = null;
  @state() private deleteTarget: DeleteTargetState | null = null;
  @state() private isClearAllConfirmOpen = false;
  @state() private pendingFileKind: ImportKind = "json";

  private renderHeader(): TemplateResult {
    return html`
      <header class="hubaddress-shell__header">
        <div class="hubaddress-shell__brand">
          <wa-icon name="icon-hub-address"></wa-icon>
          <h1 class="hubaddress-shell__title">HubAddress</h1>
        </div>
      </header>
    `;
  }

  private renderTabButtons(): TemplateResult {
    const { activeTab, filteredStaff, filteredOrganizations } = this.controller;
    const tabVariant = (tab: ActiveTab) =>
      activeTab === tab ? "brand" : "neutral";
    const tabAppearance = (tab: ActiveTab) =>
      activeTab === tab ? "filled" : "outlined";

    return html`
      <nav class="hubaddress-shell__tabs" aria-label="表示切り替え">
        <wa-button
          class="hubaddress-shell__tab-btn hubaddress-shell__tab-btn--directory"
          size="small"
          variant=${tabVariant("staff")}
          appearance=${tabAppearance("staff")}
          @click=${() => this.controller.setActiveTab("staff")}
        >
          <wa-icon slot="start" name="user-solid-full"></wa-icon>
          職員 (${filteredStaff.length})
        </wa-button>
        <wa-button
          class="hubaddress-shell__tab-btn hubaddress-shell__tab-btn--directory"
          size="small"
          variant=${tabVariant("organizations")}
          appearance=${tabAppearance("organizations")}
          @click=${() => this.controller.setActiveTab("organizations")}
        >
          <wa-icon slot="start" name="building-solid-full"></wa-icon>
          組織 (${filteredOrganizations.length})
        </wa-button>
        <wa-button
          class="hubaddress-shell__tab-btn"
          size="small"
          variant=${tabVariant("settings")}
          appearance=${tabAppearance("settings")}
          @click=${() => this.controller.setActiveTab("settings")}
        >
          <wa-icon slot="start" name="gear-solid-full"></wa-icon>
          設定
        </wa-button>
      </nav>
    `;
  }

  private renderSearchInput(
    placeholder: string,
    value: string,
    onChange: (nextValue: string) => void,
  ): TemplateResult {
    return html`
      <wa-input
        size="medium"
        placeholder=${placeholder}
        .value=${value}
        with-clear
        @input=${(e: Event) => {
          const target = e.target as HTMLInputElement;
          onChange(target.value);
        }}
        @wa-clear=${() => onChange("")}
      >
        <wa-icon slot="start" name="magnifying-glass-solid-full"></wa-icon>
      </wa-input>
    `;
  }

  private openDeleteStaff(staff: StaffRecord): void {
    if (typeof staff.id !== "number") {
      return;
    }
    this.deleteTarget = {
      kind: "staff",
      id: staff.id,
      label: staff.name || staff.staffId || "職員",
    };
  }

  private openDeleteOrganization(org: OrganizationRecord): void {
    if (typeof org.id !== "number") {
      return;
    }
    this.deleteTarget = {
      kind: "organization",
      id: org.id,
      label: org.department || "組織",
    };
  }

  private renderStaffColumn(): TemplateResult {
    const items = this.controller.filteredStaff;
    const isActive = this.controller.activeTab === "staff";

    return html`
      <section class="hubaddress-shell__column" data-active=${String(isActive)}>
        <div class="hubaddress-shell__column-toolbar">
          <div class="hubaddress-shell__column-bar">
            <h2 class="hubaddress-shell__column-heading">
              職員一覧 (${items.length})
            </h2>
            <wa-button
              size="small"
              appearance="outlined"
              @click=${() => {
                this.staffForm = createStaffFormState();
              }}
            >
              <wa-icon slot="start" name="plus-solid-full"></wa-icon>
              職員を追加
            </wa-button>
          </div>
          ${this.renderSearchInput(
            "職員番号・氏名・所属・役職を検索...",
            this.controller.staffSearchQuery,
            (val) => this.controller.setStaffSearchQuery(val),
          )}
        </div>
        ${this.renderStaffList(items)}
      </section>
    `;
  }

  private renderStaffList(items: StaffRecord[]): TemplateResult {
    if (items.length === 0) {
      return html`<p class="hubaddress-shell__empty">
        該当する職員データがありません。
      </p>`;
    }

    return html`
      <div class="directory-card-list">
        ${items.map((staff, idx) =>
          renderStaffCard(staff, idx, {
            isEmailsExpanded: this.controller.isStaffEmailsExpanded(staff),
            onToggleEmails: (target) =>
              this.controller.toggleStaffEmails(target),
            onJumpToDepartment: (dept) =>
              this.controller.jumpToOrganization(dept),
            onCopy: (label, value) =>
              void this.controller.copyField(label, value),
            onEdit: (target) => {
              this.staffForm = createStaffFormState(target);
            },
            onDelete: (target) => this.openDeleteStaff(target),
          }),
        )}
      </div>
    `;
  }

  private renderOrganizationColumn(): TemplateResult {
    const items = this.controller.filteredOrganizations;
    const isActive = this.controller.activeTab === "organizations";

    return html`
      <section class="hubaddress-shell__column" data-active=${String(isActive)}>
        <div class="hubaddress-shell__column-toolbar">
          <div class="hubaddress-shell__column-bar">
            <h2 class="hubaddress-shell__column-heading">
              組織一覧 (${items.length})
            </h2>
            <wa-button
              size="small"
              appearance="outlined"
              @click=${() => {
                this.orgForm = createOrganizationFormState();
              }}
            >
              <wa-icon slot="start" name="plus-solid-full"></wa-icon>
              組織を追加
            </wa-button>
          </div>
          ${this.renderSearchInput(
            "所属・内線・外線・場所・備考を検索...",
            this.controller.organizationSearchQuery,
            (val) => this.controller.setOrganizationSearchQuery(val),
          )}
        </div>
        ${this.renderOrganizationList(items)}
      </section>
    `;
  }

  private renderOrganizationList(items: OrganizationRecord[]): TemplateResult {
    if (items.length === 0) {
      return html`<p class="hubaddress-shell__empty">
        該当する組織データがありません。
      </p>`;
    }

    return html`
      <div class="directory-card-list">
        ${items.map((org, idx) =>
          renderOrganizationCard(org, idx, {
            onCopy: (label, value) =>
              void this.controller.copyField(label, value),
            onEdit: (target) => {
              this.orgForm = createOrganizationFormState(target);
            },
            onDelete: (target) => this.openDeleteOrganization(target),
          }),
        )}
      </div>
    `;
  }

  private openFilePicker(kind: ImportKind): void {
    this.pendingFileKind = kind;
    const input = this.shadowRoot?.querySelector(
      "#hubaddress-file-input",
    ) as HTMLInputElement | null;
    if (input) {
      input.value = "";
      input.accept =
        kind === "json" ? ".json,application/json" : ".csv,text/csv";
      input.click();
    }
  }

  private async handleFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      this.controller.prepareImport(
        this.pendingFileKind,
        file.name,
        new Uint8Array(buffer),
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "読み込み失敗";
      this.controller.showToast(`インポートエラー: ${msg}`);
    }
  }

  private async handleSaveStaffForm(): Promise<void> {
    const form = this.staffForm;
    if (!form) {
      return;
    }
    try {
      await this.controller.saveStaff(
        {
          staffId: form.staffId,
          name: form.name,
          department: form.department,
          title: form.title,
          emails: parseEmailsInput(form.emailsText),
        },
        form.editingId,
      );
      this.staffForm = null;
    } catch (error) {
      this.staffForm = {
        ...form,
        error: error instanceof Error ? error.message : "保存に失敗しました。",
      };
    }
  }

  private async handleSaveOrgForm(): Promise<void> {
    const form = this.orgForm;
    if (!form) {
      return;
    }
    try {
      await this.controller.saveOrganization(
        {
          department: form.department,
          extra: form.extra,
          location: form.location,
          title: form.title,
          extensionNumber: form.extensionNumber,
          phoneNumber: form.phoneNumber,
          faxNumber: form.faxNumber,
          notes: form.notes,
        },
        form.editingId,
      );
      this.orgForm = null;
    } catch (error) {
      this.orgForm = {
        ...form,
        error: error instanceof Error ? error.message : "保存に失敗しました。",
      };
    }
  }

  private async handleConfirmDelete(): Promise<void> {
    const target = this.deleteTarget;
    if (!target) {
      return;
    }
    this.deleteTarget = null;
    if (target.kind === "staff") {
      await this.controller.removeStaff(target.id);
    } else {
      await this.controller.removeOrganization(target.id);
    }
  }

  private renderBody(): TemplateResult {
    if (this.controller.activeTab === "settings") {
      return html`
        <main class="hubaddress-shell__body">
          ${renderSettingsView({
            staffCount: this.controller.staff.length,
            organizationCount: this.controller.organizations.length,
            themeMode: this.controller.themeMode,
            onChangeTheme: (mode) => void this.controller.setThemeMode(mode),
            onRequestImport: (kind) => this.openFilePicker(kind),
            onExportStaffCsv: () => {
              const out = this.controller.exportStaffCsvBytes();
              triggerFileDownload(
                out.filename,
                out.bytes,
                "text/csv;charset=utf-8",
              );
            },
            onExportOrgCsv: () => {
              const out = this.controller.exportOrganizationCsvBytes();
              triggerFileDownload(
                out.filename,
                out.bytes,
                "text/csv;charset=utf-8",
              );
            },
            onExportJson: () => {
              const out = this.controller.exportDirectoryJsonText();
              triggerFileDownload(out.filename, out.text, "application/json");
            },
            onRequestClearAll: () => {
              this.isClearAllConfirmOpen = true;
            },
          })}
        </main>
      `;
    }

    return html`
      <main class="hubaddress-shell__body">
        <div class="hubaddress-shell__split-grid">
          ${this.renderStaffColumn()} ${this.renderOrganizationColumn()}
        </div>
      </main>
    `;
  }

  private renderDialogs(): TemplateResult {
    return renderEditorDialogs({
      staffForm: this.staffForm,
      orgForm: this.orgForm,
      deleteTarget: this.deleteTarget,
      pendingImport: this.controller.pendingImport,
      isClearAllConfirmOpen: this.isClearAllConfirmOpen,
      onUpdateStaffForm: (patch) => {
        if (this.staffForm) {
          this.staffForm = { ...this.staffForm, ...patch };
        }
      },
      onSaveStaffForm: () => void this.handleSaveStaffForm(),
      onCloseStaffForm: () => {
        this.staffForm = null;
      },
      onUpdateOrgForm: (patch) => {
        if (this.orgForm) {
          this.orgForm = { ...this.orgForm, ...patch };
        }
      },
      onSaveOrgForm: () => void this.handleSaveOrgForm(),
      onCloseOrgForm: () => {
        this.orgForm = null;
      },
      onConfirmDelete: () => void this.handleConfirmDelete(),
      onCancelDelete: () => {
        this.deleteTarget = null;
      },
      onConfirmImport: () => void this.controller.confirmImport(),
      onCancelImport: () => this.controller.cancelImport(),
      onConfirmClearAll: () => {
        this.isClearAllConfirmOpen = false;
        void this.controller.clearAllDirectoryData();
      },
      onCancelClearAll: () => {
        this.isClearAllConfirmOpen = false;
      },
    });
  }

  override render(): TemplateResult {
    const { toastMessage } = this.controller;

    return html`
      <input
        id="hubaddress-file-input"
        class="hubaddress-shell__hidden-input"
        type="file"
        @change=${(e: Event) => void this.handleFileSelected(e)}
      />
      ${this.renderHeader()} ${this.renderTabButtons()} ${this.renderBody()}
      ${this.renderDialogs()}
      ${
        toastMessage
          ? html`<div class="hubaddress-shell__toast" role="status">
              ${toastMessage}
            </div>`
          : nothing
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hubaddress-app": HubAddressApp;
  }
}
