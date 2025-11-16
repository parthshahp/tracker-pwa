"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Tag = {
  id: string,
  userId: string,
  name: string,
  color?: string,
  updatedAt: string,
  createdAt: string,
}

type TimeEntry = {
  id: string | number
  startAt: string
  endAt: string | null
  tags?: Tag[]
}

const ENTRIES_ENDPOINT = "http://localhost:8787/api/time-entries"

export default function TimeEntriesList() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["time-entries"],
    queryFn: fetchEntries,
    refetchInterval: 30_000,
  })
  const deleteMutation = useMutation<void, Error, string | number, { previous?: TimeEntry[] }>({
    mutationFn: (id: string | number) => deleteEntry(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["time-entries"] })
      const previous = queryClient.getQueryData<TimeEntry[]>([
        "time-entries",
      ])
      queryClient.setQueryData<TimeEntry[]>(["time-entries"], (old = []) =>
        old.filter((entry) => entry.id !== id),
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["time-entries"], context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["time-entries"] })
    },
  })
  const activeDeletionId = deleteMutation.variables ?? null

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading entries…</p>
  }

  if (isError) {
    return <p className="text-sm text-destructive">Unable to load time entries.</p>
  }

  if (!data?.length) {
    return <p className="text-sm text-muted-foreground">No entries yet.</p>
  }

  return (
    <div className="space-y-2">
      {data.map((entry) => (
        <Card
          key={entry.id}
          className="border border-border/80 shadow-sm py-2"
        >
          <CardContent className="flex min-h-[48px] items-center justify-between gap-3 rounded-xl px-3 py-1.5 text-xs sm:text-sm">
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-1 font-medium">
                <span>{formatTime(entry.startAt)}</span>
                <span className="text-muted-foreground">→</span>
                <span>{formatTime(entry.endAt)}</span>
                <span className="text-[11px] text-muted-foreground">
                  ({formatDuration(entry.startAt, entry.endAt)})
                </span>
              </div>
              {!!entry.tags?.length && (
                <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                  {entry.tags.map((tag, index) => {
                    return (
                      <Badge
                        key={tag.id ?? index}
                        variant="secondary"
                        className="px-1 py-px text-[10px]"
                      >
                        {tag.name}
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="self-center text-muted-foreground transition-transform ease-in-out active:scale-95"
              onClick={() => deleteMutation.mutate(entry.id)}
              disabled={
                deleteMutation.isPending && activeDeletionId === entry.id
              }
              aria-label="Delete time entry"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function fetchEntries(): Promise<TimeEntry[]> {
  const response = await fetch(ENTRIES_ENDPOINT, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Failed to fetch time entries')
  }
  const payload = await response.json()
  if (!Array.isArray(payload)) return []
  return payload.sort((a, b) => {
    const endA = new Date(b.endAt ?? b.startAt).getTime()
    const endB = new Date(a.endAt ?? a.startAt).getTime()
    if (Number.isNaN(endA) || Number.isNaN(endB)) return 0
    return endA - endB
  })
}

function formatTime(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(start: string, end: string | null) {
  if (!end) return 'In progress'
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return '—'
  }
  const diffMs = endDate.getTime() - startDate.getTime()
  if (diffMs < 0) return '—'
  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const segments = [
    hours ? `${hours}h` : null,
    minutes ? `${minutes}m` : null,
    seconds || (!hours && !minutes) ? `${seconds}s` : null,
  ].filter(Boolean)
  return segments.join(' ')
}

async function deleteEntry(id: string | number) {
  const response = await fetch(`${ENTRIES_ENDPOINT}/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete entry')
  }
}
