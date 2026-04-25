"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type SegmentedTabItem = {
  value: string;
  label: string;
  content: React.ReactNode;
};

type SegmentedTabsProps = {
  items: SegmentedTabItem[];
  /** Use for uncontrolled tabs (omit `value` / `onValueChange`). */
  defaultValue?: string;
  className?: string;
  listClassName?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

/**
 * Two-column (or N-column) segmented control built on the design-system Tabs.
 * Keyboard navigation follows the underlying Tab components.
 */
export function SegmentedTabs({
  items,
  defaultValue,
  className,
  listClassName,
  value,
  onValueChange,
}: SegmentedTabsProps) {
  const count = items.length;
  return (
    <Tabs
      className={cn("w-full gap-6", className)}
      {...(value !== undefined
        ? { value, onValueChange }
        : { defaultValue: defaultValue ?? items[0]?.value ?? "" })}
    >
      <TabsList
        variant="default"
        className={cn(
          "grid h-auto w-full gap-1 p-1",
          count === 2 && "grid-cols-2",
          count >= 3 && "grid-cols-2 sm:grid-cols-3",
          listClassName
        )}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className={cn(
              "min-h-10 px-3 py-2 text-xs sm:text-sm",
              "data-active:bg-zinc-900 data-active:text-[#FF6B35]"
            )}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          className="mt-0 outline-none"
        >
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
