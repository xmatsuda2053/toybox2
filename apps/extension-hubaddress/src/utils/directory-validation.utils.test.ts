import { describe, it, expect } from "vitest";
import {
  normalizeStaffInput,
  normalizeOrganizationInput,
  validateStaffInput,
  validateOrganizationInput,
  parseEmailsInput,
} from "./directory-validation.utils";

/**
 * テスト仕様: GUI 入力フォームバリデーション・正規化 (directory-validation.utils.ts)
 *
 * - 仕様1: parseEmailsInput でカンマ・セミコロン・改行・空白区切りのメールアドレスを配列に正規化できること
 * - 仕様2: validateStaffInput で氏名未入力時にエラーを返し、有効入力時は空配列を返すこと
 * - 仕様3: validateOrganizationInput で所属未入力時にエラーを返し、有効入力時は空配列を返すこと
 * - 仕様4: normalizeStaffInput / normalizeOrganizationInput で前後余白がトリミングされること
 */
describe("Directory Validation Utils Tests", () => {
  it("parseEmailsInput で複数区切りのメールアドレスを正規化できること", () => {
    expect(
      parseEmailsInput(" a@example.com, b@example.com;\nc@example.com  "),
    ).toEqual(["a@example.com", "b@example.com", "c@example.com"]);
    expect(parseEmailsInput("   ")).toEqual([]);
  });

  it("validateStaffInput で氏名が空の場合にバリデーションエラーを返すこと", () => {
    expect(
      validateStaffInput({
        staffId: "001",
        name: "   ",
        department: "総務課",
        title: "",
        emails: [],
      }),
    ).toEqual(["氏名は必須です。"]);

    expect(
      validateStaffInput({
        staffId: "",
        name: "田中 太郎",
        department: "",
        title: "",
        emails: [],
      }),
    ).toEqual([]);
  });

  it("validateOrganizationInput で所属が空の場合にバリデーションエラーを返すこと", () => {
    expect(
      validateOrganizationInput({
        department: " ",
        extra: "",
        location: "",
        title: "",
        extensionNumber: "",
        phoneNumber: "",
        faxNumber: "",
        notes: "",
      }),
    ).toEqual(["所属は必須です。"]);

    expect(
      validateOrganizationInput({
        department: "総務部 総務課",
        extra: "",
        location: "",
        title: "",
        extensionNumber: "",
        phoneNumber: "",
        faxNumber: "",
        notes: "",
      }),
    ).toEqual([]);
  });

  it("normalizeStaffInput / normalizeOrganizationInput で各フィールドの余白をトリミングできること", () => {
    expect(
      normalizeStaffInput({
        staffId: " 001 ",
        name: " 田中 太郎 ",
        department: " 総務課 ",
        title: " 課長 ",
        emails: [" a@example.com ", ""],
      }),
    ).toEqual({
      staffId: "001",
      name: "田中 太郎",
      department: "総務課",
      title: "課長",
      emails: ["a@example.com"],
    });

    expect(
      normalizeOrganizationInput({
        department: " 総務課 ",
        extra: " 本庁舎 ",
        location: " 3F ",
        title: " 課長席 ",
        extensionNumber: " 2101 ",
        phoneNumber: " 03-1234-2101 ",
        faxNumber: " 03-1234-2109 ",
        notes: " 代表 ",
      }),
    ).toEqual({
      department: "総務課",
      extra: "本庁舎",
      location: "3F",
      title: "課長席",
      extensionNumber: "2101",
      phoneNumber: "03-1234-2101",
      faxNumber: "03-1234-2109",
      notes: "代表",
    });
  });
});
