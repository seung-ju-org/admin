"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Props = {
  triggerLabel: string
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => Promise<void> | void
  disabled?: boolean
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: "default" | "sm" | "lg" | "icon"
}

export function ConfirmActionButton({
  triggerLabel,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  disabled,
  variant = "outline",
  size = "sm",
}: Props) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button disabled={disabled} size={size} variant={variant}>
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction disabled={isSubmitting} onClick={handleConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
