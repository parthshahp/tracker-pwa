import { db } from "@/db/db.model";
import type { PendingOpRow } from "@/db/db.model";
import {
  apiCreateTimeEntry,
  apiUpdateTimeEntry,
  apiSoftDeleteTimeEntry,
  apiCreateTag,
  apiUpdateTag,
  apiDeleteTag,
} from "./api";

export async function syncPendingOps() {
  if (!navigator.onLine) return;

  const ops: PendingOpRow[] = await db.pendingOps
    .orderBy("createdAt")
    .toArray();

  for (const op of ops) {
    try {
      switch (op.type) {
        case "CREATE_ENTRY":
          await apiCreateTimeEntry(op.payload);
          break;

        case "UPDATE_ENTRY":
          await apiUpdateTimeEntry(op.entryId, op.payload);
          break;

        case "SOFT_DELETE_ENTRY":
          await apiSoftDeleteTimeEntry(op.entryId);
          break;

        case "CREATE_TAG":
          {
            const created = await apiCreateTag(op.payload);
            const createdId =
              created && typeof created === "object" && "id" in created
                ? String((created as { id?: unknown }).id)
                : null;
            if (createdId && createdId !== op.payload.id) {
              await remapTagId(op.payload.id, createdId, ops);
            }
          }
          break;

        case "UPDATE_TAG":
          await apiUpdateTag(op.entryId, op.payload);
          break;

        case "DELETE_TAG":
          await apiDeleteTag(op.entryId, op.payload);
          break;
      }

      await db.pendingOps.delete(op.id!);
    } catch (err) {
      console.error("Failed to sync op", op, err);
      break;
    }
  }
}

function replaceTagIds(
  tagIds: string[] | undefined,
  oldId: string,
  newId: string,
) {
  if (!Array.isArray(tagIds)) return tagIds;
  let changed = false;
  const next = tagIds.map((value) => {
    if (value === oldId) {
      changed = true;
      return newId;
    }
    return value;
  });
  return changed ? next : tagIds;
}

async function remapTagId(
  oldId: string,
  newId: string,
  opsInMemory: PendingOpRow[],
) {
  await db.transaction("rw", db.pendingOps, db.timeEntries, async () => {
    const pending = await db.pendingOps.toArray();
    for (const pendingOp of pending) {
      let changed = false;

      if (
        (pendingOp.type === "CREATE_TAG" ||
          pendingOp.type === "UPDATE_TAG" ||
          pendingOp.type === "DELETE_TAG") &&
        pendingOp.entryId === oldId
      ) {
        pendingOp.entryId = newId;
        (pendingOp as any).payload = {
          ...pendingOp.payload,
          id: newId,
        };
        changed = true;
      }

      if (
        pendingOp.type === "CREATE_ENTRY" ||
        pendingOp.type === "UPDATE_ENTRY"
      ) {
        const nextTagIds = replaceTagIds(
          (pendingOp.payload as any).tagIds,
          oldId,
          newId,
        );
        if (nextTagIds !== (pendingOp.payload as any).tagIds) {
          (pendingOp as any).payload = {
            ...pendingOp.payload,
            tagIds: nextTagIds,
          };
          changed = true;
        }
      }

      if (changed) {
        await db.pendingOps.put(pendingOp);
      }
    }

    const entries = await db.timeEntries
      .filter((entry) => Array.isArray(entry.tagIds) && entry.tagIds.includes(oldId))
      .toArray();

    for (const entry of entries) {
      const nextTagIds = replaceTagIds(entry.tagIds, oldId, newId);
      if (nextTagIds !== entry.tagIds) {
        await db.timeEntries.put({ ...entry, tagIds: nextTagIds });
      }
    }
  });

  for (const pendingOp of opsInMemory) {
    if (
      (pendingOp.type === "CREATE_TAG" ||
        pendingOp.type === "UPDATE_TAG" ||
        pendingOp.type === "DELETE_TAG") &&
      pendingOp.entryId === oldId
    ) {
      pendingOp.entryId = newId;
      (pendingOp as any).payload = {
        ...pendingOp.payload,
        id: newId,
      };
    }

    if (
      pendingOp.type === "CREATE_ENTRY" ||
      pendingOp.type === "UPDATE_ENTRY"
    ) {
      const nextTagIds = replaceTagIds(
        (pendingOp.payload as any).tagIds,
        oldId,
        newId,
      );
      if (nextTagIds !== (pendingOp.payload as any).tagIds) {
        (pendingOp as any).payload = {
          ...pendingOp.payload,
          tagIds: nextTagIds,
        };
      }
    }
  }
}
