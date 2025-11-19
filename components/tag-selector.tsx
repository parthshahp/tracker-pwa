"use client";

import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_TAG_COLOR,
  getTagBadgeStyles,
  normalizeHexColor,
} from "@/lib/tag-colors";
import { cn } from "@/lib/utils";

export type TagOption = { id: string; label: string; color?: string | null };

type TagSelectorProps = {
  availableTags: TagOption[];
  selectedTags: TagOption[];
  onSelectTag: (tag: TagOption) => void;
  onRemoveTag: (tagId: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  buttonClassName?: string;
  onCreateTag?: (input: { name: string; color: string }) => Promise<void>;
  isCreatingTag?: boolean;
};

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
  const [search, setSearch] = useState("");
  const [isListVisible, setIsListVisible] = useState(false);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [pendingTagName, setPendingTagName] = useState("");
  const [pendingTagColor, setPendingTagColor] = useState(DEFAULT_TAG_COLOR);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogNameId = useId();
  const dialogColorId = useId();

  const trimmedSearch = search.trim();
  const selectedIds = useMemo(
    () => new Set(selectedTags.map((tag) => tag.id)),
    [selectedTags],
  );

  const activeBadgeIndex = useMemo(() => {
    if (!activeTagId) return -1;
    const index = selectedTags.findIndex((tag) => tag.id === activeTagId);
    return index === -1 ? -1 : index;
  }, [activeTagId, selectedTags]);

  const filteredTags = useMemo(() => {
    const pool = availableTags.filter((tag) => !selectedIds.has(tag.id));
    if (!trimmedSearch) return pool;
    const query = trimmedSearch.toLowerCase();
    return pool.filter((tag) => tag.label.toLowerCase().includes(query));
  }, [availableTags, selectedIds, trimmedSearch]);

  const showCreateOption = Boolean(onCreateTag) && Boolean(trimmedSearch);
  const optionItems = useMemo(() => {
    const tagOptions = filteredTags.map((tag) => ({
      type: "tag" as const,
      tag,
    }));
    return showCreateOption
      ? [...tagOptions, { type: "create" as const }]
      : tagOptions;
  }, [filteredTags, showCreateOption]);
  const visibleItemCount = optionItems.length || 1;
  const popoverRows = Math.min(Math.max(visibleItemCount, 1), 5);
  const popoverMaxHeight = popoverRows * 44;
  const popoverStyle = useMemo(
    () =>
      ({
        maxHeight: popoverMaxHeight,
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        background:
          "linear-gradient(180deg, rgba(5,7,15,0.72) 0%, rgba(9,13,25,0.82) 55%, rgba(4,6,12,0.78) 100%)",
      }) satisfies CSSProperties,
    [popoverMaxHeight],
  );
  const inputContainerClassName =
    "glass-panel glass-panel-strong flex min-h-13 w-full flex-wrap items-center gap-2 rounded-2xl border border-white/20 px-4 py-2 text-sm shadow-lg transition focus-within:ring-2 focus-within:ring-white/50";
  const dropdownContainerClassName =
    "absolute inset-x-0 top-full z-20 mt-3 overflow-hidden rounded-2xl border border-white/25 p-1 text-sm text-white shadow-2xl shadow-black/70 backdrop-blur-3xl";

  function renderLabel(label: string) {
    if (!trimmedSearch) return label;
    const lowerLabel = label.toLowerCase();
    const lowerSearch = trimmedSearch.toLowerCase();
    const matchIndex = lowerLabel.indexOf(lowerSearch);
    if (matchIndex === -1) return label;

    const before = label.slice(0, matchIndex);
    const match = label.slice(matchIndex, matchIndex + trimmedSearch.length);
    const after = label.slice(matchIndex + trimmedSearch.length);

    return (
      <span>
        {before}
        <span className="font-extrabold">{match}</span>
        {after}
      </span>
    );
  }

  function handleSelect(tag: TagOption) {
    onSelectTag(tag);
    setSearch("");
    setActiveTagId(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      setIsListVisible(true);
    });
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsListVisible(false);
    setSearch("");
    setActiveTagId(null);
  }

  function handleCreateOption() {
    if (!onCreateTag || !trimmedSearch) return;
    setPendingTagName(trimmedSearch);
    setIsCreateDialogOpen(true);
    setIsListVisible(false);
    setActiveTagId(null);
  }

  async function handleConfirmCreateTag() {
    if (!onCreateTag) return;
    const trimmedName = pendingTagName.trim();
    if (!trimmedName) return;
    const normalizedColor =
      normalizeHexColor(pendingTagColor) ?? DEFAULT_TAG_COLOR;
    try {
      await onCreateTag({ name: trimmedName, color: normalizedColor });
      setSearch("");
      setPendingTagName("");
      setPendingTagColor(DEFAULT_TAG_COLOR);
      setIsCreateDialogOpen(false);
      setIsListVisible(false);
      setActiveTagId(null);
    } catch {
      // Error handled by parent component
    }
  }

  function handleCreateDialogOpenChange(isOpen: boolean) {
    if (!isOpen && isCreatingTag) return;
    setIsCreateDialogOpen(isOpen);
    if (!isOpen) {
      setPendingTagName("");
      setPendingTagColor(DEFAULT_TAG_COLOR);
    }
  }

  function removeByIndex(index: number) {
    const tag = selectedTags[index];
    if (!tag) return;
    const nextTag = selectedTags[index + 1] ?? selectedTags[index - 1];
    setActiveTagId(nextTag?.id ?? null);
    onRemoveTag(tag.id);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowLeft" && !search) {
      event.preventDefault();
      if (activeBadgeIndex === -1) {
        setActiveTagId(selectedTags[selectedTags.length - 1]?.id ?? null);
      } else if (activeBadgeIndex > 0) {
        setActiveTagId(selectedTags[activeBadgeIndex - 1]?.id ?? null);
      }
      return;
    }

    if (event.key === "ArrowRight" && activeBadgeIndex !== -1) {
      event.preventDefault();
      if (activeBadgeIndex < selectedTags.length - 1) {
        setActiveTagId(selectedTags[activeBadgeIndex + 1]?.id ?? null);
      } else {
        setActiveTagId(null);
      }
      return;
    }

    if (
      (event.key === "Backspace" || event.key === "Enter") &&
      activeBadgeIndex !== -1
    ) {
      event.preventDefault();
      removeByIndex(activeBadgeIndex);
      return;
    }

    if (event.key === "Enter" && filteredTags.length > 0) {
      event.preventDefault();
      handleSelect(filteredTags[0]);
      return;
    }

    if (event.key === "Backspace" && !search && selectedTags.length > 0) {
      event.preventDefault();
      removeByIndex(selectedTags.length - 1);
      return;
    }

    if (activeBadgeIndex !== -1 && event.key.length === 1) {
      setActiveTagId(null);
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
          className={cn(
            inputContainerClassName,
            isListVisible && "ring-2 ring-white/60",
          )}
          onClick={() => {
            setActiveTagId(null);
            inputRef.current?.focus();
          }}
        >
          {selectedTags.map((tag, index) => (
            <SelectedTagChip
              key={tag.id}
              tag={tag}
              isActive={activeBadgeIndex === index}
              buttonClassName={buttonClassName}
              onRemove={() => {
                removeByIndex(index);
              }}
            />
          ))}
          <input
            ref={inputRef}
            value={search}
            onFocus={() => setIsListVisible(true)}
            onChange={(event) => {
              setSearch(event.target.value);
              setActiveTagId(null);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={
              selectedTags.length ? "Add another tag" : "Type to add tags"
            }
            aria-label="Add tags"
            className="min-w-[6ch] flex-1 border-0 bg-transparent p-0 text-sm text-white placeholder:text-white/60 outline-none"
          />
        </div>

        <TagOptionsDropdown
          isVisible={isListVisible}
          containerClassName={dropdownContainerClassName}
          style={popoverStyle}
          onRequestFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          filteredTags={filteredTags}
          renderLabel={renderLabel}
          showCreateOption={showCreateOption}
          trimmedSearch={trimmedSearch}
          isLoading={isLoading}
          isError={isError}
          isCreatingTag={isCreatingTag}
          onSelectTag={handleSelect}
          onRequestCreateTag={handleCreateOption}
        />
      </div>
      <CreateTagDialog
        open={isCreateDialogOpen}
        name={pendingTagName}
        colorValue={pendingTagColor}
        isSubmitting={Boolean(isCreatingTag)}
        onOpenChange={handleCreateDialogOpenChange}
        onNameChange={setPendingTagName}
        onColorChange={setPendingTagColor}
        onSubmit={handleConfirmCreateTag}
        nameInputId={dialogNameId}
        colorInputId={dialogColorId}
      />
    </div>
  );
}

type SelectedTagChipProps = {
  tag: TagOption;
  isActive: boolean;
  buttonClassName?: string;
  onRemove: () => void;
};

function SelectedTagChip({
  tag,
  isActive,
  buttonClassName,
  onRemove,
}: SelectedTagChipProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "group flex cursor-pointer items-center gap-1.5 rounded-2xl border px-2 py-1 text-white shadow-inner shadow-white/5",
        isActive && "ring-2 ring-white/60",
      )}
      style={getTagBadgeStyles(tag.color)}
      onClick={(event) => {
        event.stopPropagation();
        onRemove();
      }}
    >
      <span>{tag.label}</span>
      <button
        type="button"
        className={cn(
          "cursor-pointer rounded-full text-white/70 transition group-hover:text-white group-focus-within:text-white hover:text-white",
          buttonClassName,
        )}
        aria-label={`Remove ${tag.label}`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

type TagOptionsDropdownProps = {
  isVisible: boolean;
  containerClassName: string;
  style: CSSProperties;
  onRequestFocus: (event: React.MouseEvent<HTMLDivElement>) => void;
  filteredTags: TagOption[];
  renderLabel: (label: string) => ReactNode;
  showCreateOption: boolean;
  trimmedSearch: string;
  isLoading?: boolean;
  isError?: boolean;
  isCreatingTag?: boolean;
  onSelectTag: (tag: TagOption) => void;
  onRequestCreateTag: () => void;
};

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
  onRequestCreateTag,
}: TagOptionsDropdownProps) {
  if (!isVisible) return null;

  return (
    <div
      className={containerClassName}
      style={style}
      onMouseDown={onRequestFocus}
    >
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
                ? "Loading tags..."
                : isError
                  ? "Unable to load tags"
                  : "No tags found."}
            </CommandEmpty>
          ) : null}
          {showCreateOption && (
            <CommandItem
              value={`create-${trimmedSearch}`}
              onSelect={() => onRequestCreateTag()}
              disabled={isCreatingTag}
              className="text-white/90 data-[selected=true]:bg-white/15 data-[selected=true]:text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add &ldquo;{trimmedSearch}&rdquo;
            </CommandItem>
          )}
        </CommandList>
      </Command>
    </div>
  );
}

