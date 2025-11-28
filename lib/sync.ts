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
          await apiCreateTag(op.payload);
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
