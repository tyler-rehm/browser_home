import clsx from 'clsx'

export function Button({ outline = false, className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:opacity-50',
        outline
          ? 'border-[var(--line)] bg-transparent text-[var(--ink)]'
          : 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]',
        className,
      )}
      {...props}
    />
  )
}
