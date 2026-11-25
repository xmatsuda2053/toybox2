import { html, nothing, type TemplateResult } from "lit";
import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";
import {
  formatStaffIdFiveDigits,
  getOrganizationKey,
} from "../utils/directory-filter.utils";

export interface StaffCardCallbacks {
  isEmailsExpanded: boolean;
  onToggleEmails: (staff: StaffRecord) => void;
  onJumpToDepartment: (department: string) => void;
  onCopy: (label: string, value: string) => void;
  onEdit?: (staff: StaffRecord) => void;
  onDelete?: (staff: StaffRecord) => void;
}

export interface OrganizationCardCallbacks {
  onCopy: (label: string, value: string) => void;
  onEdit?: (org: OrganizationRecord) => void;
  onDelete?: (org: OrganizationRecord) => void;
}

function renderCopyChip(
  iconName: string,
  label: string,
  value: string,
  onCopy: (label: string, value: string) => void,
): TemplateResult | typeof nothing {
  if (value.trim().length === 0) {
    return nothing;
  }

  return html`
    <button
      type="button"
      class="directory-card__copy-btn"
      title=${`${label}をコピー`}
      aria-label=${`${label} ${value} をコピー`}
      @click=${() => onCopy(label, value)}
    >
      <wa-icon name=${iconName}></wa-icon>
      <span class="directory-card__copy-value">${value}</span>
    </button>
  `;
}

function renderActionIconButton(
  iconName: string,
  label: string,
  onClick: () => void,
): TemplateResult {
  return html`
    <button
      type="button"
      class="directory-card__action-btn"
      title=${label}
      aria-label=${label}
      @click=${onClick}
    >
      <wa-icon name=${iconName}></wa-icon>
    </button>
  `;
}

function renderCardActions(
  onEdit?: () => void,
  onDelete?: () => void,
): TemplateResult | typeof nothing {
  if (!onEdit && !onDelete) {
    return nothing;
  }

  return html`
    <div class="directory-card__actions">
      ${
        onEdit
          ? renderActionIconButton("pen-to-square-solid-full", "編集", onEdit)
          : nothing
      }
      ${
        onDelete
          ? renderActionIconButton("trash-solid-full", "削除", onDelete)
          : nothing
      }
    </div>
  `;
}

function renderEmailToggleButton(
  staff: StaffRecord,
  callbacks: StaffCardCallbacks,
): TemplateResult | typeof nothing {
  if (staff.emails.length === 0) {
    return nothing;
  }

  const toggleLabel = callbacks.isEmailsExpanded
    ? "メールを隠す"
    : `メールを表示 (${staff.emails.length})`;

  return html`
    <button
      type="button"
      class="directory-card__toggle-btn"
      title=${toggleLabel}
      aria-label=${toggleLabel}
      aria-expanded=${String(callbacks.isEmailsExpanded)}
      @click=${() => callbacks.onToggleEmails(staff)}
    >
      <wa-icon name="envelope-solid-full"></wa-icon>
      <wa-icon
        name=${
          callbacks.isEmailsExpanded
            ? "angle-up-solid-full"
            : "angle-down-solid-full"
        }
      ></wa-icon>
    </button>
  `;
}

function renderStaffMetaRow(
  staff: StaffRecord,
  callbacks: StaffCardCallbacks,
): TemplateResult | typeof nothing {
  const hasDepartment = staff.department.trim().length > 0;
  if (!hasDepartment && staff.emails.length === 0) {
    return nothing;
  }

  return html`
    <div class="directory-card__meta-row">
      ${
        hasDepartment
          ? html`
              <button
                type="button"
                class="directory-card__dept-btn"
                title="組織を検索"
                @click=${() => callbacks.onJumpToDepartment(staff.department)}
              >
                <wa-icon name="building-solid-full"></wa-icon>
                <span>${staff.department}</span>
              </button>
            `
          : html`<span></span>`
      }
      ${renderEmailToggleButton(staff, callbacks)}
    </div>
  `;
}

function renderStaffEmails(
  emails: string[],
  isExpanded: boolean,
  onCopy: (label: string, value: string) => void,
): TemplateResult | typeof nothing {
  if (!isExpanded || emails.length === 0) {
    return nothing;
  }

  return html`
    <div class="directory-card__contacts">
      ${emails.map((email) =>
        renderCopyChip("envelope-solid-full", "メール", email, onCopy),
      )}
    </div>
  `;
}

function renderOrganizationContacts(
  org: OrganizationRecord,
  onCopy: (label: string, value: string) => void,
): TemplateResult {
  return html`
    <div class="directory-card__contacts">
      ${renderCopyChip("hashtag-solid-full", "内線", org.extensionNumber, onCopy)}
      ${renderCopyChip("phone-solid-full", "外線", org.phoneNumber, onCopy)}
      ${renderCopyChip("fax-solid-full", "FAX", org.faxNumber, onCopy)}
    </div>
  `;
}

