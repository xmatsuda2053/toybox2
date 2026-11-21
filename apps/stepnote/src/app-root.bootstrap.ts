import type { ReactiveControllerHost } from "lit";
import { ContextProvider, type Context } from "@lit/context";
import {
  layoutUIContext,
  quickAccessContext,
  labelsContext,
  taskContext,
  taskListContext,
  taskTableContext,
  logsContext,
  notesContext,
  issuesContext,
  themeContext,
  scratchContext,
  taskTemplateContext,
  autoExportContext,
  taskHistoryContext,
  tagsContext,
  tagSetsContext,
} from "@/contexts/index.js";
import { LayoutUIController } from "@/controllers/layout-ui.controller.js";
import { QuickAccessController } from "@/controllers/quick-access.controller.js";
import { LabelsController } from "@/controllers/labels.controller.js";
import { TagsController } from "@/controllers/tags.controller.js";
import { TagSetsController } from "@/controllers/tag-sets.controller.js";
import { TaskController } from "@/controllers/task.controller.js";
import { TaskListController } from "@/controllers/task-list.controller.js";
import { TaskTableController } from "@/controllers/task-table.controller.js";
import { LogsController } from "@/controllers/logs.controller.js";
import { NotesController } from "@/controllers/notes.controller.js";
import { IssuesController } from "@/controllers/issues.controller.js";
import { ThemeController } from "@/controllers/theme.controller.js";
import { ScratchController } from "@/controllers/scratch.controller.js";
import { TaskTemplateController } from "@/controllers/task-template.controller.js";
import { AutoExportController } from "@/controllers/auto-export.controller.js";
import { TaskHistoryController } from "@/controllers/task-history.controller.js";
import { getCurrentFiscalYear } from "@shared/utils";
import { db } from "@/db/schema/database.schema.js";
import { TaskListQuery } from "@/db/queries/task-list.query.js";
import { SystemLogService } from "@/services/system-log.service.js";
import {
  QuickAccessRepository,
  LabelsRepository,
  TaskRepository,
  LogsRepository,
  NotesRepository,
  IssuesRepository,
  ScratchRepository,
  TaskTemplateRepository,
  TagsRepository,
  TagSetsRepository,
} from "@/repositories/index.js";

/** AppRoot が保持するリポジトリ群 */
export interface AppRepositories {
  taskRepository: TaskRepository;
  issuesRepository: IssuesRepository;
  notesRepository: NotesRepository;
  scratchRepository: ScratchRepository;
  labelsRepository: LabelsRepository;
  logsRepository: LogsRepository;
  tagsRepository: TagsRepository;
  tagSetsRepository: TagSetsRepository;
  quickAccessRepository: QuickAccessRepository;
  taskTemplateRepository: TaskTemplateRepository;
}

/** AppRoot が管理する Controller および Service 群 */
export interface AppControllerBundle {
  layoutUIController: LayoutUIController;
  quickAccessController: QuickAccessController;
  labelsController: LabelsController;
  taskController: TaskController;
  taskListController: TaskListController;
  taskTableController: TaskTableController;
  logsController: LogsController;
  notesController: NotesController;
  issuesController: IssuesController;
  themeController: ThemeController;
  scratchController: ScratchController;
  taskTemplateController: TaskTemplateController;
  autoExportController: AutoExportController;
  taskHistoryController: TaskHistoryController;
  tagsController: TagsController;
  tagSetsController: TagSetsController;
  systemLogService: SystemLogService;
}

/** 自動エクスポートコントローラー用コールバック群 */
export interface AutoExportCallbacks {
  exportCallback: () => Promise<void>;
  notifyCallback: (fileName: string) => void;
}

/**
 * アプリ全体で利用するリポジトリ群を一括生成する。
 */
export function createAppRepositories(): AppRepositories {
  return {
    taskRepository: new TaskRepository(),
    issuesRepository: new IssuesRepository(),
    notesRepository: new NotesRepository(),
    scratchRepository: new ScratchRepository(),
    labelsRepository: new LabelsRepository(),
    logsRepository: new LogsRepository(),
    tagsRepository: new TagsRepository(),
    tagSetsRepository: new TagSetsRepository(),
    quickAccessRepository: new QuickAccessRepository(),
    taskTemplateRepository: new TaskTemplateRepository(),
  };
}

function createNavigationAndJournalControllers(
  host: ReactiveControllerHost,
  repos: AppRepositories,
) {
  const layoutUIController = new LayoutUIController(host);
  const quickAccessController = new QuickAccessController(
    host,
    repos.quickAccessRepository,
  );
  const labelsController = new LabelsController(host, repos.labelsRepository);
  const logsController = new LogsController(host, repos.logsRepository);
  const scratchController = new ScratchController(
    host,
    repos.scratchRepository,
  );
  const systemLogService = new SystemLogService(
    repos.logsRepository,
    logsController,
  );
  const notesController = new NotesController(
    host,
    repos.notesRepository,
    undefined,
    systemLogService,
  );
  return {
    layoutUIController,
    quickAccessController,
    labelsController,
    logsController,
    scratchController,
    systemLogService,
    notesController,
  };
}

function createAppTaskTableController(
  host: ReactiveControllerHost,
  repos: AppRepositories,
  systemLogService: SystemLogService,
  taskController: TaskController,
  taskListController: TaskListController,
): TaskTableController {
  return new TaskTableController(host, {
    taskRepository: repos.taskRepository,
    issuesRepository: repos.issuesRepository,
    labelsRepository: repos.labelsRepository,
    tagsRepository: repos.tagsRepository,
    taskListQuery: new TaskListQuery(db),
    systemLogService,
    onTaskMutated: async (taskId: number) => {
      await taskListController.refresh();
      if (taskController.state?.id === taskId) {
        await taskController.refresh();
      }
    },
  });
}

