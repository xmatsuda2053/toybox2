import { html, nothing, type TemplateResult } from "lit";
import type { ToolDefinition } from "../models/huboffice.model";

export interface HomeViewProps {
  tools: readonly ToolDefinition[];
  filterQuery: string;
  pinnedToolIds: readonly string[];
  onFilterChange: (query: string) => void;
  onFilterClear: () => void;
  onOpenTool: (toolId: string) => void;
  onTogglePin: (toolId: string) => void;
}

function renderToolCard(
  tool: ToolDefinition,
  isPinned: boolean,
  onOpenTool: (toolId: string) => void,
  onTogglePin: (toolId: string) => void,
): TemplateResult {
  const pinLabel = isPinned
    ? `${tool.name}のピン留めを解除`
    : `${tool.name}をピン留め`;

  return html`
    <article
      class="home-view__card ${isPinned ? "home-view__card--pinned" : ""}"
    >
      <button
        type="button"
        class="home-view__card-main"
        @click=${() => onOpenTool(tool.id)}
      >
        <span class="home-view__icon-box" aria-hidden="true">
          <wa-icon class="home-view__icon" name=${tool.icon}></wa-icon>
        </span>
        <span class="home-view__text-group">
          <span class="home-view__tool-name">${tool.name}</span>
          <span class="home-view__tool-desc">${tool.description}</span>
        </span>
      </button>
      <button
        type="button"
        class="home-view__pin-btn ${isPinned ? "home-view__pin-btn--active" : ""}"
        aria-label=${pinLabel}
        aria-pressed=${String(isPinned)}
        title=${pinLabel}
        @click=${() => onTogglePin(tool.id)}
      >
        <wa-icon name="thumbtack-solid-full"></wa-icon>
      </button>
    </article>
  `;
}

function renderToolSection(
  heading: string,
  tools: readonly ToolDefinition[],
  pinnedSet: ReadonlySet<string>,
  props: HomeViewProps,
): TemplateResult | typeof nothing {
  if (tools.length === 0) {
    return nothing;
  }

  return html`
    <section class="home-view__section">
      <h2 class="home-view__section-heading">${heading}</h2>
      <div class="home-view__list">
        ${tools.map((tool) =>
          renderToolCard(
            tool,
            pinnedSet.has(tool.id),
            props.onOpenTool,
            props.onTogglePin,
          ),
        )}
      </div>
    </section>
  `;
}

/**
 * ホーム画面（フィルタ入力・ピン留め一覧・全ツール一覧）をレンダリングする
 */
export function renderHomeView(props: HomeViewProps): TemplateResult {
  const pinnedSet = new Set(props.pinnedToolIds);
  const pinnedTools = props.tools.filter((t) => pinnedSet.has(t.id));
  const otherTools = props.tools.filter((t) => !pinnedSet.has(t.id));

  return html`
    <div class="home-view">
      <div class="home-view__filter">
        <wa-input
          size="m"
          placeholder="ツール名・説明で絞り込み..."
          .value=${props.filterQuery}
          with-clear
          @input=${(e: Event) => {
            const target = e.target as HTMLInputElement;
            props.onFilterChange(target.value);
          }}
          @wa-clear=${props.onFilterClear}
        >
          <wa-icon slot="start" name="magnifying-glass-solid-full"></wa-icon>
        </wa-input>
      </div>

      ${
        props.tools.length === 0
          ? html`<p class="home-view__empty">
              条件に一致するツールがありません。
            </p>`
          : html`
              ${renderToolSection("ピン留め", pinnedTools, pinnedSet, props)}
              ${renderToolSection(
                pinnedTools.length > 0 ? "その他のツール" : "ツール一覧",
                otherTools,
                pinnedSet,
                props,
              )}
            `
      }
    </div>
  `;
}
