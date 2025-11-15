'use client'

import { useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type TimeEntry = {
  id: string | number
  startTime: string
  endTime: string
  tags?: Array<{ id?: string | number; label?: string; name?: string } | string>
}

const ENTRIES_ENDPOINT = 'http://localhost:8787/api/time-entries'

export function TimeEntriesList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['time-entries'],
    queryFn: fetchEntries,
    refetchInterval: 30_000,
  })

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
    <div className="space-y-3">
      {data.map((entry) => (
        <Card key={entry.id} className="border border-border/80">
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{formatTime(entry.startTime)}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium text-foreground">{formatTime(entry.endTime)}</span>
            </div>
            {!!entry.tags?.length && (
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag, index) => {
                  const normalized = normalizeTag(tag)
                  if (!normalized) return null
                  return (
                    <Badge key={normalized.id ?? index} variant="secondary">
                      {normalized.label}
                    </Badge>
                  )
                })}
              </div>
            )}
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
  return payload
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function normalizeTag(tag: TimeEntry['tags'][number]) {
  if (typeof tag === 'string') {
    return { id: tag, label: tag }
  }
  if (!tag) return null
  const label = tag.label ?? tag.name
  if (!label) return null
  return { id: tag.id ?? label, label }
}
