export type CreateEntryPayload = {
  id: string;
  startAt: string;
  endAt?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  tagIds?: string[];
};
export type UpdateEntryPayload = {
  id: string;
  startAt: string;
  endAt?: string | null;
  note?: string | null;
  createdAt?: string;
  updatedAt: string;
  tagIds?: string[];
};
export type DeleteEntryPayload = {
  deleted: 1;
  updatedAt: string;
};

export const pendingOpPayloads = {
  CREATE_ENTRY: {} as CreateEntryPayload,
  UPDATE_ENTRY: {} as UpdateEntryPayload,
  SOFT_DELETE_ENTRY: {} as DeleteEntryPayload,
} as const;

export type PendingOpType = keyof typeof pendingOpPayloads;

type OpMap = {
  [K in PendingOpType]: { type: K; payload: (typeof pendingOpPayloads)[K] };
};
export type PendingOpUnion = OpMap[PendingOpType];
