import { LitElement, html, nothing, unsafeCSS, type TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import shellStyles from "./hubaddress-app.scss?inline";
import cardStyles from "./components/directory-cards.scss?inline";
import { DirectoryController } from "./controllers/directory.controller";
import {
  renderOrganizationCard,
  renderStaffCard,
} from "./components/directory-cards";
import {
  getOrganizationFavoriteKey,
  getStaffFavoriteKey,
} from "./utils/directory-filter.utils";
import type { ActiveTab } from "./models/directory.model";

/**
 * HubAddress Side Panel アプリケーションルートコンポーネント
 */
@customElement("hubaddress-app")
export class HubAddressApp extends LitElement {
  static styles = [unsafeCSS(shellStyles), unsafeCSS(cardStyles)];

  readonly controller = new DirectoryController(this);

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

  private renderStaffColumn(): TemplateResult {
    const items = this.controller.filteredStaff;
    const isActive = this.controller.activeTab === "staff";

    return html`
      <section class="hubaddress-shell__column" data-active=${String(isActive)}>
        <h2 class="hubaddress-shell__column-heading">
          職員一覧 (${items.length})
        </h2>
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
        <h2 class="hubaddress-shell__column-heading">
          組織一覧 (${items.length})
        </h2>
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
                    });
                  })}
                </div>
              `
        }
      </section>
    `;
  }

  private renderBody(): TemplateResult {
    if (this.controller.activeTab === "settings") {
      return html`
        <main class="hubaddress-shell__body">
          <wa-callout variant="neutral">
            CSV / JSON インポート・エクスポート、手動編集、テーマ設定は Phase 3
            で追加されます。
          </wa-callout>
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

  override render(): TemplateResult {
    const { toastMessage } = this.controller;

    return html`
      ${this.renderHeader()} ${this.renderTabButtons()}
      ${this.renderFilterBar()} ${this.renderBody()}
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
