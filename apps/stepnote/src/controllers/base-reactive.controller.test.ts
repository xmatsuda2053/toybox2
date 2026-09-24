import { describe, it, expect, vi } from "vitest";
import type { ReactiveControllerHost } from "lit";
import {
  BaseReactiveController,
  BaseTaskSubItemController,
} from "./base-reactive.controller";
import type { BaseTaskSubItemRepository } from "@/repositories/base-task-sub-item.repository";

/**
 * テスト仕様一覧:
 *
 * 1. BaseReactiveController
 *   - ホストコンポーネントに自身をコントローラーとして登録すること
 *   - subscribe で登録したリスナー関数が notify 呼び出し時に実行されること
 *   - notify 呼び出し時に host.requestUpdate が実行されること
 *   - subscribe の返却関数（unsubscribe）を実行すると、その後の notify でリスナーが実行されないこと
 *   - notify に引数を渡した場合、リスナー関数にその引数が渡されること
 *
 * 2. BaseTaskSubItemController
 *   - 初期化時に taskId が指定されている場合、repository.getByTaskId を呼び出して状態を読み込むこと
 *   - 初期化時に taskId が未指定の場合、状態が空配列であること
 *   - setTaskId を呼び出した際、新しい taskId でデータが再読み込みされリスナーへ通知されること
 *   - refresh を呼び出した際、現在の taskId でデータが再読み込みされること
 *   - createSubItem で taskId が付与されて repository.add が呼ばれ、データが再読み込みされること
 *   - createSubItem で taskId が未指定の場合、追加処理を行わず undefined を返すこと
 *   - updateSubItem で repository.update が呼ばれ、データが再読み込みされること
 *   - deleteSubItem で repository.delete が呼ばれ、データが再読み込みされること
 */

/** モック用のダミーレコード型 */
interface DummyItem {
  id: number;
  taskId: number;
  name: string;
}

/** モック用の ReactiveControllerHost を生成するヘルパー */
function createMockHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

/** モック用の BaseTaskSubItemRepository を生成するヘルパー */
function createMockSubItemRepository(): BaseTaskSubItemRepository<DummyItem> {
  const store = new Map<number, DummyItem>();
  let nextId = 1;

  return {
    table: {} as unknown as BaseTaskSubItemRepository<DummyItem>["table"],
    getAll: vi.fn(async () => Array.from(store.values())),
    getById: vi.fn(async (id: number) => store.get(id)),
    getByTaskId: vi.fn(async (taskId: number) =>
      Array.from(store.values()).filter((item) => item.taskId === taskId),
    ),
    add: vi.fn(async (item: Omit<DummyItem, "id">) => {
      const id = nextId++;
      store.set(id, { ...item, id } as DummyItem);
      return id;
    }),
    update: vi.fn(async (id: number, partial: Partial<DummyItem>) => {
      const existing = store.get(id);
      if (existing) {
        store.set(id, { ...existing, ...partial });
        return 1;
      }
      return 0;
    }),
    delete: vi.fn(async (id: number) => {
      const deleted = store.delete(id);
      return deleted ? 1 : 0;
    }),
    deleteByTaskId: vi.fn(async (taskId: number) => {
      let count = 0;
      for (const [id, item] of store.entries()) {
        if (item.taskId === taskId) {
          store.delete(id);
          count++;
        }
      }
      return count;
    }),
  } as unknown as BaseTaskSubItemRepository<DummyItem>;
}

/** 具体的なテスト用サブクラス */
class ConcreteTaskSubItemController extends BaseTaskSubItemController<DummyItem> {
  public async addItem(name: string): Promise<number | undefined> {
    return this.createSubItem({ name });
  }

  public async updateItem(id: number, name: string): Promise<void> {
    return this.updateSubItem(id, { name });
  }

  public async removeItem(id: number): Promise<void> {
    return this.deleteSubItem(id);
  }
}

