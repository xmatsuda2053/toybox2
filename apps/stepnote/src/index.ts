import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "./styles/tokens.scss";
import { registerWebAwesome } from "./webawesome.js";
import { registerIcons } from "@shared/icons";
import "./app-root.js";

// Web Awesome コンポーネント群およびローカル SVG アイコン基盤の初期化登録
registerWebAwesome();
registerIcons();

