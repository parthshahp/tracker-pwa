'use client'

import {
  type FocusEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

export type TagOption = { id: string; label: string }

type TagSelectorProps = {
  availableTags: TagOption[]
  selectedTags: TagOption[]
  onSelectTag: (tag: TagOption) => void
  onRemoveTag: (tagId: string) => void
  isLoading?: boolean
  isError?: boolean
  buttonClassName?: string
}

export function TagSelector({
  availableTags,
  selectedTags,
  onSelectTag,
  onRemoveTag,
  isLoading,
  isError,
  buttonClassName,
}: TagSelectorProps) {
  const [search, setSearch] = useState('')
  const [isListVisible, setIsListVisible] = useState(false)
  const [activeBadgeIndex, setActiveBadgeIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmedSearch = search.trim()
  const selectedIds = useMemo(() => new Set(selectedTags.map((tag) => tag.id)), [selectedTags])

  useEffect(() => {
    if (activeBadgeIndex >= selectedTags.length) {
      setActiveBadgeIndex(selectedTags.length - 1)
    }
    if (selectedTags.length === 0 && activeBadgeIndex !== -1) {
      setActiveBadgeIndex(-1)
    }
  }, [activeBadgeIndex, selectedTags])

  const filteredTags = useMemo(() => {
    const pool = availableTags.filter((tag) => !selectedIds.has(tag.id))
    if (!trimmedSearch) return pool
    const query = trimmedSearch.toLowerCase()
    return pool.filter((tag) => tag.label.toLowerCase().includes(query))
  }, [availableTags, selectedIds, trimmedSearch])

  function renderLabel(label: string) {
    if (!trimmedSearch) return label
    const lowerLabel = label.toLowerCase()
    const lowerSearch = trimmedSearch.toLowerCase()
    const matchIndex = lowerLabel.indexOf(lowerSearch)
    if (matchIndex === -1) return label

    const before = label.slice(0, matchIndex)
    const match = label.slice(matchIndex, matchIndex + trimmedSearch.length)
    const after = label.slice(matchIndex + trimmedSearch.length)

    return (
      <span>
        {before}
        <span className="font-extrabold">{match}</span>
        {after}
      </span>
    )
  }

  function handleSelect(tag: TagOption) {
    onSelectTag(tag)
    setSearch('')
    setActiveBadgeIndex(-1)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      setIsListVisible(true)
    })
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget)) return
    setIsListVisible(false)
    setSearch('')
    setActiveBadgeIndex(-1)
  }

  function removeByIndex(index: number) {
    const tag = selectedTags[index]
    if (!tag) return
    onRemoveTag(tag.id)
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowLeft' && !search) {
      event.preventDefault()
      if (activeBadgeIndex === -1) {
        setActiveBadgeIndex(selectedTags.length - 1)
      } else if (activeBadgeIndex > 0) {
        setActiveBadgeIndex(activeBadgeIndex - 1)
      }
      return
    }

    if (event.key === 'ArrowRight' && activeBadgeIndex !== -1) {
      event.preventDefault()
      if (activeBadgeIndex < selectedTags.length - 1) {
        setActiveBadgeIndex(activeBadgeIndex + 1)
      } else {
        setActiveBadgeIndex(-1)
      }
      return
    }

    if ((event.key === 'Backspace' || event.key === 'Enter') && activeBadgeIndex !== -1) {
      event.preventDefault()
      removeByIndex(activeBadgeIndex)
      return
    }

    if (event.key === 'Enter' && filteredTags.length > 0) {
      event.preventDefault()
      handleSelect(filteredTags[0])
      return
    }

    if (event.key === 'Backspace' && !search && selectedTags.length > 0) {
      event.preventDefault()
      setActiveBadgeIndex(selectedTags.length - 1)
      removeByIndex(selectedTags.length - 1)
      return
    }

    if (activeBadgeIndex !== -1 && event.key.length === 1) {
      setActiveBadgeIndex(-1)
    }
  }

  return (
    <div
      className="space-y-2"
      onFocusCapture={() => setIsListVisible(true)}
      onBlurCapture={handleBlur}
    >
      <div className="relative">
        <div
          className={cn(
            'flex min-h-13 w-full flex-wrap items-center gap-1 rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus-within:ring-2 focus-within:ring-ring',
            isListVisible && 'ring-2 ring-ring',
          )}
          onClick={() => {
            setActiveBadgeIndex(-1)
            inputRef.current?.focus()
          }}
        >
          {selectedTags.map((tag, index) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className={cn(
                'flex items-center px-2 py-2 rounded-xl',
                activeBadgeIndex === index && 'ring-2 ring-ring',
              )}
            >
              <span>{tag.label}</span>
              <button
                type="button"
                className={cn(
                  'rounded-full text-muted-foreground transition hover:text-foreground',
                  buttonClassName,
                )}
                onClick={(event) => {
                  event.stopPropagation()
                  onRemoveTag(tag.id)
                  setActiveBadgeIndex((previous) =>
                    previous > index ? previous - 1 : previous === index ? -1 : previous,
                  )
                }}
                aria-label={`Remove ${tag.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            value={search}
            onFocus={() => setIsListVisible(true)}
            onChange={(event) => {
              setSearch(event.target.value)
              setActiveBadgeIndex(-1)
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={selectedTags.length ? 'Add another tag' : 'Type to add tags'}
            aria-label="Add tags"
            className="flex-1 min-w-[6ch] border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {isListVisible && filteredTags.length > 0 && (
          <div
            className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border bg-popover p-1 text-sm shadow-lg"
            style={{
              maxHeight: `${Math.min(filteredTags.length, 5) * 40 + 16}px`,
            }}
            onMouseDown={(event) => {
              event.preventDefault()
              inputRef.current?.focus()
            }}
          >
            <Command>
              <CommandList className="max-h-72 overflow-auto">
                <CommandGroup>
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.label}
                      onSelect={() => handleSelect(tag)}
                    >
                      {renderLabel(tag.label)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
        {isListVisible && filteredTags.length === 0 && (
          <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-xl border bg-popover p-3 text-sm shadow-lg">
            {isLoading ? 'Loading tags...' : isError ? 'Unable to load tags' : 'No tags found.'}
          </div>
        )}
      </div>
    </div>
  )
}
