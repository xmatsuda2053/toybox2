import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import { registerIcons } from "@shared/icons";
import "./app-root.js";

// オフライン環境向けローカル SVG アイコン基盤の初期化登録
registerIcons();
