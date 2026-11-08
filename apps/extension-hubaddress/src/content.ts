// 1. Web Components ポリフィル（Content Script Isolated World 向け）を最先頭でインポート
import "@webcomponents/custom-elements";

// 2. Web Awesome コンポーネントおよびローカルアイコン登録
import { registerWebAwesome } from "./webawesome";

registerWebAwesome();

const HOST_ELEMENT_ID = "hubaddress-extension-host";

/**
 * 閲覧中のWebページ上に Shadow DOM を介して拡張機能UIを安全にマウントする
 */
export async function mountHubAddressExtension(): Promise<HTMLElement | null> {
  if (typeof document === "undefined") {
    return null;
  }

  // 二重マウント防止
  const existing = document.getElementById(HOST_ELEMENT_ID);
  if (existing) {
    return existing;
  }

  const host = document.createElement("div");
  host.id = HOST_ELEMENT_ID;
  host.style.position = "absolute";
  host.style.top = "0";
  host.style.left = "0";
  host.style.zIndex = "2147483647";

  document.body.appendChild(host);

  return host;
}

// 拡張機能ロード時の初期マウント実行
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      mountHubAddressExtension();
    });
  } else {
    mountHubAddressExtension();
  }
}
