'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Play, Square } from 'lucide-react'

import { TagSelector, type TagOption } from '@/components/tag-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { API_ENDPOINTS } from '@/lib/api'

type TagLike =
  | string
  | {
      id?: string | number
      name?: string
      label?: string
      color?: string | null
    }
  | { id?: string | number; name?: string; label?: string; color?: string | null }

const { tags: TAGS_ENDPOINT, timeEntries: TIME_ENTRIES_ENDPOINT } = API_ENDPOINTS

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':')
}

export default function TimerCard({ tags }: { tags?: TagLike[] }) {
  const queryClient = useQueryClient()
  const { data: remoteTags = [], isLoading, isError } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 60_000,
  })
  const providedTags = useMemo(() => normalizeTags(tags), [tags])
  const availableTags = useMemo<TagOption[]>(() => {
    if (remoteTags.length) return remoteTags
    if (providedTags.length) return providedTags
    return fallbackTags
  }, [remoteTags, providedTags])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([])
  const [startTimestamp, setStartTimestamp] = useState<Date | null>(null)
  const [isSavingEntry, setIsSavingEntry] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [tagError, setTagError] = useState<string | null>(null)
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const buttonMotionClasses = 'transition-transform duration-150 ease-in-out active:scale-95'

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  function handleStart() {
    setElapsedSeconds(0)
    setIsRunning(true)
    setStartTimestamp(new Date())
    setSaveError(null)
  }

  async function handleStop() {
    if (!isRunning) return

    setIsRunning(false)
    const startedAt = startTimestamp
    const endedAt = new Date()
    setStartTimestamp(null)
    setElapsedSeconds(0)

    if (!startedAt) return
    if (isSavingEntry) return

    setIsSavingEntry(true)
    try {
      await postTimeEntry({
        startAt: startedAt.toISOString(),
        endAt: endedAt.toISOString(),
        tagIds: selectedTags.map((tag) => tag.id),
      })
      await queryClient.invalidateQueries({ queryKey: ['time-entries'] })
      setSaveError(null)
    } catch (error) {
      console.error(error)
      setSaveError('Unable to save time entry. Please try again.')
    } finally {
      setIsSavingEntry(false)
    }
  }

  function handleSelectTag(tag: TagOption) {
    setSelectedTags((previous) => {
      if (previous.some((item) => item.id === tag.id)) return previous
      return [...previous, tag]
    })
  }

  function removeTag(tagId: string) {
    setSelectedTags((previous) => previous.filter((tag) => tag.id !== tagId))
  }

  async function handleCreateTag(input: { name: string; color: string }) {
    const trimmed = input.name.trim()
    if (!trimmed || isCreatingTag) return
    setIsCreatingTag(true)
    try {
      const newTag = await postTag({ name: trimmed, color: input.color })
      handleSelectTag(newTag)
      setTagError(null)
      await queryClient.invalidateQueries({ queryKey: ['tags'] })
    } catch (error) {
      console.error(error)
      setTagError('Unable to create tag. Please try again.')
      throw error
    } finally {
      setIsCreatingTag(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl glass-panel glass-panel-strong border-white/20 py-0 shadow-2xl shadow-black/40">
      <CardContent className="space-y-6 px-5 py-6 text-white/90 sm:px-8 sm:py-8">
        <TagSelector
          availableTags={availableTags}
          selectedTags={selectedTags}
          onSelectTag={handleSelectTag}
          onRemoveTag={removeTag}
          isLoading={isLoading}
          isError={isError}
          buttonClassName={buttonMotionClasses}
          onCreateTag={handleCreateTag}
          isCreatingTag={isCreatingTag}
        />
        {tagError && (
          <p className="text-sm text-rose-200/90">{tagError}</p>
        )}
        {saveError && (
          <p className="text-sm text-rose-200/90">{saveError}</p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <p className="font-mono text-4xl tabular-nums text-white drop-shadow-lg sm:text-5xl">
            {formatTime(elapsedSeconds)}
          </p>
          <div className="ml-auto flex items-center gap-3">
            {isRunning ? (
              <Button
                size="icon"
                onClick={handleStop}
                aria-label="Stop timer"
                className={`${buttonMotionClasses} border border-white/30 bg-white/15 text-white hover:bg-white/25 focus-visible:ring-white/60`}
                disabled={isSavingEntry}
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleStart}
                aria-label="Start timer"
                className={`${buttonMotionClasses} border border-white/30 bg-emerald-400/20 text-white hover:bg-emerald-400/35 focus-visible:ring-white/60`}
                disabled={isSavingEntry}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

async function fetchTags(): Promise<TagOption[]> {
  const response = await fetch(TAGS_ENDPOINT, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error('Failed to fetch tags')
  }

  const payload = await response.json()
  return normalizeTags(payload)
}

async function postTimeEntry(payload: {
  startAt: string
  endAt: string
  tagIds: (string | number)[]
}) {
  const response = await fetch(TIME_ENTRIES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Failed to save time entry')
  }
}

async function postTag(payload: { name: string; color: string }): Promise<TagOption> {
  const response = await fetch(TAGS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Failed to create tag')
  }

  const responsePayload = await response.json()
  const normalized = toTagOption(responsePayload)
  if (!normalized) {
    throw new Error('Invalid tag response')
  }

  return normalized
}

function normalizeTags(input: unknown): TagOption[] {
  if (!Array.isArray(input)) return []

  return input
    .map((item) => toTagOption(item))
    .filter((tag): tag is TagOption => Boolean(tag))
}

function toTagOption(item: unknown): TagOption | null {
  if (typeof item === 'string') {
    return { id: item, label: item }
  }

  if (!item || typeof item !== 'object') return null

  const record = item as Record<string, unknown>
  const maybeName = typeof record.name === 'string' ? record.name : undefined
  const maybeLabel = typeof record.label === 'string' ? record.label : maybeName
  const idValue = record.id != null ? String(record.id) : maybeLabel
  const maybeColor = typeof record.color === 'string' ? record.color : undefined

  if (!maybeLabel || !idValue) return null

  return { id: idValue, label: maybeLabel, color: maybeColor }
}

const fallbackTags: TagOption[] = [
  { id: 'meeting', label: 'Meeting', color: '#8b5cf6' },
  { id: 'planning', label: 'Planning', color: '#0ea5e9' },
  { id: 'design', label: 'Design', color: '#f472b6' },
  { id: 'development', label: 'Development', color: '#22c55e' },
  { id: 'testing', label: 'Testing', color: '#f97316' },
  { id: 'research', label: 'Research', color: '#eab308' },
]
