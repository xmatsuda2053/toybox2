import {
  TaskRecord,
  LogRecord,
  NoteRecord,
  QuickAccessRecord,
  LabelRecord,
} from "../models/index";
import Dexie, { Table } from "dexie";

export class Database extends Dexie {
  tasks!: Table<TaskRecord, number>;
  logs!: Table<LogRecord, number>;
  notes!: Table<NoteRecord, number>;
  quickAccess!: Table<QuickAccessRecord, number>;
  labels!: Table<LabelRecord, number>;

  constructor() {
    super("StepNote");
    this.version(1).stores({
      tasks: "++id, statusCode, name, dueDate, fiscalYear, selected",
      logs: "++id, taskId, [taskId+id]",
      notes: "++id, taskId, [taskId+id]",
      quickAccess: "++id",
      labels: "++id, name, isSelected",
    });
  }
}

export const db = new Database();
