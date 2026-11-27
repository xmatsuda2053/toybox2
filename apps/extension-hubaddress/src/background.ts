import {
  createSidePanelBackground,
  type CommandHandlerDeps,
  type CommandTabLike,
  type SidePanelBehaviorApi,
  type SidePanelOpenApi,
  type SidePanelPortLike,
} from "@shared/utils";

export const OPEN_SIDEPANEL_COMMAND = "open-hubaddress-sidepanel";
export const SIDEPANEL_PORT_NAME = "hubaddress-sidepanel";

export type {
  CommandHandlerDeps,
  CommandTabLike,
  SidePanelBehaviorApi,
  SidePanelOpenApi,
  SidePanelPortLike,
};

const controller = createSidePanelBackground({
  commandName: OPEN_SIDEPANEL_COMMAND,
  portName: SIDEPANEL_PORT_NAME,
});

export const {
  clearRegisteredSidePanelPorts,
  registerSidePanelPort,
  initSidePanelBehavior,
  handleCommand,
} = controller;

controller.registerServiceWorkerListeners();
