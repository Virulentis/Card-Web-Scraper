import * as React from "react"
import * as ScrollAreaPrimitives from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitives.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}>
    <ScrollAreaPrimitives.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitives.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitives.Corner />
  </ScrollAreaPrimitives.Root>
))
ScrollArea.displayName = ScrollAreaPrimitives.Root.displayName

const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitives.Scrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}>
    <ScrollAreaPrimitives.Thumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitives.Scrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitives.Scrollbar.displayName

export { ScrollArea, ScrollBar }
