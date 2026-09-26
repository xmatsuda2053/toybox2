import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactiveControllerHost } from "lit";
import {
  ControllerSubscriber,
  type SubscribableController,
} from "./controller-subscriber.js";

/**
 * 【ControllerSubscriber 仕様】
 *
 * 1. 初期化とホスト登録
 *    - 1-1. インスタンス生成時に host.addController が自身を引数として呼び出されること
 *
 * 2. コントローラー購読（subscribe）と更新通知
 *    - 2-1. subscribe(key, controller) 呼出時にコントローラーの subscribe メソッドが実行されてリスナーが登録されること
 *    - 2-2. 登録されたリスナーが発火した際にデフォルトで host.requestUpdate() が呼び出されること
 *    - 2-3. 第3引数にカスタムコールバックが指定された場合、リスナー発火時にそのカスタムコールバックが実行されること
 *    - 2-4. コントローラーが undefined または subscribe メソッドを持たない場合は安全に無視され例外が発生しないこと
 *
 * 3. コントローラー差し替え時の旧購読解除
 *    - 3-1. 同一キーに対して別のコントローラーで再度 subscribe を呼んだ場合、旧コントローラーの購読解除関数が実行されること
 *    - 3-2. 同一キーに対して undefined で再度 subscribe を呼んだ場合、旧コントローラーの購読解除関数が実行されること
 *
 * 4. 明示的な個別解除（unsubscribe）
 *    - 4-1. unsubscribe(key) 呼出時に該当キーの購読解除関数が実行されること
 *    - 4-2. 存在しないキーに対して unsubscribe を呼んでも例外が発生しないこと
 *
 * 5. 一括解除（unsubscribeAll）とホスト切断ライフサイクル連動（hostDisconnected）
 *    - 5-1. unsubscribeAll() 呼出時に保持されているすべてのコントローラーの購読解除関数が実行されること
 *    - 5-2. hostDisconnected() 呼出時にすべてのコントローラーの購読解除関数が実行されること
 *    - 5-3. 一度解除された後に再度 unsubscribeAll() を呼んでも購読解除関数が多重実行されないこと
 */

