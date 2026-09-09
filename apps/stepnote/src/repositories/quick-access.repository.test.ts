import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/db/schema/database.schema";
import { QuickAccessRecord } from "@/db/models/navigation.model";
import { QuickAccessRepository } from "./quick-access.repository";
import {
  QUICK_ACCESS_STATIC_ID,
  DEFAULT_QUICK_ACCESS,
} from "@/constants/quick-access.constants";

/**
 * - [x] 仕様1 getQuickAccess() 呼び出し時、DB が空であれば初期レコード（id: 1）を自動作成して返す
 * - [x] 仕様2 getQuickAccess() 呼び出し時、すでにレコードが存在する場合はそのデータを返す。
 * - [x] 仕様3 updateQuickAccess(partial) 呼び出し時、指定したフラグのみを更新し、id: 1 のまま永続化する。
 */
describe("Quick Access Repository Tests", () => {
  let repository: QuickAccessRepository;

  /**
   * テスト実行前にデータベースを初期化
   * */
  beforeEach(async () => {
    await db.quickAccess.clear();
    repository = new QuickAccessRepository();
  });

  it("getQuickAccess() 呼び出し時、DB が空であれば初期レコード（id: 1）を自動作成して返す", async () => {
    const result: QuickAccessRecord = await repository.getQuickAccess();
    expect(result).toMatchObject({
      id: QUICK_ACCESS_STATIC_ID,
      ...DEFAULT_QUICK_ACCESS,
    });
  });

  it("getQuickAccess() 呼び出し時、すでにレコードが存在する場合はそのデータを返す。", async () => {
    const initialRecord: QuickAccessRecord = {
      id: QUICK_ACCESS_STATIC_ID,
      isBookmarkSelected: true,
      isUncategorizedSelected: true,
      isDoneSelected: true,
      isOverdueSelected: true,
      isAsapSelected: true,
      isUpcomingSelected: false,
      isProgressSelected: false,
      isPendingSelected: false,
    };
    await db.quickAccess.add(initialRecord);

    const result: QuickAccessRecord = await repository.getQuickAccess();
    expect(result).toMatchObject(initialRecord);

    // 新しくレコードが追加されて件数が増えていないこと（1件のまま）
    const count = await db.quickAccess.count();
    expect(count).toBe(1);
  });

  it("updateQuickAccess(partial) 呼び出し時、指定したフラグのみを更新し、id: 1 のまま永続化する。", async () => {
    await repository.getQuickAccess();
    const updated = {
      isDoneSelected: true,
    };

    await repository.updateQuickAccess(updated);

    const result: QuickAccessRecord = await repository.getQuickAccess();
    expect(result).toMatchObject(updated);

    // 新しくレコードが追加されて件数が増えていないこと（1件のまま）
    const count = await db.quickAccess.count();
    expect(count).toBe(1);
  });
});
