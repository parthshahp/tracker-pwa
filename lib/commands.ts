// lib/commands.ts
import { db } from "@/db/db.model";
import type { PendingOpRow } from "@/db/db.model";

function nowIso() {
  return new Date().toISOString();
}

function uuid() {
  return crypto.randomUUID();
}

export async function startTimer(tagIds: string[], note?: string) {
  const id = uuid();
  const now = nowIso();

  await db.transaction("rw", db.timeEntries, db.pendingOps, async () => {
    await db.timeEntries.put({
      id,
      startAt: now,
      endAt: null,
      note: note ?? null,
      deleted: 0,
      tagIds: tagIds,
      createdAt: now,
      updatedAt: now,
    });

    const op: PendingOpRow = {
      entryId: id,
      createdAt: now,
      type: "CREATE_ENTRY",
      payload: {
        id,
        startAt: now,
        endAt: null,
        note: note ?? null,
        createdAt: now,
        updatedAt: now,
        tagIds: tagIds,
      },
    };

    await db.pendingOps.add(op);
  });

  return id;
}
export async function stopTimer(entryId: string, tagIds: string[]) {
  const endAt = nowIso();

  await db.transaction("rw", db.timeEntries, db.pendingOps, async () => {
    const entry = await db.timeEntries.get(entryId);
    if (!entry || entry.endAt) return;

    await db.timeEntries.update(entryId, {
      endAt,
      updatedAt: endAt,
      tagIds: tagIds,
    });

    const op: PendingOpRow = {
      entryId: entryId,
      createdAt: endAt,
      type: "UPDATE_ENTRY",
      payload: {
        id: entryId,
        startAt: entry.startAt,
        tagIds: tagIds,
        endAt: endAt,
        updatedAt: endAt,
      },
    };

    await db.pendingOps.add(op);
  });
}

export async function softDeleteTimeEntry(entryId: string) {
  const now = nowIso();

  await db.transaction("rw", db.timeEntries, db.pendingOps, async () => {
    const entry = await db.timeEntries.get(entryId);
    if (!entry || entry.deleted === 1) return;

    await db.timeEntries.update(entryId, {
      deleted: 1,
      updatedAt: now,
    });

    const op: PendingOpRow = {
      entryId,
      createdAt: now,
      type: "SOFT_DELETE_ENTRY",
      payload: {
        deleted: 1,
        updatedAt: now,
      },
    };

    await db.pendingOps.add(op);
  });
}