type CreateTagDialogProps = {
  open: boolean;
  name: string;
  colorValue: string;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  nameInputId: string;
  colorInputId: string;
};

function CreateTagDialog({
  open,
  name,
  colorValue,
  isSubmitting,
  onOpenChange,
  onNameChange,
  onColorChange,
  onSubmit,
  nameInputId,
  colorInputId,
}: CreateTagDialogProps) {
  const previewColor = normalizeHexColor(colorValue) ?? DEFAULT_TAG_COLOR;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel glass-panel-strong border-white/15 bg-[#05070f]/90 text-white/90 backdrop-blur-3xl">
        <DialogHeader>
          <DialogTitle>Create tag</DialogTitle>
          <DialogDescription className="text-white/70">
            Set a name and color for your new tag.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor={nameInputId} className="text-white/80">
              Name
            </Label>
            <Input
              id={nameInputId}
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Design review"
              autoComplete="off"
              autoFocus
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={colorInputId} className="text-white/80">
              Color (hex)
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8 shrink-0">
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none block h-full w-full rounded-full border border-white/20 shadow-inner shadow-black/50 transition-opacity",
                    isSubmitting && "opacity-60",
                  )}
                  style={{ backgroundColor: previewColor }}
                />
                <input
                  type="color"
                  aria-label="Choose color"
                  value={previewColor}
                  onChange={(event) => onColorChange(event.target.value)}
                  disabled={isSubmitting}
                  className="absolute inset-0 h-full w-full cursor-pointer rounded-full border-0 bg-transparent p-0 opacity-0 appearance-none"
                  style={{ WebkitAppearance: "none" }}
                />
              </div>
              <Input
                id={colorInputId}
                value={colorValue}
                onChange={(event) => onColorChange(event.target.value)}
                placeholder="#6B7280"
                autoComplete="off"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-white/60">
              Use a 6-digit hex color (e.g., #2563eb).
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="text-white/70 hover:text-white"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Saving..." : "Save tag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
