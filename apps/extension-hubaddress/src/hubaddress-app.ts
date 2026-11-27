import { LitElement, html, nothing, unsafeCSS, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@lit-labs/virtualizer";
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
  getOrganizationKey,
  getStaffKey,
} from "./utils/directory-filter.utils";
import { parseEmailsInput } from "./utils/directory-validation.utils";
import { triggerFileDownload } from "./utils/download.utils";
import type { ImportKind } from "./utils/import-preview.utils";
import type {
  ActiveTab,
  OrganizationRecord,
  OrganizationSortMode,
  StaffRecord,
  StaffSortMode,
} from "./models/directory.model";

interface SortOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

const WIDE_LAYOUT_MEDIA_QUERY = "(min-width: 680px)";

const STAFF_SORT_OPTIONS: readonly SortOption<StaffSortMode>[] = [
  { value: "department", label: "所属部署・氏名" },
  { value: "name", label: "氏名" },
  { value: "staffId", label: "職員番号" },
] as const;

const ORGANIZATION_SORT_OPTIONS: readonly SortOption<OrganizationSortMode>[] = [
  { value: "registered", label: "登録順" },
  { value: "department", label: "組織名" },
  { value: "location", label: "場所" },
] as const;

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
  @state() private isWideLayout = false;

  private wideMediaQuery: MediaQueryList | undefined;
  private cachedStaffRendererVersion = -1;
  private cachedStaffRenderer:
    ((staff: StaffRecord, index: number) => TemplateResult) | undefined;

  private readonly handleWideMediaChange = (
    event: MediaQueryListEvent,
  ): void => {
    this.isWideLayout = event.matches;
  };

  private readonly staffKeyFunction = (staff: StaffRecord): string =>
    typeof staff.id === "number" ? `id:${staff.id}` : getStaffKey(staff);

  private readonly organizationKeyFunction = (
    org: OrganizationRecord,
  ): string =>
    typeof org.id === "number" ? `id:${org.id}` : getOrganizationKey(org);

  private readonly renderOrganizationItem = (
    org: OrganizationRecord,
    idx: number,
  ): TemplateResult => html`
    <div class="directory-card-list__item">
      ${renderOrganizationCard(org, idx, {
        onCopy: (label, value) => void this.controller.copyField(label, value),
        onCopyRecord: (target, format) =>
          void this.controller.copyOrganizationRecord(target, format),
        onEdit: (target) => {
          this.orgForm = createOrganizationFormState(target);
        },
        onDelete: (target) => this.openDeleteOrganization(target),
      })}
    </div>
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    if (
      typeof globalThis.window !== "undefined" &&
      typeof globalThis.window.matchMedia === "function"
    ) {
      this.wideMediaQuery = globalThis.window.matchMedia(
        WIDE_LAYOUT_MEDIA_QUERY,
      );
      this.isWideLayout = this.wideMediaQuery.matches;
      this.wideMediaQuery.addEventListener(
        "change",
        this.handleWideMediaChange,
      );
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.wideMediaQuery?.removeEventListener(
      "change",
      this.handleWideMediaChange,
    );
  }

  private getStaffItemRenderer(): (
    staff: StaffRecord,
    idx: number,
  ) => TemplateResult {
    const version = this.controller.expandedStaffVersion;
    if (
      this.cachedStaffRenderer &&
      this.cachedStaffRendererVersion === version
    ) {
      return this.cachedStaffRenderer;
    }

    this.cachedStaffRendererVersion = version;
    this.cachedStaffRenderer = (
      staff: StaffRecord,
      idx: number,
    ): TemplateResult => html`
      <div class="directory-card-list__item">
        ${renderStaffCard(staff, idx, {
          isEmailsExpanded: this.controller.isStaffEmailsExpanded(staff),
          onToggleEmails: (target) => this.controller.toggleStaffEmails(target),
          onJumpToDepartment: (dept) =>
            this.controller.jumpToOrganization(dept),
          onCopy: (label, value) =>
            void this.controller.copyField(label, value),
          onCopyRecord: (target, format) =>
            void this.controller.copyStaffRecord(target, format),
          onEdit: (target) => {
            this.staffForm = createStaffFormState(target);
          },
          onDelete: (target) => this.openDeleteStaff(target),
        })}
      </div>
    `;
    return this.cachedStaffRenderer;
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
          size="s"
          variant=${tabVariant("staff")}
          appearance=${tabAppearance("staff")}
          @click=${() => this.controller.setActiveTab("staff")}
        >
          <wa-icon slot="start" name="user-solid-full"></wa-icon>
          職員 (${filteredStaff.length})
        </wa-button>
        <wa-button
          class="hubaddress-shell__tab-btn hubaddress-shell__tab-btn--directory"
          size="s"
          variant=${tabVariant("organizations")}
          appearance=${tabAppearance("organizations")}
          @click=${() => this.controller.setActiveTab("organizations")}
        >
          <wa-icon slot="start" name="building-solid-full"></wa-icon>
          組織 (${filteredOrganizations.length})
        </wa-button>
        <wa-button
          class="hubaddress-shell__tab-btn"
          size="s"
          variant=${tabVariant("settings")}
          appearance=${tabAppearance("settings")}
          aria-pressed=${String(activeTab === "settings")}
          @click=${() => this.controller.toggleSettingsTab()}
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
    onInput: (nextValue: string) => void,
    onClear: () => void,
  ): TemplateResult {
    return html`
      <wa-input
        size="m"
        placeholder=${placeholder}
        .value=${value}
        with-clear
        @input=${(e: Event) => {
          const target = e.target as HTMLInputElement;
          onInput(target.value);
        }}
        @wa-clear=${onClear}
      >
        <wa-icon slot="start" name="magnifying-glass-solid-full"></wa-icon>
      </wa-input>
    `;
  }

  private renderLoadingState(): TemplateResult {
    return html`
      <div class="hubaddress-shell__loading" role="status">
        <wa-spinner></wa-spinner>
        <span>読み込み中...</span>
      </div>
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

  private getStaffSortLabel(mode: StaffSortMode): string {
    return (
      STAFF_SORT_OPTIONS.find((option) => option.value === mode)?.label ??
      "所属部署・氏名"
    );
  }

  private getOrganizationSortLabel(mode: OrganizationSortMode): string {
    return (
      ORGANIZATION_SORT_OPTIONS.find((option) => option.value === mode)
        ?.label ?? "登録順"
    );
  }

  private handleStaffSortSelect(
    event: CustomEvent<{ item?: { value?: string } }>,
  ): void {
    const value = event.detail?.item?.value;
    if (value === "department" || value === "name" || value === "staffId") {
      void this.controller.setStaffSortMode(value);
    }
  }

  private handleOrganizationSortSelect(
    event: CustomEvent<{ item?: { value?: string } }>,
  ): void {
    const value = event.detail?.item?.value;
    if (
      value === "registered" ||
      value === "department" ||
      value === "location"
    ) {
      void this.controller.setOrganizationSortMode(value);
    }
  }

  private renderSortDropdownItems<T extends string>(
    options: readonly SortOption<T>[],
    currentMode: T,
  ): TemplateResult[] {
    return options.map(
      (option) => html`
        <wa-dropdown-item
          type="checkbox"
          value=${option.value}
          ?checked=${currentMode === option.value}
        >
          ${option.label}
        </wa-dropdown-item>
      `,
    );
  }

  private renderStaffSortDropdown(): TemplateResult {
    const currentMode = this.controller.staffSortMode;
    const currentLabel = this.getStaffSortLabel(currentMode);

    return html`
      <wa-dropdown
        placement="bottom-end"
        @wa-select=${(e: CustomEvent<{ item?: { value?: string } }>) =>
          this.handleStaffSortSelect(e)}
      >
        <wa-button
          id="sort-staff-btn"
          slot="trigger"
          size="xs"
          variant="neutral"
          appearance="outlined"
          aria-label="職員一覧の並び順を切り替え"
        >
          <wa-icon name="arrow-down-wide-short-solid-full"></wa-icon>
        </wa-button>
        ${this.renderSortDropdownItems(STAFF_SORT_OPTIONS, currentMode)}
      </wa-dropdown>
      <wa-tooltip for="sort-staff-btn" trigger="hover"
        >並び順: ${currentLabel}</wa-tooltip
      >
    `;
  }

  private renderOrganizationSortDropdown(): TemplateResult {
    const currentMode = this.controller.organizationSortMode;
    const currentLabel = this.getOrganizationSortLabel(currentMode);

    return html`
      <wa-dropdown
        placement="bottom-end"
        @wa-select=${(e: CustomEvent<{ item?: { value?: string } }>) =>
          this.handleOrganizationSortSelect(e)}
      >
        <wa-button
          id="sort-organization-btn"
          slot="trigger"
          size="xs"
          variant="neutral"
          appearance="outlined"
          aria-label="組織一覧の並び順を切り替え"
        >
          <wa-icon name="arrow-down-wide-short-solid-full"></wa-icon>
        </wa-button>
        ${this.renderSortDropdownItems(ORGANIZATION_SORT_OPTIONS, currentMode)}
      </wa-dropdown>
      <wa-tooltip for="sort-organization-btn" trigger="hover"
        >並び順: ${currentLabel}</wa-tooltip
      >
    `;
  }

  private renderStaffColumn(): TemplateResult {
    const items = this.controller.filteredStaff;
    const isActive = this.controller.activeTab === "staff";
    const shouldRenderList = this.isWideLayout || isActive;

    return html`
      <section class="hubaddress-shell__column" data-active=${String(isActive)}>
        <div class="hubaddress-shell__column-toolbar">
          <div class="hubaddress-shell__column-bar">
            <h2 class="hubaddress-shell__column-heading">
              職員一覧 (${items.length})
            </h2>
            <div class="hubaddress-shell__column-actions">
              <wa-button
                id="copy-all-staff-btn"
                size="xs"
                variant="neutral"
                appearance="outlined"
                ?disabled=${items.length === 0}
                aria-label="表示中の職員をTSV形式でコピー"
                @click=${() => void this.controller.copyFilteredStaff()}
              >
                <wa-icon name="copy-solid-full"></wa-icon>
              </wa-button>
              <wa-tooltip for="copy-all-staff-btn" trigger="hover"
                >表示中の職員をコピー (${items.length}件)</wa-tooltip
              >
              ${this.renderStaffSortDropdown()} ${this.renderAddStaffButton()}
            </div>
          </div>
          ${this.renderSearchInput(
            "職員番号・氏名・所属・役職を検索...",
            this.controller.staffSearchQuery,
            (val) => this.controller.scheduleStaffSearchQuery(val),
            () => this.controller.setStaffSearchQuery(""),
          )}
        </div>
        ${shouldRenderList ? this.renderStaffList(items) : nothing}
      </section>
    `;
  }

  private renderAddStaffButton(): TemplateResult {
    return html`
      <wa-button
        id="add-staff-btn"
        size="xs"
        variant="brand"
        appearance="outlined"
        aria-label="職員を追加"
        @click=${() => {
          this.staffForm = createStaffFormState();
        }}
      >
        <wa-icon name="plus-solid-full"></wa-icon>
      </wa-button>
      <wa-tooltip for="add-staff-btn" trigger="hover">職員を追加</wa-tooltip>
    `;
  }

  private renderStaffList(items: StaffRecord[]): TemplateResult {
    if (this.controller.isLoading) {
      return this.renderLoadingState();
    }
    if (items.length === 0) {
      return html`<p class="hubaddress-shell__empty">
        該当する職員データがありません。
      </p>`;
    }

    return html`
      <lit-virtualizer
        scroller
        class="directory-card-list"
        .items=${items}
        .keyFunction=${this.staffKeyFunction}
        .renderItem=${this.getStaffItemRenderer()}
      ></lit-virtualizer>
    `;
  }

  private renderOrganizationColumn(): TemplateResult {
    const items = this.controller.filteredOrganizations;
    const isActive = this.controller.activeTab === "organizations";
    const shouldRenderList = this.isWideLayout || isActive;

    return html`
      <section class="hubaddress-shell__column" data-active=${String(isActive)}>
        <div class="hubaddress-shell__column-toolbar">
          <div class="hubaddress-shell__column-bar">
            <h2 class="hubaddress-shell__column-heading">
              組織一覧 (${items.length})
            </h2>
            <div class="hubaddress-shell__column-actions">
              <wa-button
                id="copy-all-organizations-btn"
                size="xs"
                variant="neutral"
                appearance="outlined"
                ?disabled=${items.length === 0}
                aria-label="表示中の組織をTSV形式でコピー"
                @click=${() => void this.controller.copyFilteredOrganizations()}
              >
                <wa-icon name="copy-solid-full"></wa-icon>
              </wa-button>
              <wa-tooltip for="copy-all-organizations-btn" trigger="hover"
                >表示中の組織をコピー (${items.length}件)</wa-tooltip
              >
              ${this.renderOrganizationSortDropdown()}
              ${this.renderAddOrganizationButton()}
            </div>
          </div>
          ${this.renderSearchInput(
            "所属・内線・外線・場所・備考を検索...",
            this.controller.organizationSearchQuery,
            (val) => this.controller.scheduleOrganizationSearchQuery(val),
            () => this.controller.setOrganizationSearchQuery(""),
          )}
        </div>
        ${shouldRenderList ? this.renderOrganizationList(items) : nothing}
      </section>
    `;
  }

  private renderAddOrganizationButton(): TemplateResult {
    return html`
      <wa-button
        id="add-organization-btn"
        size="xs"
        variant="brand"
        appearance="outlined"
        aria-label="組織を追加"
        @click=${() => {
          this.orgForm = createOrganizationFormState();
        }}
      >
        <wa-icon name="plus-solid-full"></wa-icon>
      </wa-button>
      <wa-tooltip for="add-organization-btn" trigger="hover"
        >組織を追加</wa-tooltip
      >
    `;
  }

  private renderOrganizationList(items: OrganizationRecord[]): TemplateResult {
    if (this.controller.isLoading) {
      return this.renderLoadingState();
    }
    if (items.length === 0) {
      return html`<p class="hubaddress-shell__empty">
        該当する組織データがありません。
      </p>`;
    }

    return html`
      <lit-virtualizer
        scroller
        class="directory-card-list"
        .items=${items}
        .keyFunction=${this.organizationKeyFunction}
        .renderItem=${this.renderOrganizationItem}
      ></lit-virtualizer>
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
          furigana: form.furigana,
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
        <main class="hubaddress-shell__body hubaddress-shell__body--scrollable">
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
      ${this.renderTabButtons()} ${this.renderBody()} ${this.renderDialogs()}
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
