"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  backHref: string
  children: React.ReactNode
  className?: string
}

const Modal = ({ open, onOpenChange, backHref, children, className }: ModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "w-[95%] max-w-[640px] rounded-2xl border-none bg-white py-10 px-4 text-center text-gray-900 shadow-2xl",
          className
        )}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogTitle className="sr-only">Checkout instructions</DialogTitle>
        <div className="absolute left-6 top-6">
          <Link
            href={backHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
        <div className="flex flex-col gap-6 pb-2 pt-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default Modal
