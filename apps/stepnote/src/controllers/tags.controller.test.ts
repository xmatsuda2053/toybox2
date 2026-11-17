import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import { TagsController } from "./tags.controller.js";
import type { TagRecord, TagVariant } from "@/db/models/tag.model";
import type { TagsRepository } from "@/repositories/tags.repository";

/**
 * TagsRepository のテスト用 Fake 実装
 */
class FakeTagsRepository {
  public data: TagRecord[];
  public usageCounts = new Map<number, number>();
  private nextId = 1;

  constructor(data: TagRecord[] = []) {
    this.data = data.map((item) => ({ ...item }));
    const maxId = this.data.reduce((max, item) => Math.max(max, item.id ?? 0), 0);
    this.nextId = maxId + 1;
  }

  async getAllSorted(): Promise<TagRecord[]> {
    return [...this.data].sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }

  async addTag(input: {
    name: string;
    description?: string;
    variant?: TagVariant;
  }): Promise<number> {
    const normalized = input.name.trim().replace(/^#+/, "").trim();
    if (!normalized) {
      throw new Error("タグ名を入力してください");
    }
    if (this.data.some((t) => t.name.toLowerCase() === normalized.toLowerCase())) {
      throw new Error(`同名のタグ「${normalized}」は既に存在します`);
    }
    const id = this.nextId++;
    this.data.push({
      id,
      name: normalized,
      description: input.description?.trim() ?? "",
      variant: input.variant ?? "neutral",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  }

  async updateTag(
    id: number,
    partial: Partial<Omit<TagRecord, "id">>,
  ): Promise<void> {
    const idx = this.data.findIndex((t) => t.id === id);
    if (idx === -1) return;
    if (partial.name !== undefined) {
      const normalized = partial.name.trim().replace(/^#+/, "").trim();
      if (!normalized) throw new Error("タグ名を入力してください");
      if (
        this.data.some(
          (t) => t.id !== id && t.name.toLowerCase() === normalized.toLowerCase(),
        )
      ) {
        throw new Error(`同名のタグ「${normalized}」は既に存在します`);
      }
      partial = { ...partial, name: normalized };
    }
    this.data[idx] = { ...this.data[idx], ...partial, updatedAt: new Date() };
  }

  async deleteTagWithCleanup(id: number): Promise<void> {
    this.data = this.data.filter((t) => t.id !== id);
  }

  async getTaskUsageCount(id: number): Promise<number> {
    return this.usageCounts.get(id) ?? 0;
  }
}

const createMockHost = () => {
  const requestUpdateMock = vi.fn();
  const host: ReactiveControllerHost = {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: requestUpdateMock,
    updateComplete: Promise.resolve(true),
  };
  return { host, requestUpdateMock };
};

/**
 * 【TagsController 仕様】
 *
 * 1. 初期化・データ取得 (Initial State & Load)
 *    - 1-1. 初期化時に Repository からソート済み全タグ一覧を取得して state に保持し、host.requestUpdate() が呼び出されること
 *    - 1-2. refresh 実行時に Repository から最新データを再取得して state が更新され、requestUpdate() が呼ばれること
 *
 * 2. CRUD 操作とUI再描画 (Tag Management)
 *    - 2-1. createTag 実行時に新規タグが追加され、採番された ID が返り、state と購読通知が更新されること
 *    - 2-2. updateTag 実行時に対象タグが更新され、state と購読通知が更新されること
 *    - 2-3. deleteTag 実行時に deleteTagWithCleanup が呼ばれ、state から対象タグが削除され購読通知が更新されること
 *    - 2-4. getTagUsageCount で Repository からタスク使用件数を取得できること
 *
 * 3. タグ解決・参照ヘルパー (Lookup Helpers)
 *    - 3-1. getTagById で指定IDのタグを取得できること（存在しない場合は undefined）
 *    - 3-2. getTagsByIds で指定ID配列に対応するタグ一覧を解決し、存在しないIDを除外して返すこと
 *    - 3-3. findByName で大文字小文字を区別せず既存タグを検索できること
 */
describe("TagsController (TDD)", () => {
  let fakeRepository: FakeTagsRepository;
  let mockHost: ReturnType<typeof createMockHost>;
  let controller: TagsController;

  describe("1. 初期化・データ取得", () => {
    const init: TagRecord[] = [
      { id: 1, name: "重要", description: "重要案件", variant: "danger" },
      { id: 2, name: "API", description: "バックエンド", variant: "brand" },
    ];

    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTagsRepository(init);
      controller = new TagsController(
        mockHost.host,
        fakeRepository as unknown as TagsRepository,
      );
      await controller.initialized;
    });

    it("1-1. 初期化時に Repository からソート済み全タグ一覧を取得して state に保持し、requestUpdate() が呼ばれること", () => {
      expect(controller.state.map((t) => t.name)).toEqual(["API", "重要"]);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("1-2. refresh 実行時に最新データを再取得して state が更新されること", async () => {
      fakeRepository.data.push({
        id: 3,
        name: "UI",
        description: "画面",
        variant: "success",
      });
      mockHost.requestUpdateMock.mockClear();

      await controller.refresh();

      expect(controller.state).toHaveLength(3);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });
  });

  describe("2. CRUD 操作とUI再描画", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTagsRepository();
      controller = new TagsController(
        mockHost.host,
        fakeRepository as unknown as TagsRepository,
      );
      await controller.initialized;
      mockHost.requestUpdateMock.mockClear();
    });

    it("2-1. createTag 実行時に新規タグが追加され、IDが返り、state と購読通知が更新されること", async () => {
      const listener = vi.fn();
      controller.subscribe(listener);

      const id = await controller.createTag({
        name: "検証",
        description: "検証用タグ",
        variant: "warning",
      });

      expect(id).toBe(1);
      expect(controller.state).toHaveLength(1);
      expect(controller.state[0]?.name).toBe("検証");
      expect(controller.state[0]?.variant).toBe("warning");
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("2-2. updateTag 実行時に対象タグが更新され、state と購読通知が更新されること", async () => {
      const id = await controller.createTag({ name: "旧名" });
      mockHost.requestUpdateMock.mockClear();

      await controller.updateTag(id, {
        name: "新名",
        description: "説明追加",
        variant: "success",
      });

      expect(controller.state[0]?.name).toBe("新名");
      expect(controller.state[0]?.description).toBe("説明追加");
      expect(controller.state[0]?.variant).toBe("success");
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-3. deleteTag 実行時に対象タグが削除され、state と購読通知が更新されること", async () => {
      const id = await controller.createTag({ name: "削除タグ" });
      mockHost.requestUpdateMock.mockClear();

      await controller.deleteTag(id);

      expect(controller.state).toHaveLength(0);
      expect(mockHost.requestUpdateMock).toHaveBeenCalled();
    });

    it("2-4. getTagUsageCount でタスク使用件数を取得できること", async () => {
      const id = await controller.createTag({ name: "利用中" });
      fakeRepository.usageCounts.set(id, 4);

      expect(await controller.getTagUsageCount(id)).toBe(4);
    });
  });

  describe("3. タグ解決・参照ヘルパー", () => {
    beforeEach(async () => {
      mockHost = createMockHost();
      fakeRepository = new FakeTagsRepository([
        { id: 10, name: "React", description: "", variant: "brand" },
        { id: 20, name: "Urgent", description: "", variant: "danger" },
      ]);
      controller = new TagsController(
        mockHost.host,
        fakeRepository as unknown as TagsRepository,
      );
      await controller.initialized;
    });

    it("3-1. getTagById で指定IDのタグを取得できること", () => {
      expect(controller.getTagById(10)?.name).toBe("React");
      expect(controller.getTagById(999)).toBeUndefined();
    });

    it("3-2. getTagsByIds で指定ID配列に対応するタグ一覧を解決し、存在しないIDを除外すること", () => {
      const resolved = controller.getTagsByIds([20, 999, 10]);
      expect(resolved.map((t) => t.name)).toEqual(["Urgent", "React"]);
    });

    it("3-3. findByName で大文字小文字を区別せず既存タグを検索できること", () => {
      expect(controller.findByName("react")?.id).toBe(10);
      expect(controller.findByName("unknown")).toBeUndefined();
    });
  });
});