describe("BaseReactiveController", () => {
  it("ホストコンポーネントに自身をコントローラーとして登録すること", () => {
    const host = createMockHost();
    const controller = new BaseReactiveController(host);

    expect(host.addController).toHaveBeenCalledWith(controller);
  });

  it("subscribe で登録したリスナー関数が notify 呼び出し時に実行されること", () => {
    const host = createMockHost();
    class TestController extends BaseReactiveController {
      public triggerNotify(): void {
        this.notify();
      }
    }
    const controller = new TestController(host);
    const listener = vi.fn();

    controller.subscribe(listener);
    expect(listener).not.toHaveBeenCalled();

    controller.triggerNotify();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(host.requestUpdate).toHaveBeenCalledTimes(1);
  });

  it("subscribe の返却関数（unsubscribe）を実行すると、その後の notify でリスナーが実行されないこと", () => {
    const host = createMockHost();
    class TestController extends BaseReactiveController {
      public triggerNotify(): void {
        this.notify();
      }
    }
    const controller = new TestController(host);
    const listener = vi.fn();

    const unsubscribe = controller.subscribe(listener);
    controller.triggerNotify();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    controller.triggerNotify();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("notify に引数を渡した場合、リスナー関数にその引数が渡されること", () => {
    const host = createMockHost();
    class TestController extends BaseReactiveController<{ count: number }> {
      public triggerNotify(payload: { count: number }): void {
        this.notify(payload);
      }
    }
    const controller = new TestController(host);
    const listener = vi.fn();

    controller.subscribe(listener);
    controller.triggerNotify({ count: 42 });

    expect(listener).toHaveBeenCalledWith({ count: 42 });
  });
});

describe("BaseTaskSubItemController", () => {
  it("初期化時に taskId が指定されている場合、repository.getByTaskId を呼び出して状態を読み込むこと", async () => {
    const host = createMockHost();
    const repo = createMockSubItemRepository();
    await repo.add({ taskId: 10, name: "Item 1" });

    const controller = new ConcreteTaskSubItemController(host, repo, 10);
    await controller.initialized;

    expect(repo.getByTaskId).toHaveBeenCalledWith(10);
    expect(controller.state).toHaveLength(1);
    expect(controller.state[0]?.name).toBe("Item 1");
  });

  it("初期化時に taskId が未指定の場合、状態が空配列であること", async () => {
    const host = createMockHost();
    const repo = createMockSubItemRepository();

    const controller = new ConcreteTaskSubItemController(host, repo);
    await controller.initialized;

    expect(controller.state).toEqual([]);
    expect(repo.getByTaskId).not.toHaveBeenCalled();
  });

  it("setTaskId を呼び出した際、新しい taskId でデータが再読み込みされリスナーへ通知されること", async () => {
    const host = createMockHost();
    const repo = createMockSubItemRepository();
    await repo.add({ taskId: 20, name: "Task 20 Item" });

    const controller = new ConcreteTaskSubItemController(host, repo);
    await controller.initialized;
    expect(controller.state).toHaveLength(0);

    const listener = vi.fn();
    controller.subscribe(listener);

    await controller.setTaskId(20);

    expect(repo.getByTaskId).toHaveBeenCalledWith(20);
    expect(controller.state).toHaveLength(1);
    expect(controller.state[0]?.name).toBe("Task 20 Item");
    expect(listener).toHaveBeenCalled();
  });

  it("refresh を呼び出した際、現在の taskId でデータが再読み込みされること", async () => {
    const host = createMockHost();
    const repo = createMockSubItemRepository();
    const controller = new ConcreteTaskSubItemController(host, repo, 30);
    await controller.initialized;

    await repo.add({ taskId: 30, name: "Dynamically Added" });
    await controller.refresh();

    expect(controller.state).toHaveLength(1);
    expect(controller.state[0]?.name).toBe("Dynamically Added");
  });

  it("createSubItem で taskId が付与されて repository.add が呼ばれ、データが再読み込みされること", async () => {
    const host = createMockHost();
    const repo = createMockSubItemRepository();
    const controller = new ConcreteTaskSubItemController(host, repo, 40);
    await controller.initialized;

    const newId = await controller.addItem("New Item");

    expect(newId).toBeDefined();
    expect(repo.add).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: 40, name: "New Item" }),
    );
    expect(controller.state).toHaveLength(1);
  });

  it("createSubItem で taskId が未指定の場合、追加処理を行わず undefined を返すこと", async () => {
    const host = createMockHost();
    const repo = createMockSubItemRepository();
    const controller = new ConcreteTaskSubItemController(host, repo);
    await controller.initialized;

    const newId = await controller.addItem("Should fail");

    expect(newId).toBeUndefined();
    expect(repo.add).not.toHaveBeenCalled();
    expect(controller.state).toHaveLength(0);
  });

  it("updateSubItem で repository.update が呼ばれ、データが再読み込みされること", async () => {
    const host = createMockHost();
    const repo = createMockSubItemRepository();
    const controller = new ConcreteTaskSubItemController(host, repo, 50);
    await controller.initialized;

    const id = (await controller.addItem("Before Update"))!;
    await controller.updateItem(id, "After Update");

    expect(repo.update).toHaveBeenCalledWith(
      id,
      expect.objectContaining({ name: "After Update" }),
    );
    expect(controller.state[0]?.name).toBe("After Update");
  });

  it("deleteSubItem で repository.delete が呼ばれ、データが再読み込みされること", async () => {
    const host = createMockHost();
    const repo = createMockSubItemRepository();
    const controller = new ConcreteTaskSubItemController(host, repo, 60);
    await controller.initialized;

    const id = (await controller.addItem("To be deleted"))!;
    expect(controller.state).toHaveLength(1);

    await controller.removeItem(id);

    expect(repo.delete).toHaveBeenCalledWith(id);
    expect(controller.state).toHaveLength(0);
  });
});
