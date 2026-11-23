import "@awesome.me/webawesome/dist/styles/webawesome.css";
import { registerWebAwesome } from "./webawesome";
import { connectSidePanelPort } from "./sidepanel-connection";
import "./hubaddress-app";

registerWebAwesome();

const disconnectSidePanelPort = connectSidePanelPort();
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    disconnectSidePanelPort();
  });
}
