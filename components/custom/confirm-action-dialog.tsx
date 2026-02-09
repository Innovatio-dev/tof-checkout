"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type ConfirmActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  confirmVariant?: React.ComponentProps<typeof Button>["variant"]
  cancelVariant?: React.ComponentProps<typeof Button>["variant"]
  className?: string
  contentClassName?: string
}

const ConfirmActionDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmVariant = "primary",
  cancelVariant = "outline",
  className,
  contentClassName,
}: ConfirmActionDialogProps) => {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onCancel?.()
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "w-[94vw] max-w-[420px] rounded-2xl border border-white/10 bg-dark p-6 text-white shadow-2xl",
          contentClassName
        )}
      >
        <DialogHeader className={cn("text-center", className)}>
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          {description ? <DialogDescription className="text-white/70">{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter className="mt-4 flex-col gap-3 sm:flex-col">
          <Button
            variant={cancelVariant}
            size="lg"
            className="w-full font-semibold"
            onClick={() => {
              onCancel?.()
              onOpenChange(false)
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            size="lg"
            className="w-full font-semibold"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmActionDialog
