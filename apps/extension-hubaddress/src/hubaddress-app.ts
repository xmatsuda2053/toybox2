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
import {
  getOrganizationFavoriteKey,
  getStaffFavoriteKey,
} from "./utils/directory-filter.utils";
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
    const { favoritesOnly } = this.controller;
    const favLabel = favoritesOnly ? "すべて表示" : "お気に入りのみ表示";

    return html`
      <header class="hubaddress-shell__header">
        <div class="hubaddress-shell__brand">
          <wa-icon name="icon-hub-address"></wa-icon>
          <h1 class="hubaddress-shell__title">HubAddress</h1>
        </div>
        <div class="hubaddress-shell__actions">
          <wa-button
            id="hubaddress-fav-filter-btn"
            size="small"
            variant=${favoritesOnly ? "warning" : "neutral"}
            appearance=${favoritesOnly ? "accent" : "outlined"}
            @click=${() => this.controller.setFavoritesOnly(!favoritesOnly)}
          >
            <wa-icon slot="start" name="bookmark-solid-full"></wa-icon>
            お気に入り
          </wa-button>
          <wa-tooltip for="hubaddress-fav-filter-btn" trigger="hover">
            ${favLabel}
          </wa-tooltip>
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
          職員 (${filteredStaff.length})
        </wa-button>
        <wa-button
          class="hubaddress-shell__tab-btn hubaddress-shell__tab-btn--directory"
          size="small"
          variant=${tabVariant("organizations")}
          appearance=${tabAppearance("organizations")}
          @click=${() => this.controller.setActiveTab("organizations")}
        >
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

  private renderDepartmentSelect(): TemplateResult {
    const { selectedDepartment, departments } = this.controller;

    return html`
      <wa-select
        class="hubaddress-shell__filter-select"
        size="small"
        placeholder="すべての所属"
        .value=${selectedDepartment}
        clearable
        @change=${(e: Event) => {
          const target = e.target as HTMLSelectElement;
          this.controller.setSelectedDepartment(target.value);
        }}
      >
        <wa-option value="">すべての所属</wa-option>
        ${departments.map(
          (dept) => html`<wa-option value=${dept}>${dept}</wa-option>`,
        )}
      </wa-select>
    `;
  }

  private renderClearFilterButton(): TemplateResult | typeof nothing {
    const { searchQuery, selectedDepartment, favoritesOnly } = this.controller;
    const hasActiveFilter =
      searchQuery.length > 0 || selectedDepartment.length > 0 || favoritesOnly;
    if (!hasActiveFilter) {
      return nothing;
    }

    return html`
      <wa-button
        id="hubaddress-clear-filter-btn"
        size="small"
        appearance="plain"
        @click=${() => this.controller.clearFilters()}
      >
        <wa-icon name="xmark-solid-full"></wa-icon>
      </wa-button>
      <wa-tooltip for="hubaddress-clear-filter-btn" trigger="hover">
        絞り込みをクリア
      </wa-tooltip>
    `;
  }

  private renderFilterBar(): TemplateResult | typeof nothing {
    if (this.controller.activeTab === "settings") {
      return nothing;
    }

    return html`
      <section class="hubaddress-shell__filters" aria-label="検索・絞り込み">
        <wa-input
          size="small"
          placeholder="氏名・職員番号・所属・内線・メールを検索..."
          .value=${this.controller.searchQuery}
          clearable
          @input=${(e: Event) => {
            const target = e.target as HTMLInputElement;
            this.controller.setSearchQuery(target.value);
          }}
        >
          <wa-icon slot="start" name="magnifying-glass-solid-full"></wa-icon>
        </wa-input>
        <div class="hubaddress-shell__filter-row">
          ${this.renderDepartmentSelect()} ${this.renderClearFilterButton()}
        </div>
      </section>
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
        ${
          items.length === 0
            ? html`<p class="hubaddress-shell__empty">
                該当する職員データがありません。
              </p>`
            : html`
                <div class="directory-card-list">
                  ${items.map((staff, idx) =>
                    renderStaffCard(staff, idx, {
                      isFavorite: this.controller.favoriteStaffKeys.has(
                        getStaffFavoriteKey(staff),
                      ),
                      onToggleFavorite: (target) =>
                        void this.controller.toggleStaffFavorite(target),
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
              `
        }
      </section>
    `;
  }

  private renderOrganizationColumn(): TemplateResult {
    const items = this.controller.filteredOrganizations;
    const isActive = this.controller.activeTab === "organizations";
    const highlightKey = this.controller.highlightedOrganizationKey;

    return html`
      <section class="hubaddress-shell__column" data-active=${String(isActive)}>
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
        ${
          items.length === 0
            ? html`<p class="hubaddress-shell__empty">
                該当する組織データがありません。
              </p>`
            : html`
                <div class="directory-card-list">
                  ${items.map((org, idx) => {
                    const key = getOrganizationFavoriteKey(org);
                    return renderOrganizationCard(org, idx, {
                      isFavorite:
                        this.controller.favoriteOrganizationKeys.has(key),
                      isHighlighted: highlightKey === key,
                      onToggleFavorite: (target) =>
                        void this.controller.toggleOrganizationFavorite(target),
                      onCopy: (label, value) =>
                        void this.controller.copyField(label, value),
                      onEdit: (target) => {
                        this.orgForm = createOrganizationFormState(target);
                      },
                      onDelete: (target) => this.openDeleteOrganization(target),
                    });
                  })}
                </div>
              `
        }
      </section>
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
      ${this.renderHeader()} ${this.renderTabButtons()}
      ${this.renderFilterBar()} ${this.renderBody()} ${this.renderDialogs()}
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