describe("ControllerSubscriber", () => {
  let mockHost: ReactiveControllerHost;
  let subscriber: ControllerSubscriber;

  const createMockController = (): SubscribableController & {
    unsubscribeMock: ReturnType<typeof vi.fn>;
    triggerUpdate: () => void;
  } => {
    let storedListener: (() => void) | undefined;
    const unsubscribeMock = vi.fn();
    return {
      unsubscribeMock,
      subscribe: vi.fn((listener: () => void) => {
        storedListener = listener;
        return unsubscribeMock;
      }),
      triggerUpdate: () => {
        if (storedListener) storedListener();
      },
    };
  };

  beforeEach(() => {
    mockHost = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };
    subscriber = new ControllerSubscriber(mockHost);
  });

  describe("1. 初期化とホスト登録", () => {
    it("1-1. インスタンス生成時に host.addController が自身を引数として呼び出されること", () => {
      expect(mockHost.addController).toHaveBeenCalledWith(subscriber);
    });
  });

  describe("2. コントローラー購読（subscribe）と更新通知", () => {
    it("2-1. subscribe(key, controller) 呼出時にコントローラーの subscribe メソッドが実行されてリスナーが登録されること", () => {
      const ctrl = createMockController();
      subscriber.subscribe("test", ctrl);

      expect(ctrl.subscribe).toHaveBeenCalledTimes(1);
    });

    it("2-2. 登録されたリスナーが発火した際にデフォルトで host.requestUpdate() が呼び出されること", () => {
      const ctrl = createMockController();
      subscriber.subscribe("test", ctrl);

      expect(mockHost.requestUpdate).not.toHaveBeenCalled();
      ctrl.triggerUpdate();
      expect(mockHost.requestUpdate).toHaveBeenCalledTimes(1);
    });

    it("2-3. 第3引数にカスタムコールバックが指定された場合、リスナー発火時にそのカスタムコールバックが実行されること", () => {
      const ctrl = createMockController();
      const customCallback = vi.fn();
      subscriber.subscribe("test", ctrl, customCallback);

      ctrl.triggerUpdate();
      expect(customCallback).toHaveBeenCalledTimes(1);
      expect(mockHost.requestUpdate).not.toHaveBeenCalled();
    });

    it("2-4. コントローラーが undefined または subscribe メソッドを持たない場合は安全に無視され例外が発生しないこと", () => {
      expect(() => {
        subscriber.subscribe("test", undefined);
        subscriber.subscribe("test", {} as unknown as SubscribableController);
      }).not.toThrow();
    });
  });

  describe("3. コントローラー差し替え時の旧購読解除", () => {
    it("3-1. 同一キーに対して別のコントローラーで再度 subscribe を呼んだ場合、旧コントローラーの購読解除関数が実行されること", () => {
      const ctrl1 = createMockController();
      const ctrl2 = createMockController();

      subscriber.subscribe("test", ctrl1);
      expect(ctrl1.unsubscribeMock).not.toHaveBeenCalled();

      subscriber.subscribe("test", ctrl2);
      expect(ctrl1.unsubscribeMock).toHaveBeenCalledTimes(1);
      expect(ctrl2.unsubscribeMock).not.toHaveBeenCalled();
    });

    it("3-2. 同一キーに対して undefined で再度 subscribe を呼んだ場合、旧コントローラーの購読解除関数が実行されること", () => {
      const ctrl = createMockController();
      subscriber.subscribe("test", ctrl);

      subscriber.subscribe("test", undefined);
      expect(ctrl.unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("4. 明示的な個別解除（unsubscribe）", () => {
    it("4-1. unsubscribe(key) 呼出時に該当キーの購読解除関数が実行されること", () => {
      const ctrl = createMockController();
      subscriber.subscribe("test", ctrl);

      subscriber.unsubscribe("test");
      expect(ctrl.unsubscribeMock).toHaveBeenCalledTimes(1);
    });

    it("4-2. 存在しないキーに対して unsubscribe を呼んでも例外が発生しないこと", () => {
      expect(() => {
        subscriber.unsubscribe("non-existent");
      }).not.toThrow();
    });
  });

  describe("5. 一括解除（unsubscribeAll）とホスト切断ライフサイクル連動（hostDisconnected）", () => {
    it("5-1. unsubscribeAll() 呼出時に保持されているすべてのコントローラーの購読解除関数が実行されること", () => {
      const ctrl1 = createMockController();
      const ctrl2 = createMockController();

      subscriber.subscribe("ctrl1", ctrl1);
      subscriber.subscribe("ctrl2", ctrl2);

      subscriber.unsubscribeAll();
      expect(ctrl1.unsubscribeMock).toHaveBeenCalledTimes(1);
      expect(ctrl2.unsubscribeMock).toHaveBeenCalledTimes(1);
    });

    it("5-2. hostDisconnected() 呼出時にすべてのコントローラーの購読解除関数が実行されること", () => {
      const ctrl1 = createMockController();
      const ctrl2 = createMockController();

      subscriber.subscribe("ctrl1", ctrl1);
      subscriber.subscribe("ctrl2", ctrl2);

      subscriber.hostDisconnected();
      expect(ctrl1.unsubscribeMock).toHaveBeenCalledTimes(1);
      expect(ctrl2.unsubscribeMock).toHaveBeenCalledTimes(1);
    });

    it("5-3. 一度解除された後に再度 unsubscribeAll() を呼んでも購読解除関数が多重実行されないこと", () => {
      const ctrl = createMockController();
      subscriber.subscribe("test", ctrl);

      subscriber.unsubscribeAll();
      expect(ctrl.unsubscribeMock).toHaveBeenCalledTimes(1);

      subscriber.unsubscribeAll();
      expect(ctrl.unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  });
});
