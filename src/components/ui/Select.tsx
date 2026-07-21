import { forwardRef, useId, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string | null
  helper?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helper, id, className = '', required, children, ...props },
  ref,
) {
  const autoId = useId()
  const selectId = id ?? autoId
  const describedBy = error ? `${selectId}-error` : helper ? `${selectId}-helper` : undefined

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-600">
          {label}
          {required && <span className="ml-0.5 text-teal-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={
          'h-11 w-full rounded-2xl border bg-white px-3 text-sm text-midnight-950 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 ' +
          (error
            ? 'border-[#DC4B3E] focus:border-[#DC4B3E]'
            : 'border-slate-200 focus:border-teal-500') +
          ' ' +
          className
        }
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="mt-1.5 text-sm text-[#DC4B3E]">
          {error}
        </p>
      ) : helper ? (
        <p id={`${selectId}-helper`} className="mt-1.5 text-sm text-slate-400">
          {helper}
        </p>
      ) : null}
    </div>
  )
})
