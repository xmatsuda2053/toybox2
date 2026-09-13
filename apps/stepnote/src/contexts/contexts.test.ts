import { describe, it, expect } from "vitest";
import { layoutUIContext } from "./layout-ui.context";
import { taskContext, issuesContext } from "./task.context";
import { logsContext, notesContext } from "./journal.context";
import { labelsContext } from "./labels.context";
import { quickAccessContext } from "./quick-access.context";
import * as allContexts from "./index";

/** ContextKey の実体である Symbol を取得するヘルパー関数 */
const asSymbol = (context: unknown): symbol => context as symbol;

/**
 * テスト仕様一覧:
 * 1. layoutUIContext が正しく定義され、固有の Symbol キーを持つこと
 * 2. taskContext が正しく定義され、固有の Symbol キーを持つこと
 * 3. issuesContext が正しく定義され、固有の Symbol キーを持つこと
 * 4. logsContext が正しく定義され、固有の Symbol キーを持つこと
 * 5. notesContext が正しく定義され、固有の Symbol キーを持つこと
 * 6. labelsContext が正しく定義され、固有の Symbol キーを持つこと
 * 7. quickAccessContext が正しく定義され、固有の Symbol キーを持つこと
 * 8. すべての ContextKey の Symbol 記述名（description）が一意であり衝突していないこと
 * 9. index.ts からすべての Context が正しく再エクスポートされていること
 */
describe("contexts の定義とエクスポート", () => {
  describe("個別の Context 定義", () => {
    it("layoutUIContext が正しく定義され、固有の Symbol キーを持つこと", () => {
      expect(layoutUIContext).toBeDefined();
      expect(typeof layoutUIContext).toBe("symbol");
      expect(asSymbol(layoutUIContext).description).toBe("layout-ui-context");
    });

    it("taskContext が正しく定義され、固有の Symbol キーを持つこと", () => {
      expect(taskContext).toBeDefined();
      expect(typeof taskContext).toBe("symbol");
      expect(asSymbol(taskContext).description).toBe("task-context");
    });

    it("issuesContext が正しく定義され、固有の Symbol キーを持つこと", () => {
      expect(issuesContext).toBeDefined();
      expect(typeof issuesContext).toBe("symbol");
      expect(asSymbol(issuesContext).description).toBe("issues-context");
    });

    it("logsContext が正しく定義され、固有の Symbol キーを持つこと", () => {
      expect(logsContext).toBeDefined();
      expect(typeof logsContext).toBe("symbol");
      expect(asSymbol(logsContext).description).toBe("logs-context");
    });

    it("notesContext が正しく定義され、固有の Symbol キーを持つこと", () => {
      expect(notesContext).toBeDefined();
      expect(typeof notesContext).toBe("symbol");
      expect(asSymbol(notesContext).description).toBe("notes-context");
    });

    it("labelsContext が正しく定義され、固有の Symbol キーを持つこと", () => {
      expect(labelsContext).toBeDefined();
      expect(typeof labelsContext).toBe("symbol");
      expect(asSymbol(labelsContext).description).toBe("labels-context");
    });

    it("quickAccessContext が正しく定義され、固有の Symbol キーを持つこと", () => {
      expect(quickAccessContext).toBeDefined();
      expect(typeof quickAccessContext).toBe("symbol");
      expect(asSymbol(quickAccessContext).description).toBe(
        "quick-access-context",
      );
    });
  });

  describe("ContextKey の一意性検証", () => {
    it("すべての ContextKey の Symbol 記述名（description）が一意であり衝突していないこと", () => {
      const contexts = [
        layoutUIContext,
        taskContext,
        issuesContext,
        logsContext,
        notesContext,
        labelsContext,
        quickAccessContext,
      ];
      const descriptions = contexts.map((ctx) => asSymbol(ctx).description);
      const uniqueDescriptions = new Set(descriptions);
      expect(uniqueDescriptions.size).toBe(contexts.length);

      const uniqueSymbols = new Set(contexts);
      expect(uniqueSymbols.size).toBe(contexts.length);
    });
  });

  describe("index.ts のエクスポート検証", () => {
    it("index.ts からすべての Context が正しく再エクスポートされていること", () => {
      expect(allContexts.layoutUIContext).toBe(layoutUIContext);
      expect(allContexts.taskContext).toBe(taskContext);
      expect(allContexts.issuesContext).toBe(issuesContext);
      expect(allContexts.logsContext).toBe(logsContext);
      expect(allContexts.notesContext).toBe(notesContext);
      expect(allContexts.labelsContext).toBe(labelsContext);
      expect(allContexts.quickAccessContext).toBe(quickAccessContext);
    });
  });
});
