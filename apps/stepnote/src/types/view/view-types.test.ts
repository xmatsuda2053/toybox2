/**
 * テスト仕様:
 * 1. Log型がLogRecord型と完全一致していること
 * 2. Note型がNoteRecord型と完全一致していること
 * 3. QuickAccess型がOmit<QuickAccessRecord, "id">と完全一致していること
 * 4. Label型がLabelRecord型と完全一致していること
 * 5. Summary型がPick<TaskRecord, ...>と完全一致していること
 * 6. Property型がPick<TaskRecord, ...>と完全一致していること
 * 7. Issue型がIssueRecord型と完全一致していること
 * 8. journal-view.type.ts が journal.model から型をインポートし多重定義を排除していること
 * 9. navigation-view.type.ts が navigation.model から型をインポートし多重定義を排除していること
 * 10. task-view.type.ts が task.model から IssueRecord をインポートし多重定義を排除していること
 */

import { describe, it, expect, expectTypeOf } from "vitest";
// @ts-expect-error node:fs type definitions are not included in DOM lib
import * as fs from "node:fs";
// @ts-expect-error node:path type definitions are not included in DOM lib
import * as path from "node:path";
import type { Log, Note } from "./journal-view.type";
import type { LogRecord, NoteRecord, JournalRecord } from "@/db/models/journal.model";
import type { QuickAccess, Label } from "./navigation-view.type";
import type { QuickAccessRecord, LabelRecord } from "@/db/models/navigation.model";
import type { Summary, Property, Issue } from "./task-view.type";
import type { TaskRecord, IssueRecord } from "@/db/models/task.model";

const currentDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

describe("View層の型定義一元化テスト", () => {
  describe("静的型レベルの整合性検証", () => {
    it("LogRecord および NoteRecord は JournalRecord と完全一致すること", () => {
      expectTypeOf<LogRecord>().toEqualTypeOf<JournalRecord>();
      expectTypeOf<NoteRecord>().toEqualTypeOf<JournalRecord>();
    });

    it("Log型はLogRecord型と完全一致すること", () => {
      expectTypeOf<Log>().toEqualTypeOf<LogRecord>();
    });

    it("Note型はNoteRecord型と完全一致すること", () => {
      expectTypeOf<Note>().toEqualTypeOf<NoteRecord>();
    });

    it("QuickAccess型はOmit<QuickAccessRecord, 'id'>と完全一致すること", () => {
      expectTypeOf<QuickAccess>().toEqualTypeOf<Omit<QuickAccessRecord, "id">>();
    });

    it("Label型はLabelRecord型と完全一致すること", () => {
      expectTypeOf<Label>().toEqualTypeOf<LabelRecord>();
    });

    it("Summary型はTaskRecordの指定プロパティ射影と完全一致すること", () => {
      expectTypeOf<Summary>().toEqualTypeOf<
        Pick<
          TaskRecord,
          "id" | "statusCode" | "name" | "dueDate" | "contacts" | "description"
        >
      >();
    });

    it("Property型はTaskRecordの指定プロパティ射影と完全一致すること", () => {
      expectTypeOf<Property>().toEqualTypeOf<
        Pick<
          TaskRecord,
          "fiscalYear" | "labelId" | "bookmark" | "createdAt" | "updatedAt"
        >
      >();
    });

    it("Issue型はIssueRecord型と完全一致すること", () => {
      expectTypeOf<Issue>().toEqualTypeOf<IssueRecord>();
    });
  });

  describe("多重定義排除・単一真実源（SSOT）化の検証", () => {
    it("journal-view.type.ts が journal.model から型をインポートし独自interface定義を排除していること", () => {
      const content = fs.readFileSync(path.join(currentDir, "journal-view.type.ts"), "utf-8");
      expect(content).toMatch(/import\s+type\s*\{[^}]*LogRecord[^}]*\}\s*from\s*["']@\/db\/models\/journal\.model["']/);
      expect(content).toMatch(/import\s+type\s*\{[^}]*NoteRecord[^}]*\}\s*from\s*["']@\/db\/models\/journal\.model["']/);
      expect(content).not.toMatch(/export\s+interface\s+Log\s*\{/);
      expect(content).not.toMatch(/export\s+interface\s+Note\s*\{/);
    });

    it("navigation-view.type.ts が navigation.model から型をインポートし独自interface定義を排除していること", () => {
      const content = fs.readFileSync(path.join(currentDir, "navigation-view.type.ts"), "utf-8");
      expect(content).toMatch(/import\s+type\s*\{[^}]*QuickAccessRecord[^}]*\}\s*from\s*["']@\/db\/models\/navigation\.model["']/);
      expect(content).toMatch(/import\s+type\s*\{[^}]*LabelRecord[^}]*\}\s*from\s*["']@\/db\/models\/navigation\.model["']/);
      expect(content).not.toMatch(/export\s+interface\s+QuickAccess\s*\{/);
      expect(content).not.toMatch(/export\s+interface\s+Label\s*\{/);
    });

    it("task-view.type.ts が task.model から IssueRecord をインポートしPick/エイリアス化していること", () => {
      const content = fs.readFileSync(path.join(currentDir, "task-view.type.ts"), "utf-8");
      expect(content).toMatch(/import\s+type\s*\{[^}]*IssueRecord[^}]*\}\s*from\s*["']@\/db\/models\/task\.model["']/);
      expect(content).toMatch(/export\s+type\s+Summary\s*=\s*Pick<\s*TaskRecord,/);
      expect(content).toMatch(/export\s+type\s+Property\s*=\s*Pick<\s*TaskRecord,/);
      expect(content).toMatch(/export\s+type\s+Issue\s*=\s*IssueRecord/);
    });
  });
});
