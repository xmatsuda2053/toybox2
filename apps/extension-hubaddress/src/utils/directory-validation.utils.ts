import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";

/**
 * カンマ・セミコロン・改行・空白区切りのメールアドレス文字列を配列へ正規化する
 */
export function parseEmailsInput(raw: string): string[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return [];
  }

  return trimmed
    .split(/[,;\s]+/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

/**
 * 職員入力値の前後余白を正規化する
 */
export function normalizeStaffInput(
  input: Omit<StaffRecord, "id">,
): Omit<StaffRecord, "id"> {
  return {
    staffId: input.staffId.trim(),
    name: input.name.trim(),
    furigana: (input.furigana ?? "").trim(),
    department: input.department.trim(),
    title: input.title.trim(),
    emails: input.emails
      .map((email) => email.trim())
      .filter((email) => email.length > 0),
  };
}

/**
 * 組織入力値の前後余白を正規化する
 */
export function normalizeOrganizationInput(
  input: Omit<OrganizationRecord, "id">,
): Omit<OrganizationRecord, "id"> {
  return {
    department: input.department.trim(),
    extra: input.extra.trim(),
    location: input.location.trim(),
    title: input.title.trim(),
    extensionNumber: input.extensionNumber.trim(),
    phoneNumber: input.phoneNumber.trim(),
    faxNumber: input.faxNumber.trim(),
    notes: input.notes.trim(),
  };
}

/**
 * 職員入力値のバリデーションを実行する
 */
export function validateStaffInput(input: Omit<StaffRecord, "id">): string[] {
  const normalized = normalizeStaffInput(input);
  const errors: string[] = [];

  if (normalized.name.length === 0) {
    errors.push("氏名は必須です。");
  }

  return errors;
}

/**
 * 組織入力値のバリデーションを実行する
 */
export function validateOrganizationInput(
  input: Omit<OrganizationRecord, "id">,
): string[] {
  const normalized = normalizeOrganizationInput(input);
  const errors: string[] = [];

  if (normalized.department.length === 0) {
    errors.push("所属は必須です。");
  }

  return errors;
}
