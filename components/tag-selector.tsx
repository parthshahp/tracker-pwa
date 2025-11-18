'use client'

import {
  type CSSProperties,
  type FocusEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Plus, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
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
  onCreateTag?: (name: string) => Promise<void>
  isCreatingTag?: boolean
}

export function TagSelector({
  availableTags,
  selectedTags,
  onSelectTag,
  onRemoveTag,
  isLoading,
  isError,
  buttonClassName,
  onCreateTag,
  isCreatingTag,
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

  const showCreateOption = Boolean(onCreateTag) && Boolean(trimmedSearch)
  const optionItems = useMemo(() => {
    const tagOptions = filteredTags.map((tag) => ({ type: 'tag' as const, tag }))
    return showCreateOption ? [...tagOptions, { type: 'create' as const }] : tagOptions
  }, [filteredTags, showCreateOption])
  const visibleItemCount = optionItems.length || 1
  const popoverRows = Math.min(Math.max(visibleItemCount, 1), 5)
  const popoverMaxHeight = popoverRows * 44
  const popoverStyle = useMemo(() => ({
    maxHeight: popoverMaxHeight,
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    background:
      'linear-gradient(180deg, rgba(5,7,15,0.72) 0%, rgba(9,13,25,0.82) 55%, rgba(4,6,12,0.78) 100%)',
  }) satisfies CSSProperties, [popoverMaxHeight])
  const inputContainerClassName = 'glass-panel glass-panel-strong flex min-h-13 w-full flex-wrap items-center gap-2 rounded-2xl border border-white/20 px-4 py-2 text-sm shadow-lg transition focus-within:ring-2 focus-within:ring-white/50'
  const dropdownContainerClassName = 'absolute inset-x-0 top-full z-20 mt-3 overflow-hidden rounded-2xl border border-white/25 p-1 text-sm text-white shadow-2xl shadow-black/70 backdrop-blur-3xl'

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

  async function handleCreateOption() {
    if (!onCreateTag || !trimmedSearch) return
    const label = trimmedSearch
    try {
      await onCreateTag(label)
      setSearch('')
      setActiveBadgeIndex(-1)
    } catch (error) {
      console.error(error)
    }
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
      className="space-y-3 text-white/90"
      onFocusCapture={() => setIsListVisible(true)}
      onBlurCapture={handleBlur}
    >
      <div className="relative">
        <div
          className={cn(inputContainerClassName, isListVisible && 'ring-2 ring-white/60')}
          onClick={() => {
            setActiveBadgeIndex(-1)
            inputRef.current?.focus()
          }}
        >
          {selectedTags.map((tag, index) => (
            <SelectedTagChip
              key={tag.id}
              tag={tag}
              isActive={activeBadgeIndex === index}
              buttonClassName={buttonClassName}
              onRemove={(event) => {
                event.stopPropagation()
                onRemoveTag(tag.id)
                setActiveBadgeIndex((previous) =>
                  previous > index ? previous - 1 : previous === index ? -1 : previous,
                )
              }}
            />
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
            className="min-w-[6ch] flex-1 border-0 bg-transparent p-0 text-sm text-white placeholder:text-white/60 outline-none"
          />
        </div>

        <TagOptionsDropdown
          isVisible={isListVisible}
          containerClassName={dropdownContainerClassName}
          style={popoverStyle}
          onRequestFocus={(event) => {
            event.preventDefault()
            inputRef.current?.focus()
          }}
          filteredTags={filteredTags}
          renderLabel={renderLabel}
          showCreateOption={showCreateOption}
          trimmedSearch={trimmedSearch}
          isLoading={isLoading}
          isError={isError}
          isCreatingTag={isCreatingTag}
          onSelectTag={handleSelect}
          onCreateTag={handleCreateOption}
        />
      </div>
    </div>
  )
}

type SelectedTagChipProps = {
  tag: TagOption
  isActive: boolean
  buttonClassName?: string
  onRemove: (event: React.MouseEvent<HTMLButtonElement>) => void
}

function SelectedTagChip({ tag, isActive, buttonClassName, onRemove }: SelectedTagChipProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-2 py-1 text-white shadow-inner shadow-white/5',
        isActive && 'ring-2 ring-white/60',
      )}
    >
      <span>{tag.label}</span>
      <button
        type="button"
        className={cn('rounded-full text-white/70 transition hover:text-white', buttonClassName)}
        aria-label={`Remove ${tag.label}`}
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}

type TagOptionsDropdownProps = {
  isVisible: boolean
  containerClassName: string
  style: CSSProperties
  onRequestFocus: (event: React.MouseEvent<HTMLDivElement>) => void
  filteredTags: TagOption[]
  renderLabel: (label: string) => React.ReactNode
  showCreateOption: boolean
  trimmedSearch: string
  isLoading?: boolean
  isError?: boolean
  isCreatingTag?: boolean
  onSelectTag: (tag: TagOption) => void
  onCreateTag: () => void | Promise<void>
}

function TagOptionsDropdown({
  isVisible,
  containerClassName,
  style,
  onRequestFocus,
  filteredTags,
  renderLabel,
  showCreateOption,
  trimmedSearch,
  isLoading,
  isError,
  isCreatingTag,
  onSelectTag,
  onCreateTag,
}: TagOptionsDropdownProps) {
  if (!isVisible) return null

  return (
    <div className={containerClassName} style={style} onMouseDown={onRequestFocus}>
      <Command className="bg-transparent text-white">
        <CommandList className="max-h-72 overflow-auto">
          {filteredTags.length > 0 ? (
            <CommandGroup className="text-white/80">
              {filteredTags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={tag.label}
                  onSelect={() => onSelectTag(tag)}
                  className="text-white/90 data-[selected=true]:bg-white/15 data-[selected=true]:text-white"
                >
                  {renderLabel(tag.label)}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : !showCreateOption ? (
            <CommandEmpty className="py-4 text-white/70">
              {isLoading
                ? 'Loading tags...'
                : isError
                  ? 'Unable to load tags'
                  : 'No tags found.'}
            </CommandEmpty>
          ) : null}
          {showCreateOption && (
            <CommandItem
              value={`create-${trimmedSearch}`}
              onSelect={() => void onCreateTag()}
              disabled={isCreatingTag}
              className="text-white/90 data-[selected=true]:bg-white/15 data-[selected=true]:text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add "{trimmedSearch}"
            </CommandItem>
          )}
        </CommandList>
      </Command>
    </div>
  )
}
