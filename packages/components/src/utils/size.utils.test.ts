import { describe, it, expect } from "vitest";
import { normalizeWaSize } from "./size.utils";

/**
 * 【size.utils 仕様】
 * 1. Web Awesome サイズ（s, m, l）への正規化
 *    - 1-1. "small" を "s" に正規化すること
 *    - 1-2. "medium" を "m" に正規化すること
 *    - 1-3. "large" を "l" に正規化すること
 *    - 1-4. 既に "s", "m", "l" の場合はそのまま返すこと
 */
describe("size.utils", () => {
  describe("1. normalizeWaSize", () => {
    it("1-1. 'small' を 's' に正規化すること", () => {
      expect(normalizeWaSize("small")).toBe("s");
    });

    it("1-2. 'medium' を 'm' に正規化すること", () => {
      expect(normalizeWaSize("medium")).toBe("m");
    });

    it("1-3. 'large' を 'l' に正規化すること", () => {
      expect(normalizeWaSize("large")).toBe("l");
    });

    it("1-4. 既に 's', 'm', 'l' の場合はそのまま返すこと", () => {
      expect(normalizeWaSize("s")).toBe("s");
      expect(normalizeWaSize("m")).toBe("m");
      expect(normalizeWaSize("l")).toBe("l");
    });
  });
});
