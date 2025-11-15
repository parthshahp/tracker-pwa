'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Check, Play, Square, X } from 'lucide-react'

import { TagSelector, type TagOption } from '@/components/tag-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type TagLike = string | { id?: string | number; name?: string; label?: string }

const fallbackTags: TagOption[] = [
  { id: 'meeting', label: 'Meeting' },
  { id: 'planning', label: 'Planning' },
  { id: 'design', label: 'Design' },
  { id: 'development', label: 'Development' },
  { id: 'testing', label: 'Testing' },
  { id: 'research', label: 'Research' },
]

const TAGS_ENDPOINT = 'http://localhost:8787/api/tags'

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':')
}

export default function TimerCard({ tags }: { tags?: TagLike[] }) {
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
  const buttonMotionClasses = 'transition-transform duration-150 ease-in-out active:scale-95'

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  function handleStart() {
    setIsRunning(true)
  }

  function handleStop() {
    setIsRunning(false)
  }

  function resetTimer() {
    setIsRunning(false)
    setElapsedSeconds(0)
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

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="space-y-6">
        <TagSelector
          availableTags={availableTags}
          selectedTags={selectedTags}
          onSelectTag={handleSelectTag}
          onRemoveTag={removeTag}
          isLoading={isLoading}
          isError={isError}
          buttonClassName={buttonMotionClasses}
        />

        <div className="flex flex-wrap items-center gap-4">
          <p className="font-mono text-4xl tabular-nums">{formatTime(elapsedSeconds)}</p>
          <div className="ml-auto flex items-center gap-2">
            {isRunning ? (
              <Button
                size="icon"
                onClick={handleStop}
                aria-label="Stop timer"
                className={buttonMotionClasses}
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleStart}
                aria-label="Start timer"
                className={buttonMotionClasses}
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

  const maybeName = 'name' in item && typeof item.name === 'string' ? item.name : undefined
  const maybeLabel = 'label' in item && typeof item.label === 'string' ? item.label : maybeName
  const maybeIdValue = 'id' in item && item.id != null ? String(item.id) : maybeLabel

  if (!maybeLabel || !maybeIdValue) return null

  return { id: maybeIdValue, label: maybeLabel }
}
