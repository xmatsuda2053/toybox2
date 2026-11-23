import "./bootstrap-webawesome";
import { connectSidePanelPort } from "./sidepanel-connection";
import "./hubaddress-app";

const disconnectSidePanelPort = connectSidePanelPort();
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    disconnectSidePanelPort();
  });
}
