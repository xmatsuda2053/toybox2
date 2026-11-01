import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { Database } from "@/db/schema/database.schema";
import { TaskTemplateRepository } from "@/repositories/template.repository";
import { TaskTemplateController } from "./task-template.controller";
import type { ReactiveControllerHost } from "lit";

/**
 * テスト仕様一覧:
 * 1. TaskTemplateController:
 *    - 初期化時にテンプレート一覧をロードすること
 *    - createTemplate で新規テンプレートを作成し、state が更新されること
 *    - updateTemplate で指定テンプレートを更新し、state が更新されること
 *    - deleteTemplate で指定テンプレートを削除し、state が更新されること
 *    - cloneTemplate で指定テンプレートを複製し、state が更新されること
 *    - selectTemplate で選択中テンプレートIDを変更できること
 */

describe("TaskTemplateController Tests", () => {
  let db: Database;
  let repo: TaskTemplateRepository;
  let host: ReactiveControllerHost;
  let controller: TaskTemplateController;

  beforeEach(async () => {
    db = new Database();
    await db.delete();
    await db.open();
    repo = new TaskTemplateRepository(db);

    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };

    controller = new TaskTemplateController(host, repo);
  });

  it("初期状態は空配列であること", () => {
    expect(controller.state).toEqual([]);
  });

  it("createTemplate で新規テンプレートを作成できること", async () => {
    const id = await controller.createTemplate({
      name: "週次定例テンプレート",
      description: "## 定例概要",
      issues: [{ id: "1", order: 1, value: "# アジェンダ準備", dayOffset: 0 }],
    });

    expect(id).toBeDefined();
    expect(controller.state).toHaveLength(1);
    expect(controller.state[0].name).toBe("週次定例テンプレート");
  });

  it("updateTemplate でテンプレートを更新できること", async () => {
    const id = await controller.createTemplate({
      name: "更新前",
      description: "概要",
      issues: [],
    });

    await controller.updateTemplate(id, { name: "更新後" });
    expect(controller.state[0].name).toBe("更新後");
  });

  it("deleteTemplate でテンプレートを削除できること", async () => {
    const id = await controller.createTemplate({
      name: "削除対象",
      description: "概要",
      issues: [],
    });
    expect(controller.state).toHaveLength(1);

    await controller.deleteTemplate(id);
    expect(controller.state).toHaveLength(0);
  });

  it("cloneTemplate でテンプレートを複製できること", async () => {
    const id = await controller.createTemplate({
      name: "複製元",
      description: "説明",
      issues: [{ id: "1", order: 1, value: "# サブ課題", dayOffset: 1 }],
    });

    const clonedId = await controller.cloneTemplate(id);
    expect(clonedId).toBeDefined();
    expect(controller.state).toHaveLength(2);
    expect(controller.state.some((t) => t.name === "複製元 (コピー)")).toBe(true);
  });

  it("selectTemplate で選択中IDを管理できること", async () => {
    expect(controller.selectedTemplateId).toBeUndefined();

    const id = await controller.createTemplate({
      name: "テスト",
      description: "説明",
      issues: [],
    });

    controller.selectTemplate(id);
    expect(controller.selectedTemplateId).toBe(id);
    expect(controller.selectedTemplate?.name).toBe("テスト");
  });
});
