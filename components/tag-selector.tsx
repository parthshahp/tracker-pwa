'use client'

import { type FocusEvent, useMemo, useRef, useState } from 'react'
import { Tag, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export type TagOption = { id: string; label: string }

type TagSelectorProps = {
  availableTags: TagOption[]
  selectedTags: TagOption[]
  onSelectTag: (tag: TagOption) => void
  onRemoveTag: (tagId: string) => void
  isLoading?: boolean
  isError?: boolean
}

export function TagSelector({
  availableTags,
  selectedTags,
  onSelectTag,
  onRemoveTag,
  isLoading,
  isError,
}: TagSelectorProps) {
  const [search, setSearch] = useState('')
  const [isListVisible, setIsListVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmedSearch = search.trim()

  const filteredTags = useMemo(() => {
    const query = trimmedSearch.toLowerCase()
    if (!query) return availableTags
    return availableTags.filter((tag) => tag.label.toLowerCase().includes(query))
  }, [availableTags, trimmedSearch])

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
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      setIsListVisible(true)
    })
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget)) return
    setIsListVisible(false)
    setSearch('')
  }

  return (
    <div
      className="space-y-3"
      onFocusCapture={() => setIsListVisible(true)}
      onBlurCapture={handleBlur}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Tag className="h-4 w-4" />
        <Label className="text-base text-foreground">Tags</Label>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedTags.length === 0 && (
          <p className="text-sm text-muted-foreground">No tags selected</p>
        )}
        {selectedTags.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="flex items-center gap-1 cursor-pointer" onClick={() => onRemoveTag(tag.id)}>
            <span>{tag.label}</span>
            <span
              className='rounded-full p-0.5 text-muted-foreground transition hover:text-foreground'
              onClick={() => onRemoveTag(tag.id)}
              aria-label={`Remove ${tag.label}`}
            >
              <X className="h-3 w-3" />
            </span>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          ref={inputRef}
          value={search}
          onFocus={() => setIsListVisible(true)}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && filteredTags.length > 0) {
              event.preventDefault()
              handleSelect(filteredTags[0])
            }
            if (event.key === 'Backspace' && !search && selectedTags.length > 0) {
              onRemoveTag(selectedTags[selectedTags.length - 1].id)
            }
          }}
          placeholder="Start typing to add tags"
          aria-label="Add tags"
        />
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
