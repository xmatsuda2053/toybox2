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
      id=${id}
      type="button"
      class="directory-card__copy-btn"
      aria-label=${`${label} ${value} をコピー`}
      @click=${() => onCopy(label, value)}
    >
      <wa-icon name=${iconName}></wa-icon>
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
          "envelope-solid-full",
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
        "hashtag-solid-full",
        "内線",
        org.extensionNumber,
        onCopy,
      )}
      ${renderCopyChip(
        `org-tel-${safeKey}`,
        "phone-solid-full",
        "外線",
        org.phoneNumber,
        onCopy,
      )}
      ${renderCopyChip(
        `org-fax-${safeKey}`,
        "fax-solid-full",
        "FAX",
        org.faxNumber,
        onCopy,
      )}
    </div>
  `;
}

function renderStaffIdBadge(
  formattedId: string,
  safeKey: string,
  onCopy: (label: string, value: string) => void,
): TemplateResult | typeof nothing {
  if (!formattedId) {
    return nothing;
  }

  const staffIdBtnId = `staff-id-${safeKey}`;
  return html`
    <button
      id=${staffIdBtnId}
      type="button"
      class="directory-card__inline-copy-btn"
      aria-label=${`職員番号 ${formattedId} をコピー`}
      @click=${() => onCopy("職員番号", formattedId)}
    >
      <wa-badge class="directory-card__staff-id" variant="neutral"
        >${formattedId}</wa-badge
      >
    </button>
    <wa-tooltip for=${staffIdBtnId} trigger="hover">
      職員番号をコピー
    </wa-tooltip>
  `;
}

function renderStaffNameHeading(
  trimmedName: string,
  safeKey: string,
  onCopy: (label: string, value: string) => void,
): TemplateResult {
  if (!trimmedName) {
    return html`<h3 class="directory-card__name">（氏名未設定）</h3>`;
  }

  const nameBtnId = `staff-name-${safeKey}`;
  return html`
    <h3 class="directory-card__name">
      <button
        id=${nameBtnId}
        type="button"
        class="directory-card__name-copy-btn"
        @click=${() => onCopy("氏名", trimmedName)}
      >
        ${trimmedName}
      </button>
      <wa-tooltip for=${nameBtnId} trigger="hover">氏名をコピー</wa-tooltip>
    </h3>
  `;
}

function renderStaffName(
  staff: StaffRecord,
  safeKey: string,
  onCopy: (label: string, value: string) => void,
): TemplateResult {
  const trimmedName = staff.name.trim();
  const trimmedFurigana = (staff.furigana ?? "").trim();

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
        ${renderStaffNameHeading(trimmedName, safeKey, onCopy)}
        ${
          staff.title
            ? html`<span class="directory-card__sub">${staff.title}</span>`
            : nothing
        }
      </div>
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
        <div
          class="directory-card__title-group directory-card__title-group--staff"
        >
          ${renderStaffIdBadge(formattedId, safeKey, callbacks.onCopy)}
          ${renderStaffName(staff, safeKey, callbacks.onCopy)}
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

function renderOrganizationName(
  department: string,
  safeKey: string,
  onCopy: (label: string, value: string) => void,
): TemplateResult {
  const trimmedDepartment = department.trim();
  if (!trimmedDepartment) {
    return html`<h3 class="directory-card__name">（所属未設定）</h3>`;
  }

  const orgNameBtnId = `org-name-${safeKey}`;
  return html`
    <h3 class="directory-card__name">
      <button
        id=${orgNameBtnId}
        type="button"
        class="directory-card__name-copy-btn"
        @click=${() => onCopy("組織名", trimmedDepartment)}
      >
        ${trimmedDepartment}
      </button>
      <wa-tooltip for=${orgNameBtnId} trigger="hover">
        組織名をコピー
      </wa-tooltip>
    </h3>
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
        ${renderOrganizationName(org.department, safeKey, callbacks.onCopy)}
        ${org.title ? html`<wa-tag size="s">${org.title}</wa-tag>` : nothing}
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
  const placeInfo = [org.location, org.extra].filter(Boolean).join(" / ");

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
