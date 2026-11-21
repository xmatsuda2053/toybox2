import { html, type HTMLTemplateResult } from "lit";
import type { TaskRepository } from "@/repositories/task.repository.js";
import type { LayoutState } from "@/types";

/** AppRoot ヘッダー描画用パラメーター */
export interface AppHeaderTemplateParams {
  isSearchDisabled: boolean;
  resolvedTheme: string;
  taskRepository: TaskRepository;
  onOpenGlobalSearch: () => void;
}

/**
 * ヘッダー領域の HTML テンプレートを描画する。
 */
export function renderAppHeader(
  params: AppHeaderTemplateParams,
): HTMLTemplateResult {
  return html`
    <header class="app-header">
      <div class="header-branding">
        <wa-icon library="my-icons" name="cubes-stacked-solid-full"></wa-icon>
        StepNote
      </div>
      <div class="header-search">
        <button
          type="button"
          id="header-global-search-trigger"
          class="header-search-trigger"
          aria-label="全体検索 (Ctrl+K)"
          ?disabled=${params.isSearchDisabled}
          @click=${params.onOpenGlobalSearch}
        >
          <div class="header-search-trigger__lead">
            <wa-icon
              library="my-icons"
              name="magnifying-glass-solid-full"
              class="header-search-trigger__icon"
            ></wa-icon>
            <span class="header-search-trigger__placeholder"
              >全体を検索...</span
            >
          </div>
          <kbd class="header-search-trigger__shortcut">Ctrl K</kbd>
        </button>
      </div>
      <div class="header-actions">
        <task-history-menu
          .taskRepository=${params.taskRepository}
          data-theme=${params.resolvedTheme}
        ></task-history-menu>
        <theme-switcher></theme-switcher>
      </div>
    </header>
  `;
}

function renderAppMenuTemplate(
  layoutState: LayoutState,
  resolvedTheme: string,
): HTMLTemplateResult {
  const {
    isNavigationListAreaOpen,
    isZenMode,
    isScratchMode,
    isSettingsMode,
  } = layoutState;

  return html`
    <app-menu
      class="app-menu"
      data-theme=${resolvedTheme}
      .isNavigationListAreaOpen=${isNavigationListAreaOpen}
      .isZenMode=${isZenMode}
      .isScratchMode=${isScratchMode}
      .isSettingsMode=${isSettingsMode}
    ></app-menu>
  `;
}

function renderNavigationAside(
  isOpen: boolean,
  resolvedTheme: string,
): HTMLTemplateResult {
  return html`
    <aside class="pane-navigation pane-collapsible" ?hidden=${!isOpen}>
      <navigation-quick-access
        class="navigation-quick-access"
        data-theme=${resolvedTheme}
      ></navigation-quick-access>
      <navigation-labels
        class="navigation-labels"
        data-theme=${resolvedTheme}
      ></navigation-labels>
    </aside>
  `;
}

function renderJournalAside(
  isJournalOpen: boolean,
  resolvedTheme: string,
): HTMLTemplateResult {
  const journalPaneClass = isJournalOpen
    ? "journal-pane"
    : "journal-pane journal-pane--collapsed";

  return html`
    <aside class="${journalPaneClass}">
      <journal-pane
        data-theme=${resolvedTheme}
        .isJournalAreaOpen=${isJournalOpen}
      ></journal-pane>
    </aside>
  `;
}

function renderSingleModePane(
  layoutState: LayoutState,
  resolvedTheme: string,
  mode: "scratch" | "settings",
): HTMLTemplateResult {
  return html`
    <div class="panes-container">
      <!-- 1. Menu (最左メニュー領域: 固定 45px) -->
      ${renderAppMenuTemplate(layoutState, resolvedTheme)}
      ${mode === "scratch"
        ? html`
            <!-- 全画面スクラッチペイン -->
            <scratch-pane
              class="pane-scratch"
              data-theme=${resolvedTheme}
            ></scratch-pane>
          `
        : html`
            <!-- 全画面設定ペイン -->
            <settings-pane
              class="pane-settings"
              data-theme=${resolvedTheme}
            ></settings-pane>
          `}
    </div>
  `;
}

/**
 * 5ペイン（または Scratch / Settings 単一モード）の中央コンテンツ領域を描画する。
 */
export function renderAppPanesLayout(
  layoutState: LayoutState,
  resolvedTheme: string,
): HTMLTemplateResult {
  const {
    isNavigationListAreaOpen: isOpen,
    isJournalAreaOpen: isJournalOpen,
    isScratchMode,
    isSettingsMode,
  } = layoutState;

  if (isScratchMode) {
    return renderSingleModePane(layoutState, resolvedTheme, "scratch");
  }
  if (isSettingsMode) {
    return renderSingleModePane(layoutState, resolvedTheme, "settings");
  }

  return html`
    <div class="panes-container">
      <!-- 1. Menu (最左メニュー領域: 固定 45px) -->
      ${renderAppMenuTemplate(layoutState, resolvedTheme)}

      <!-- 2. Navigation ペイン (第2ペイン: 上下2分割) -->
      ${renderNavigationAside(isOpen, resolvedTheme)}

      <!-- 3. Task List (第3ペイン) -->
      <task-list
        class="task-list pane-collapsible"
        data-theme=${resolvedTheme}
        ?hidden=${!isOpen}
      ></task-list>

      <!-- 4. Task ペイン (第4ペイン: タスク管理) -->
      <main class="task-pane">
        <task-pane data-theme=${resolvedTheme}></task-pane>
      </main>

      <!-- 5. Journal ペイン (第5ペイン: 作業記録・履歴) -->
      ${renderJournalAside(isJournalOpen, resolvedTheme)}
    </div>
  `;
}
