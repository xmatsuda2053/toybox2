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
 *
 * 6. コントローラーバインド（bind）によるプロパティセッター集約
 *    - 6-1. 新規コントローラーまたは異なるインスタンスが渡された場合、旧購読を解除して新購読を登録し、host.requestUpdate() を呼び出して新インスタンスを返すこと
 *    - 6-2. 同一インスタンスが渡された場合（current === next）、購読登録や host.requestUpdate() を行わず、そのままインスタンスを返すこと
 *    - 6-3. カスタムコールバックが指定された場合、購読時のリスナー発火時にそのコールバックが呼び出されること
 *    - 6-4. next に undefined が渡された場合、旧購読を解除して host.requestUpdate() を呼び出し、undefined を返すこと
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

  describe("6. コントローラーバインド（bind）によるプロパティセッター集約", () => {
    it("6-1. 新規コントローラーまたは異なるインスタンスが渡された場合、旧購読を解除して新購読を登録し、host.requestUpdate() を呼び出して新インスタンスを返すこと", () => {
      const ctrl1 = createMockController();
      const ctrl2 = createMockController();

      // 初期バインド（undefined -> ctrl1）
      const bound1 = subscriber.bind("test", undefined, ctrl1);
      expect(bound1).toBe(ctrl1);
      expect(ctrl1.subscribe).toHaveBeenCalledTimes(1);
      expect(mockHost.requestUpdate).toHaveBeenCalledTimes(1);

      // コントローラー差し替え（ctrl1 -> ctrl2）
      mockHost.requestUpdate = vi.fn();
      const bound2 = subscriber.bind("test", ctrl1, ctrl2);
      expect(bound2).toBe(ctrl2);
      expect(ctrl1.unsubscribeMock).toHaveBeenCalledTimes(1);
      expect(ctrl2.subscribe).toHaveBeenCalledTimes(1);
      expect(mockHost.requestUpdate).toHaveBeenCalledTimes(1);
    });

    it("6-2. 同一インスタンスが渡された場合（current === next）、購読登録や host.requestUpdate() を行わず、そのままインスタンスを返すこと", () => {
      const ctrl = createMockController();
      subscriber.bind("test", undefined, ctrl);

      const updateMock = vi.fn();
      mockHost.requestUpdate = updateMock;

      const bound = subscriber.bind("test", ctrl, ctrl);
      expect(bound).toBe(ctrl);
      expect(ctrl.subscribe).toHaveBeenCalledTimes(1); // 最初の1回のみ
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("6-3. カスタムコールバックが指定された場合、購読時のリスナー発火時にそのコールバックが呼び出されること", () => {
      const ctrl = createMockController();
      const onUpdate = vi.fn();

      subscriber.bind("test", undefined, ctrl, onUpdate);
      expect(onUpdate).not.toHaveBeenCalled();

      ctrl.triggerUpdate();
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it("6-4. next に undefined が渡された場合、旧購読を解除して host.requestUpdate() を呼び出し、undefined を返すこと", () => {
      const ctrl = createMockController();
      subscriber.bind("test", undefined, ctrl);

      const updateMock = vi.fn();
      mockHost.requestUpdate = updateMock;

      const bound = subscriber.bind("test", ctrl, undefined);
      expect(bound).toBeUndefined();
      expect(ctrl.unsubscribeMock).toHaveBeenCalledTimes(1);
      expect(updateMock).toHaveBeenCalledTimes(1);
    });
  });
});
