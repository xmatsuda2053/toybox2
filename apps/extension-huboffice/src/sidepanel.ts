import "./bootstrap-webawesome";
import {
  connectSidePanelPort,
  installResizeObserverErrorGuard,
} from "./sidepanel-connection";
import "./huboffice-app";

const disconnectSidePanelPort = connectSidePanelPort();
const removeResizeObserverGuard = installResizeObserverErrorGuard();
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    disconnectSidePanelPort();
    removeResizeObserverGuard();
  });
}
