"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-6 shrink-0 rounded-[4px] border border-neon-green shadow-xs",
        "transition-all outline-none focus-visible:border-ring focus-visible:ring-ring/50",
        "focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        "data-[state=checked]:bg-neon-green/10",
        "data-[state=checked]:text-primary-foreground",
        "data-[state=checked]:border-neon-green",
        "data-[state=checked]:shadow-[inset_0_0_7px_2px_rgba(123,252,127,0.4)]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
