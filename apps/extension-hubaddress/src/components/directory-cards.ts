import { html, nothing, type TemplateResult } from "lit";
import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";
import {
  getOrganizationFavoriteKey,
  getStaffFavoriteKey,
} from "../utils/directory-filter.utils";

export interface StaffCardCallbacks {
  isFavorite: boolean;
  onToggleFavorite: (staff: StaffRecord) => void;
  onJumpToDepartment: (department: string) => void;
  onCopy: (label: string, value: string) => void;
}

export interface OrganizationCardCallbacks {
  isFavorite: boolean;
  isHighlighted: boolean;
  onToggleFavorite: (org: OrganizationRecord) => void;
  onCopy: (label: string, value: string) => void;
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

function renderFavoriteButton(
  id: string,
  isFavorite: boolean,
  onClick: () => void,
): TemplateResult {
  const label = isFavorite ? "お気に入りから解除" : "お気に入りに登録";
  const btnClass = isFavorite
    ? "directory-card__fav-btn directory-card__fav-btn--active"
    : "directory-card__fav-btn";

  return html`
    <wa-button
      id=${id}
      class=${btnClass}
      size="small"
      appearance="plain"
      aria-label=${label}
      @click=${onClick}
    >
      <wa-icon name="bookmark-solid-full"></wa-icon>
    </wa-button>
    <wa-tooltip for=${id} trigger="hover">${label}</wa-tooltip>
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
  const safeKey = `${getStaffFavoriteKey(staff).replace(/[^a-zA-Z0-9_-]/g, "_")}-${index}`;
  const cardClass = callbacks.isFavorite
    ? "directory-card directory-card--favorite"
    : "directory-card";

  return html`
    <article class=${cardClass}>
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
        ${renderFavoriteButton(
          `staff-fav-${safeKey}`,
          callbacks.isFavorite,
          () => callbacks.onToggleFavorite(staff),
        )}
      </div>
      ${renderStaffDepartment(staff, safeKey, callbacks.onJumpToDepartment)}
      ${renderStaffEmails(staff.emails, safeKey, callbacks.onCopy)}
    </article>
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
  const orgKey = getOrganizationFavoriteKey(org);
  const safeKey = `${orgKey.replace(/[^a-zA-Z0-9_-]/g, "_")}-${index}`;
  const classes = [
    "directory-card",
    callbacks.isFavorite ? "directory-card--favorite" : "",
    callbacks.isHighlighted ? "directory-card--highlighted" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const placeInfo = [org.extra, org.location].filter(Boolean).join(" / ");

  return html`
    <article class=${classes} data-org-key=${orgKey}>
      <div class="directory-card__header">
        <div class="directory-card__title-group">
          <h3 class="directory-card__name">
            ${org.department || "（所属未設定）"}
          </h3>
          ${
            org.title
              ? html`<wa-tag size="small">${org.title}</wa-tag>`
              : nothing
          }
        </div>
        ${renderFavoriteButton(`org-fav-${safeKey}`, callbacks.isFavorite, () =>
          callbacks.onToggleFavorite(org),
        )}
      </div>
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
