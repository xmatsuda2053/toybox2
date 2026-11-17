import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import type { TagSetRecord } from "@/db/models/tag.model";
import type { TagSetsRepository } from "@/repositories/tag-sets.repository";
import { TagSetsController } from "./tag-sets.controller";

/**
 * 【TagSetsController 仕様】
 * 1. 初期化・読み込み
 *    - 1-1. 初期化時に repository.getAllSorted が呼び出され state が設定されること
 * 2. CRUD操作
 *    - 2-1. createTagSet で作成後に state が再読み込みされ、購読者および requestUpdate が通知されること
 *    - 2-2. updateTagSet で更新後に state が再読み込みされること
 *    - 2-3. deleteTagSet で削除後に state が再読み込みされること
 *    - 2-4. refresh 実行時に最新状態を再読み込みできること
 * 3. キャッシュ参照ユーティリティ
 *    - 3-1. getTagSetById で指定IDのタグセットを取得できること
 */
describe("TagSetsController Tests", () => {
  const createMockHost = (): ReactiveControllerHost => ({
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  });

  let host: ReactiveControllerHost;
  let store: TagSetRecord[];
  let mockRepository: TagSetsRepository;

  beforeEach(() => {
    host = createMockHost();
    store = [
      { id: 1, name: "開発", description: "開発全般", tagIds: [10, 20] },
      { id: 2, name: "レビュー", description: "", tagIds: [30] },
    ];

    mockRepository = {
      getAllSorted: vi.fn().mockImplementation(async () => [...store]),
      addTagSet: vi.fn().mockImplementation(async (input) => {
        const id = 3;
        store.push({
          id,
          name: input.name,
          description: input.description ?? "",
          tagIds: [...input.tagIds],
        });
        return id;
      }),
      updateTagSet: vi.fn().mockImplementation(async (id, data) => {
        const idx = store.findIndex((s) => s.id === id);
        if (idx >= 0) {
          store[idx] = { ...store[idx], ...data };
        }
      }),
      deleteTagSet: vi.fn().mockImplementation(async (id) => {
        store = store.filter((s) => s.id !== id);
      }),
    } as unknown as TagSetsRepository;
  });

  it("1-1. 初期化時に repository.getAllSorted が呼び出され state が設定されること", async () => {
    const controller = new TagSetsController(host, mockRepository);
    await controller.initialized;

    expect(mockRepository.getAllSorted).toHaveBeenCalled();
    expect(controller.state).toHaveLength(2);
  });

  it("2-1. createTagSet で作成後に state が再読み込みされ購読者へ通知されること", async () => {
    const controller = new TagSetsController(host, mockRepository);
    await controller.initialized;
    const listener = vi.fn();
    controller.subscribe(listener);

    const newId = await controller.createTagSet({
      name: "リリース",
      description: "公開前チェック",
      tagIds: [10, 30],
    });

    expect(newId).toBe(3);
    expect(controller.state).toHaveLength(3);
    expect(listener).toHaveBeenCalled();
    expect(host.requestUpdate).toHaveBeenCalled();
  });

  it("2-2. updateTagSet で更新後に state が再読み込みされること", async () => {
    const controller = new TagSetsController(host, mockRepository);
    await controller.initialized;

    await controller.updateTagSet(1, { name: "設計開発", tagIds: [10] });

    expect(controller.getTagSetById(1)?.name).toBe("設計開発");
    expect(controller.getTagSetById(1)?.tagIds).toEqual([10]);
  });

  it("2-3. deleteTagSet で削除後に state が再読み込みされること", async () => {
    const controller = new TagSetsController(host, mockRepository);
    await controller.initialized;

    await controller.deleteTagSet(2);

    expect(controller.state).toHaveLength(1);
    expect(controller.getTagSetById(2)).toBeUndefined();
  });

  it("2-4. refresh 実行時に最新状態を再読み込みできること", async () => {
    const controller = new TagSetsController(host, mockRepository);
    await controller.initialized;
    store[0] = { ...store[0], tagIds: [10] };

    await controller.refresh();

    expect(controller.getTagSetById(1)?.tagIds).toEqual([10]);
  });

  it("3-1. getTagSetById で指定IDのタグセットを取得できること", async () => {
    const controller = new TagSetsController(host, mockRepository);
    await controller.initialized;

    expect(controller.getTagSetById(1)?.name).toBe("開発");
    expect(controller.getTagSetById(999)).toBeUndefined();
  });
});
