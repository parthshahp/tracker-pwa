"use client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Pencil, Trash2 } from "lucide-react";

import type { Tag } from "@/types";
import { cn } from "@/lib/utils";
import { DEFAULT_TAG_COLOR, normalizeHexColor } from "@/lib/tag-colors";
import { useState } from "react";

type Props = {
  tags: Tag[];
};

export default function TagSettings({ tags }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="">
          <Pencil
            size={18}
            className="transition-transform duration-150 ease-in-out active:scale-90"
          />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[90vh] bg-transparent backdrop-blur-lg"
      >
        <SheetHeader>
          <SheetTitle>Manage Tags</SheetTitle>
        </SheetHeader>
        <div>
          {tags.map((tag) => (
            <TagRow tag={tag} key={tag.id} />
          ))}
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function TagRow({ tag }: { tag: Tag }) {
  const tagColor = normalizeHexColor(tag.color) ?? DEFAULT_TAG_COLOR;
  const [pendingTagColor, setPendingTagColor] = useState(tagColor);

  if (tag.label === "Work") {
    console.log(tag);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2">
      <div className="flex items-center gap-2">
        <ColorSelection
          initialColor={pendingTagColor}
          onColorChange={setPendingTagColor}
        />
        <span className="text-sm">{tag.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-xs">
          <Pencil />
        </Button>
        <Button variant="ghost" size="icon" className="text-xs text-red-500">
          {" "}
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

type ColorSelectionProps = {
  initialColor: string;
  onColorChange: (value: string) => void;
};
function ColorSelection({ initialColor, onColorChange }: ColorSelectionProps) {
  return (
    <div className="relative h-4 w-4 shrink-0">
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none block h-full w-full rounded-full border border-white/20 shadow-inner shadow-black/50 transition-opacity",
        )}
        style={{ backgroundColor: initialColor }}
      />
      <input
        type="color"
        aria-label="Choose color"
        value={initialColor}
        onChange={(event) => onColorChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer rounded-full border-0 bg-transparent p-0 opacity-0 appearance-none"
        style={{ WebkitAppearance: "none" }}
      />
    </div>
  );
}
