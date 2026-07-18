import { forwardRef, useId, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string | null
  helper?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, id, className = '', required, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-600">
          {label}
          {required && <span className="ml-0.5 text-teal-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={
          'h-11 w-full rounded-2xl border bg-white px-3 text-sm text-midnight-950 placeholder:text-slate-400 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 ' +
          (error
            ? 'border-[#DC4B3E] focus:border-[#DC4B3E]'
            : 'border-slate-200 focus:border-teal-500') +
          ' ' +
          className
        }
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-[#DC4B3E]">
          {error}
        </p>
      ) : helper ? (
        <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-slate-400">
          {helper}
        </p>
      ) : null}
    </div>
  )
})
