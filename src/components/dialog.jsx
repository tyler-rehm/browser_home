import { useEffect, useRef } from 'react'
import {
  Dialog as Modal,
  DialogBackdrop,
  DialogPanel,
  DialogTitle as Title,
} from '@headlessui/react'
import clsx from 'clsx'

function cycleDialogFocus(event, root) {
  if (event.key !== 'Tab' || !root) return
  const focusable = [...root.querySelectorAll('button, [href], input, select, textarea')].filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('tabindex') !== '-1' &&
      element.getClientRects().length > 0,
  )
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const atStart = event.shiftKey && document.activeElement === first
  const atEnd = !event.shiftKey && document.activeElement === last
  if (!atStart && !atEnd) return
  event.preventDefault()
  event.stopPropagation()
  ;(atStart ? last : first).focus()
}

export function Dialog({ open, onClose, size = 'md', className, children }) {
  const panelRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => cycleDialogFocus(event, panelRef.current)
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open])
  return (
    <Modal open={open} onClose={onClose} className="fixed inset-0 z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/35" />
      <div className="pointer-events-none fixed inset-0 grid place-items-center overflow-y-auto px-4 py-6">
        <DialogPanel
          className={clsx(
            'pointer-events-auto relative w-full rounded-md border border-black/15 bg-[var(--paper)] p-8 text-[var(--ink)] shadow-xl',
            size === 'lg' ? 'max-w-lg' : 'max-w-md',
            className,
          )}
        >
          <div ref={panelRef}>{children}</div>
        </DialogPanel>
      </div>
    </Modal>
  )
}

export function DialogTitle({ className, ...props }) {
  return <Title className={clsx('text-2xl font-semibold', className)} {...props} />
}

export function DialogBody({ className, ...props }) {
  return <div className={clsx('mt-5', className)} {...props} />
}

export function DialogActions({ className, ...props }) {
  return <div className={clsx('mt-6 flex flex-wrap justify-end gap-2', className)} {...props} />
}
