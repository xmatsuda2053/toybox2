import { describe, it, expect } from "vitest";
import {
  DIRECTORY_JSON_VERSION,
  serializeDirectoryJson,
  parseDirectoryJson,
} from "./json-codec";
import type {
  OrganizationRecord,
  StaffRecord,
} from "../models/directory.model";

/**
 * テスト仕様: JSON シリアライザー・パーサー (json-codec.ts)
 *
 * - 仕様1: 職員・組織レコードを version / exportedAt / staff / organizations を持つ一括 JSON にシリアライズできること
 * - 仕様2: シリアライズ結果から内部 ID (id) が除外されること
 * - 仕様3: parseDirectoryJson で正常な JSON から職員・組織配列を復元でき、ラウンドトリップが成立すること
 * - 仕様4: 不正な JSON 文字列や必須配列が欠損したオブジェクトが渡された場合に明確なエラーをスローすること
 */
describe("JSON Codec Tests", () => {
  it("職員・組織を一括 JSON にシリアライズでき、内部 id が除外されること", () => {
    const staff: StaffRecord[] = [
      {
        id: 1,
        staffId: "0010001",
        name: "田中 太郎",
        department: "総務部 総務課",
        title: "課長",
        emails: ["tanaka@example.com"],
      },
    ];
    const organizations: OrganizationRecord[] = [
      {
        id: 5,
        department: "総務部 総務課",
        extra: "本庁舎 3階",
        location: "3F-A",
        title: "課長席",
        extensionNumber: "2101",
        phoneNumber: "03-1234-2101",
        faxNumber: "03-1234-2109",
        notes: "代表窓口",
      },
    ];

    const json = serializeDirectoryJson(
      staff,
      organizations,
      "2026-11-23T00:00:00.000Z",
    );
    const parsed = JSON.parse(json) as Record<string, unknown>;

    expect(parsed.version).toBe(DIRECTORY_JSON_VERSION);
    expect(parsed.exportedAt).toBe("2026-11-23T00:00:00.000Z");
    expect((parsed.staff as Record<string, unknown>[])[0]).not.toHaveProperty(
      "id",
    );
    expect(
      (parsed.organizations as Record<string, unknown>[])[0],
    ).not.toHaveProperty("id");
  });

  it("parseDirectoryJson でシリアライズ済み JSON を復元できること", () => {
    const staff: StaffRecord[] = [
      {
        id: 1,
        staffId: "001",
        name: " 佐藤 花子 ",
        department: "人事課",
        title: "主査",
        emails: [" sato@example.com ", ""],
      },
    ];
    const organizations: OrganizationRecord[] = [
      {
        id: 2,
        department: "人事課",
        extra: "3F",
        location: "3F-B",
        title: "",
        extensionNumber: "2102",
        phoneNumber: "03-1234-2102",
        faxNumber: "",
        notes: "",
      },
    ];

    const json = serializeDirectoryJson(staff, organizations);
    const restored = parseDirectoryJson(json);

    expect(restored.staff).toEqual([
      {
        staffId: "001",
        name: "佐藤 花子",
        department: "人事課",
        title: "主査",
        emails: ["sato@example.com"],
      },
    ]);
    expect(restored.organizations).toEqual([
      {
        department: "人事課",
        extra: "3F",
        location: "3F-B",
        title: "",
        extensionNumber: "2102",
        phoneNumber: "03-1234-2102",
        faxNumber: "",
        notes: "",
      },
    ]);
  });

  it("不正な JSON 文字列や必須フィールド欠損時にエラーをスローすること", () => {
    expect(() => parseDirectoryJson("{invalid")).toThrow();
    expect(() => parseDirectoryJson("null")).toThrow();
    expect(() => parseDirectoryJson(JSON.stringify({ staff: [] }))).toThrow();
    expect(() =>
      parseDirectoryJson(JSON.stringify({ organizations: [] })),
    ).toThrow();
  });
});
