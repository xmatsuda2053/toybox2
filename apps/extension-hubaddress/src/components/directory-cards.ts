import { html, nothing, type TemplateResult } from "lit";
import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";
import {
  getOrganizationKey,
  getStaffKey,
} from "../utils/directory-filter.utils";

export interface StaffCardCallbacks {
  onJumpToDepartment: (department: string) => void;
  onCopy: (label: string, value: string) => void;
  onEdit?: (staff: StaffRecord) => void;
  onDelete?: (staff: StaffRecord) => void;
}

export interface OrganizationCardCallbacks {
  isHighlighted: boolean;
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
    <wa-button
      id=${id}
      size="small"
      appearance="plain"
      aria-label=${label}
      @click=${onClick}
    >
      <wa-icon name=${iconName}></wa-icon>
    </wa-button>
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

function renderStaffDepartment(
  staff: StaffRecord,
  safeKey: string,
  onJumpToDepartment: (department: string) => void,
): TemplateResult | typeof nothing {
  if (!staff.department) {
    return nothing;
  }

  const deptBtnId = `staff-dept-${safeKey}`;
  return html`
    <div>
      <button
        id=${deptBtnId}
        type="button"
        class="directory-card__dept-btn"
        @click=${() => onJumpToDepartment(staff.department)}
      >
        <wa-icon name="building-solid-full"></wa-icon>
        <span>${staff.department}</span>
      </button>
      <wa-tooltip for=${deptBtnId} trigger="hover">組織情報を表示</wa-tooltip>
    </div>
  `;
}

function renderStaffEmails(
  emails: string[],
  safeKey: string,
  onCopy: (label: string, value: string) => void,
): TemplateResult | typeof nothing {
  if (emails.length === 0) {
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
  const onEdit = callbacks.onEdit ? () => callbacks.onEdit?.(staff) : undefined;
  const onDelete = callbacks.onDelete
    ? () => callbacks.onDelete?.(staff)
    : undefined;

  return html`
    <article class="directory-card">
      <div class="directory-card__header">
        <div class="directory-card__title-group">
          <h3 class="directory-card__name">
            ${staff.name || "（氏名未設定）"}
          </h3>
          ${
            staff.staffId
              ? html`<wa-badge variant="neutral">${staff.staffId}</wa-badge>`
              : nothing
          }
          ${
            staff.title
              ? html`<span class="directory-card__sub">${staff.title}</span>`
              : nothing
          }
        </div>
        ${renderCardActions(`staff-${safeKey}`, onEdit, onDelete)}
      </div>
      ${renderStaffDepartment(staff, safeKey, callbacks.onJumpToDepartment)}
      ${renderStaffEmails(staff.emails, safeKey, callbacks.onCopy)}
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
  const cardClass = callbacks.isHighlighted
    ? "directory-card directory-card--highlighted"
    : "directory-card";
  const placeInfo = [org.extra, org.location].filter(Boolean).join(" / ");

  return html`
    <article class=${cardClass} data-org-key=${orgKey}>
      ${renderOrganizationHeader(org, safeKey, callbacks)}
      ${
        placeInfo
          ? html`<div class="directory-card__sub">${placeInfo}</div>`
          : nothing
      }
      ${renderOrganizationContacts(org, safeKey, callbacks.onCopy)}
      ${
        org.notes
          ? html`<p class="directory-card__notes">${org.notes}</p>`
          : nothing
      }
    </article>
  `;
}
