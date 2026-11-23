import { html, nothing, type TemplateResult } from "lit";
import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";
import {
  formatStaffIdFiveDigits,
  getOrganizationKey,
  getStaffKey,
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
  id: string,
  label: string,
  value: string,
  onCopy: (label: string, value: string) => void,
): TemplateResult | typeof nothing {
  if (value.trim().length === 0) {
    return nothing;
  }

  return html`
    <button
      id=${id}
      type="button"
      class="directory-card__copy-btn"
      @click=${() => onCopy(label, value)}
    >
      <wa-icon name="copy-solid-full"></wa-icon>
      <span class="directory-card__copy-label">${label}:</span>
      <span class="directory-card__copy-value">${value}</span>
    </button>
    <wa-tooltip for=${id} trigger="hover">${label}をコピー</wa-tooltip>
  `;
}

function renderActionIconButton(
  id: string,
  iconName: string,
  label: string,
  onClick: () => void,
): TemplateResult {
  return html`
    <button
      id=${id}
      type="button"
      class="directory-card__action-btn"
      aria-label=${label}
      @click=${onClick}
    >
      <wa-icon name=${iconName}></wa-icon>
    </button>
    <wa-tooltip for=${id} trigger="hover">${label}</wa-tooltip>
  `;
}

function renderCardActions(
  prefix: string,
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
          ? renderActionIconButton(
              `${prefix}-edit`,
              "pen-to-square-solid-full",
              "編集",
              onEdit,
            )
          : nothing
      }
      ${
        onDelete
          ? renderActionIconButton(
              `${prefix}-delete`,
              "trash-solid-full",
              "削除",
              onDelete,
            )
          : nothing
      }
    </div>
  `;
}

function renderEmailToggleButton(
  staff: StaffRecord,
  safeKey: string,
  callbacks: StaffCardCallbacks,
): TemplateResult | typeof nothing {
  if (staff.emails.length === 0) {
    return nothing;
  }

  const toggleId = `staff-mail-toggle-${safeKey}`;
  const toggleLabel = callbacks.isEmailsExpanded
    ? "メールを隠す"
    : `メールを表示 (${staff.emails.length})`;

  return html`
    <div>
      <button
        id=${toggleId}
        type="button"
        class="directory-card__toggle-btn"
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
      <wa-tooltip for=${toggleId} trigger="hover">${toggleLabel}</wa-tooltip>
    </div>
  `;
}

function renderStaffMetaRow(
  staff: StaffRecord,
  safeKey: string,
  callbacks: StaffCardCallbacks,
): TemplateResult | typeof nothing {
  const hasDepartment = staff.department.trim().length > 0;
  if (!hasDepartment && staff.emails.length === 0) {
    return nothing;
  }

  const deptBtnId = `staff-dept-${safeKey}`;

  return html`
    <div class="directory-card__meta-row">
      ${
        hasDepartment
          ? html`
              <div>
                <button
                  id=${deptBtnId}
                  type="button"
                  class="directory-card__dept-btn"
                  @click=${() => callbacks.onJumpToDepartment(staff.department)}
                >
                  <wa-icon name="building-solid-full"></wa-icon>
                  <span>${staff.department}</span>
                </button>
                <wa-tooltip for=${deptBtnId} trigger="hover">
                  組織を検索
                </wa-tooltip>
              </div>
            `
          : html`<span></span>`
      }
      ${renderEmailToggleButton(staff, safeKey, callbacks)}
    </div>
  `;
}

function renderStaffEmails(
  emails: string[],
  safeKey: string,
  isExpanded: boolean,
  onCopy: (label: string, value: string) => void,
): TemplateResult | typeof nothing {
  if (!isExpanded || emails.length === 0) {
    return nothing;
  }

  return html`
    <div class="directory-card__contacts">
      ${emails.map((email, emailIdx) =>
        renderCopyChip(
          `staff-email-${safeKey}-${emailIdx}`,
          "メール",
          email,
          onCopy,
        ),
      )}
    </div>
  `;
}

function renderOrganizationContacts(
  org: OrganizationRecord,
  safeKey: string,
  onCopy: (label: string, value: string) => void,
): TemplateResult {
  return html`
    <div class="directory-card__contacts">
      ${renderCopyChip(
        `org-ext-${safeKey}`,
        "内線",
        org.extensionNumber,
        onCopy,
      )}
      ${renderCopyChip(`org-tel-${safeKey}`, "外線", org.phoneNumber, onCopy)}
      ${renderCopyChip(`org-fax-${safeKey}`, "FAX", org.faxNumber, onCopy)}
    </div>
  `;
}

/**
 * 職員カードのテンプレートをレンダリングする
 */
export function renderStaffCard(
  staff: StaffRecord,
  index: number,
  callbacks: StaffCardCallbacks,
): TemplateResult {
  const safeKey = `${getStaffKey(staff).replace(/[^a-zA-Z0-9_-]/g, "_")}-${index}`;
  const formattedId = formatStaffIdFiveDigits(staff.staffId);
  const onEdit = callbacks.onEdit ? () => callbacks.onEdit?.(staff) : undefined;
  const onDelete = callbacks.onDelete
    ? () => callbacks.onDelete?.(staff)
    : undefined;

  return html`
    <article class="directory-card">
      <div class="directory-card__header">
        <div class="directory-card__title-group">
          ${
            formattedId
              ? html`<wa-badge
                  class="directory-card__staff-id"
                  variant="neutral"
                  >${formattedId}</wa-badge
                >`
              : nothing
          }
          <h3 class="directory-card__name">
            ${staff.name || "（氏名未設定）"}
          </h3>
          ${
            staff.title
              ? html`<span class="directory-card__sub">${staff.title}</span>`
              : nothing
          }
        </div>
        ${renderCardActions(`staff-${safeKey}`, onEdit, onDelete)}
      </div>
      ${renderStaffMetaRow(staff, safeKey, callbacks)}
      ${renderStaffEmails(
        staff.emails,
        safeKey,
        callbacks.isEmailsExpanded,
        callbacks.onCopy,
      )}
    </article>
  `;
}

function renderOrganizationHeader(
  org: OrganizationRecord,
  safeKey: string,
  callbacks: OrganizationCardCallbacks,
): TemplateResult {
  const onEdit = callbacks.onEdit ? () => callbacks.onEdit?.(org) : undefined;
  const onDelete = callbacks.onDelete
    ? () => callbacks.onDelete?.(org)
    : undefined;

  return html`
    <div class="directory-card__header">
      <div class="directory-card__title-group">
        <h3 class="directory-card__name">
          ${org.department || "（所属未設定）"}
        </h3>
        ${org.title ? html`<wa-tag size="small">${org.title}</wa-tag>` : nothing}
      </div>
      ${renderCardActions(`org-${safeKey}`, onEdit, onDelete)}
    </div>
  `;
}

/**
 * 組織カードのテンプレートをレンダリングする
 */
export function renderOrganizationCard(
  org: OrganizationRecord,
  index: number,
  callbacks: OrganizationCardCallbacks,
): TemplateResult {
  const orgKey = getOrganizationKey(org);
  const safeKey = `${orgKey.replace(/[^a-zA-Z0-9_-]/g, "_")}-${index}`;
  const placeInfo = [org.extra, org.location].filter(Boolean).join(" / ");

  return html`
    <article class="directory-card" data-org-key=${orgKey}>
      ${renderOrganizationHeader(org, safeKey, callbacks)}
      ${renderOrganizationContacts(org, safeKey, callbacks.onCopy)}
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
