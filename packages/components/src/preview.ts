import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/popover/popover.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import { registerIcons } from "@shared/icons";
import "./search-input/search-input";
import "./datepicker-input/datepicker-input";
import "./preview.scss";

// オフライン対応 SVG アイコンの登録
registerIcons();

// テーマ切り替え機能
const themeToggleBtn = document.getElementById("theme-toggle");
const root = document.documentElement;

let isDark =
  localStorage.getItem("preview_theme") === "dark" ||
  window.matchMedia("(prefers-color-scheme: dark)").matches;

function applyTheme(): void {
  if (isDark) {
    root.classList.add("wa-dark");
    root.setAttribute("data-theme", "dark");
    if (themeToggleBtn) themeToggleBtn.textContent = "☀️ Light Mode";
  } else {
    root.classList.remove("wa-dark");
    root.setAttribute("data-theme", "light");
    if (themeToggleBtn) themeToggleBtn.textContent = "🌙 Dark Mode";
  }
}

applyTheme();

themeToggleBtn?.addEventListener("click", () => {
  isDark = !isDark;
  localStorage.setItem("preview_theme", isDark ? "dark" : "light");
  applyTheme();
});

// イベントログ出力機能
const logContainer = document.getElementById("event-log");
const clearLogBtn = document.getElementById("clear-log");

function appendLog(sourceId: string, eventName: string, detail: unknown): void {
  if (!logContainer) return;
  const time = new Date().toLocaleTimeString();
  const entry =
    `[${time}] [${sourceId}] event: "${eventName}"\n` +
    `  payload: ${JSON.stringify(detail)}\n\n`;
  logContainer.textContent = entry + logContainer.textContent;
}

clearLogBtn?.addEventListener("click", () => {
  if (logContainer) logContainer.textContent = "";
});

// 各 search-input のイベント購読
const searchInputs = document.querySelectorAll("search-input");
searchInputs.forEach((el) => {
  el.addEventListener("search-input", (e: Event) => {
    const customEvt = e as CustomEvent;
    const id = el.id || "search-input";
    appendLog(id, "search-input", customEvt.detail);
  });
});

// 各 datepicker-input のイベント購読
const datepickerInputs = document.querySelectorAll("datepicker-input");
datepickerInputs.forEach((el) => {
  el.addEventListener("datepicker-change", (e: Event) => {
    const customEvt = e as CustomEvent;
    const id = el.id || "datepicker-input";
    appendLog(id, "datepicker-change", customEvt.detail);
  });
});
