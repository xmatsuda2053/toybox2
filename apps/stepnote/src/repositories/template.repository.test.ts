import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { Database } from "@/db/schema/database.schema";
import { TaskTemplateRepository } from "./template.repository";
import type { TaskTemplateRecord } from "@/db/models/template.model";

/**
 * テスト仕様一覧:
 * 1. TaskTemplateRepository:
 *    - テンプレートを追加（add）し、自動採番IDを取得できること
 *    - ID指定でテンプレートを取得（getById）できること
 *    - 全テンプレート一覧を取得（getAll）できること
 *    - テンプレートを更新（update）できること
 *    - テンプレートを削除（delete）できること
 *    - 指定IDのテンプレートを複製（clone）し、(コピー)付きの新規テンプレートとして保存できること
 */

describe("TaskTemplateRepository Tests", () => {
  let db: Database;
  let repo: TaskTemplateRepository;

  beforeEach(async () => {
    db = new Database();
    await db.delete();
    await db.open();
    repo = new TaskTemplateRepository(db);
  });

  it("テンプレートを追加し、IDで取得できること", async () => {
    const templateData: Omit<TaskTemplateRecord, "id"> = {
      name: "新規機能開発テンプレート",
      description: "## 開発タスク概要",
      issues: [
        { id: "1", order: 1, value: "# 設計書作成", dayOffset: 0 },
        { id: "2", order: 2, value: "# 実装", dayOffset: 2 },
      ],
      createdAt: new Date(),
    };

    const id = await repo.add(templateData);
    expect(id).toBeDefined();

    const fetched = await repo.getById(id);
    expect(fetched).toBeDefined();
    expect(fetched?.name).toBe("新規機能開発テンプレート");
    expect(fetched?.issues).toHaveLength(2);
    expect(fetched?.issues[1].dayOffset).toBe(2);
  });

  it("テンプレート一覧を取得できること", async () => {
    await repo.add({
      name: "テンプレートA",
      description: "概要A",
      issues: [],
    });
    await repo.add({
      name: "テンプレートB",
      description: "概要B",
      issues: [],
    });

    const all = await repo.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((t) => t.name)).toContain("テンプレートA");
    expect(all.map((t) => t.name)).toContain("テンプレートB");
  });

  it("テンプレートを更新できること", async () => {
    const id = await repo.add({
      name: "更新前テンプレート",
      description: "概要",
      issues: [],
    });

    await repo.update(id, { name: "更新後テンプレート" });
    const updated = await repo.getById(id);
    expect(updated?.name).toBe("更新後テンプレート");
  });

  it("テンプレートを削除できること", async () => {
    const id = await repo.add({
      name: "削除対象",
      description: "概要",
      issues: [],
    });

    await repo.delete(id);
    const deleted = await repo.getById(id);
    expect(deleted).toBeUndefined();
  });

  it("テンプレートを複製し、新しいレコードとして保存できること", async () => {
    const id = await repo.add({
      name: "オリジナル",
      description: "説明",
      issues: [{ id: "iss-1", order: 1, value: "# 課題1", dayOffset: 0 }],
    });

    const clonedId = await repo.clone(id);
    expect(clonedId).toBeDefined();
    expect(clonedId).not.toBe(id);

    const cloned = await repo.getById(clonedId);
    expect(cloned?.name).toBe("オリジナル (コピー)");
    expect(cloned?.description).toBe("説明");
    expect(cloned?.issues).toHaveLength(1);
    expect(cloned?.issues[0].id).not.toBe("iss-1");
  });
});

