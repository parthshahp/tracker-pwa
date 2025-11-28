import Dexie, { Table } from "dexie";
import { PendingOpUnion } from "./ops";

export type TimeEntryRow = {
  id: string;
  userId?: string;
  startAt: string;
  endAt?: string | null;
  note?: string | null;
  deleted: number;
  tagIds: string[];
  updatedAt: string;
  createdAt: string;
};

export type PendingOpRow = {
  id?: number;
  entryId: string; // time entry id or tag id, depending on op type
  createdAt: string;
} & PendingOpUnion;

class AppDB extends Dexie {
  timeEntries!: Table<TimeEntryRow, string>;
  pendingOps!: Table<PendingOpRow, number>;

  constructor() {
    super("time-tracker");

    this.version(1).stores({
      timeEntries: "&id, startAt, endAt, deleted",
      pendingOps: "++id, entryId, type, createdAt",
    });
  }
}

export const db = new AppDB();