function renderStaffIdBadge(
  formattedId: string,
  onCopy: (label: string, value: string) => void,
): TemplateResult | typeof nothing {
  if (!formattedId) {
    return nothing;
  }

  return html`
    <button
      type="button"
      class="directory-card__inline-copy-btn"
      title="職員番号をコピー"
      aria-label=${`職員番号 ${formattedId} をコピー`}
      @click=${() => onCopy("職員番号", formattedId)}
    >
      <wa-badge class="directory-card__staff-id" variant="neutral"
        >${formattedId}</wa-badge
      >
    </button>
  `;
}

function renderStaffNameHeading(
  trimmedName: string,
  onCopy: (label: string, value: string) => void,
): TemplateResult {
  if (!trimmedName) {
    return html`<h3 class="directory-card__name">（氏名未設定）</h3>`;
  }

  return html`
    <h3 class="directory-card__name">
      <button
        type="button"
        class="directory-card__name-copy-btn"
        title="氏名をコピー"
        @click=${() => onCopy("氏名", trimmedName)}
      >
        ${trimmedName}
      </button>
    </h3>
  `;
}

function renderStaffName(
  staff: StaffRecord,
  onCopy: (label: string, value: string) => void,
): TemplateResult {
  const trimmedName = staff.name.trim();
  const trimmedFurigana = (staff.furigana ?? "").trim();
  const trimmedTitle = staff.title.trim();

  return html`
    <div class="directory-card__name-stack">
      ${
        trimmedFurigana
          ? html`<span class="directory-card__furigana"
              >${trimmedFurigana}</span
            >`
          : nothing
      }
      <div class="directory-card__name-row">
        ${renderStaffNameHeading(trimmedName, onCopy)}
      </div>
      ${
        trimmedTitle
          ? html`<span class="directory-card__sub" title=${trimmedTitle}
              >${trimmedTitle}</span
            >`
          : nothing
      }
    </div>
  `;
}

/**
 * 職員カードのテンプレートをレンダリングする
 */
export function renderStaffCard(
  staff: StaffRecord,
  _index: number,
  callbacks: StaffCardCallbacks,
): TemplateResult {
  const formattedId = formatStaffIdFiveDigits(staff.staffId);
  const onEdit = callbacks.onEdit ? () => callbacks.onEdit?.(staff) : undefined;
  const onDelete = callbacks.onDelete
    ? () => callbacks.onDelete?.(staff)
    : undefined;

  return html`
    <article class="directory-card">
      <div class="directory-card__header">
        <div
          class="directory-card__title-group directory-card__title-group--staff"
        >
          ${renderStaffIdBadge(formattedId, callbacks.onCopy)}
          ${renderStaffName(staff, callbacks.onCopy)}
        </div>
        ${renderCardActions(onEdit, onDelete)}
      </div>
      ${renderStaffMetaRow(staff, callbacks)}
      ${renderStaffEmails(
        staff.emails,
        callbacks.isEmailsExpanded,
        callbacks.onCopy,
      )}
    </article>
  `;
}

function renderOrganizationName(
  department: string,
  onCopy: (label: string, value: string) => void,
): TemplateResult {
  const trimmedDepartment = department.trim();
  if (!trimmedDepartment) {
    return html`<h3 class="directory-card__name">（所属未設定）</h3>`;
  }

  return html`
    <h3 class="directory-card__name">
      <button
        type="button"
        class="directory-card__name-copy-btn"
        title="組織名をコピー"
        @click=${() => onCopy("組織名", trimmedDepartment)}
      >
        ${trimmedDepartment}
      </button>
    </h3>
  `;
}

function renderOrganizationHeader(
  org: OrganizationRecord,
  callbacks: OrganizationCardCallbacks,
): TemplateResult {
  const onEdit = callbacks.onEdit ? () => callbacks.onEdit?.(org) : undefined;
  const onDelete = callbacks.onDelete
    ? () => callbacks.onDelete?.(org)
    : undefined;

  return html`
    <div class="directory-card__header">
      <div class="directory-card__title-group">
        ${renderOrganizationName(org.department, callbacks.onCopy)}
        ${org.title ? html`<wa-tag size="s">${org.title}</wa-tag>` : nothing}
      </div>
      ${renderCardActions(onEdit, onDelete)}
    </div>
  `;
}

/**
 * 組織カードのテンプレートをレンダリングする
 */
export function renderOrganizationCard(
  org: OrganizationRecord,
  _index: number,
  callbacks: OrganizationCardCallbacks,
): TemplateResult {
  const orgKey = getOrganizationKey(org);
  const placeInfo = [org.location, org.extra].filter(Boolean).join(" / ");

  return html`
    <article class="directory-card" data-org-key=${orgKey}>
      ${renderOrganizationHeader(org, callbacks)}
      ${renderOrganizationContacts(org, callbacks.onCopy)}
      ${
        placeInfo
          ? html`
              <div class="directory-card__place">
                <wa-icon name="location-dot-solid-full"></wa-icon>
                <span>${placeInfo}</span>
              </div>
            `
          : nothing
      }
      ${
        org.notes
          ? html`<p class="directory-card__notes">${org.notes}</p>`
          : nothing
      }
    </article>
  `;
}