function createTaskAndFeatureControllers(
  host: ReactiveControllerHost,
  repos: AppRepositories,
  systemLogService: SystemLogService,
  callbacks: AutoExportCallbacks,
) {
  const taskController = new TaskController(
    host,
    repos.taskRepository,
    undefined,
    repos.issuesRepository,
    systemLogService,
    repos.labelsRepository,
  );
  const taskListController = new TaskListController(
    host,
    repos.taskRepository,
    getCurrentFiscalYear(),
    new TaskListQuery(db),
  );
  const taskTableController = createAppTaskTableController(
    host,
    repos,
    systemLogService,
    taskController,
    taskListController,
  );

  return {
    taskTemplateController: new TaskTemplateController(
      host,
      repos.taskTemplateRepository,
    ),
    taskController,
    taskListController,
    taskTableController,
    issuesController: new IssuesController(
      host,
      repos.issuesRepository,
      undefined,
      systemLogService,
    ),
    themeController: new ThemeController(host),
    autoExportController: new AutoExportController(host, callbacks),
    taskHistoryController: new TaskHistoryController(host),
    tagsController: new TagsController(host, repos.tagsRepository),
    tagSetsController: new TagSetsController(host, repos.tagSetsRepository),
  };
}

/**
 * 各 Reactive Controller および関連 Service を生成して束ねる。
 */
export function createAppControllers(
  host: ReactiveControllerHost,
  repos: AppRepositories,
  callbacks: AutoExportCallbacks,
): AppControllerBundle {
  const navControllers = createNavigationAndJournalControllers(host, repos);
  const featureControllers = createTaskAndFeatureControllers(
    host,
    repos,
    navControllers.systemLogService,
    callbacks,
  );
  return {
    ...navControllers,
    ...featureControllers,
  };
}

/** @lit/context Provider が要求するホスト型 */
export type ContextProviderHost = ReactiveControllerHost & HTMLElement;

function provideContext<T>(
  host: ContextProviderHost,
  context: Context<unknown, T>,
  initialValue: T,
): void {
  new ContextProvider(host, { context, initialValue });
}

function provideCoreContexts(
  host: ContextProviderHost,
  bundle: AppControllerBundle,
): void {
  provideContext(host, layoutUIContext, bundle.layoutUIController);
  provideContext(host, quickAccessContext, bundle.quickAccessController);
  provideContext(host, labelsContext, bundle.labelsController);
  provideContext(host, taskContext, bundle.taskController);
  provideContext(host, taskListContext, bundle.taskListController);
  provideContext(host, taskTableContext, bundle.taskTableController);
  provideContext(host, logsContext, bundle.logsController);
  provideContext(host, notesContext, bundle.notesController);
  provideContext(host, issuesContext, bundle.issuesController);
}

function provideFeatureContexts(
  host: ContextProviderHost,
  bundle: AppControllerBundle,
): void {
  provideContext(host, themeContext, bundle.themeController);
  provideContext(host, scratchContext, bundle.scratchController);
  provideContext(host, taskTemplateContext, bundle.taskTemplateController);
  provideContext(host, autoExportContext, bundle.autoExportController);
  provideContext(host, taskHistoryContext, bundle.taskHistoryController);
  provideContext(host, tagsContext, bundle.tagsController);
  provideContext(host, tagSetsContext, bundle.tagSetsController);
}

/**
 * 全 15 種類の Controller を @lit/context Provider として登録する。
 */
export function provideAppContexts(
  host: ContextProviderHost,
  bundle: AppControllerBundle,
): void {
  provideCoreContexts(host, bundle);
  provideFeatureContexts(host, bundle);
}

async function syncSelectedTaskChildren(
  bundle: AppControllerBundle,
): Promise<void> {
  const currentTaskId = bundle.taskController.state?.id;
  if (bundle.issuesController.taskId !== currentTaskId) {
    bundle.issuesController.setTaskId(currentTaskId);
  }
  if (bundle.logsController.taskId !== currentTaskId) {
    bundle.logsController.setTaskId(currentTaskId);
  }
  if (bundle.notesController.taskId !== currentTaskId) {
    bundle.notesController.setTaskId(currentTaskId);
  }
  if (currentTaskId) {
    bundle.taskHistoryController.record(currentTaskId);
  }
  await Promise.all([
    bundle.taskListController.refresh(),
    bundle.taskTableController.refresh(),
  ]);
}

/**
 * Controller 間の状態連携イベント購読を設定する。
 */
export function bindAppControllerSubscriptions(
  bundle: AppControllerBundle,
  onRequestUpdate: () => void,
): void {
  bundle.taskController.subscribe(() => syncSelectedTaskChildren(bundle));

  bundle.issuesController.subscribe(async () => {
    await Promise.all([
      bundle.taskListController.refresh(),
      bundle.taskTableController.refresh(),
      bundle.taskController.refresh(),
    ]);
  });

  bundle.labelsController.subscribe(async () => {
    await bundle.taskTableController.refresh();
    onRequestUpdate();
  });

  bundle.tagsController.subscribe(async () => {
    await Promise.all([
      bundle.taskListController.refresh(),
      bundle.taskTableController.refresh(),
      bundle.taskController.refresh(),
      bundle.tagSetsController.refresh(),
    ]);
    onRequestUpdate();
  });
}
