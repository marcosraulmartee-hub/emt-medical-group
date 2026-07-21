import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string | null
  helper?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, helper, id, className = '', required, rows = 3, ...props },
  ref,
) {
  const autoId = useId()
  const textareaId = id ?? autoId
  const describedBy = error ? `${textareaId}-error` : helper ? `${textareaId}-helper` : undefined

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-slate-600">
          {label}
          {required && <span className="ml-0.5 text-teal-500">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={
          'w-full rounded-2xl border bg-white px-3 py-2.5 text-sm text-midnight-950 placeholder:text-slate-400 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 ' +
          (error
            ? 'border-[#DC4B3E] focus:border-[#DC4B3E]'
            : 'border-slate-200 focus:border-teal-500') +
          ' ' +
          className
        }
        {...props}
      />
      {error ? (
        <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-[#DC4B3E]">
          {error}
        </p>
      ) : helper ? (
        <p id={`${textareaId}-helper`} className="mt-1.5 text-sm text-slate-400">
          {helper}
        </p>
      ) : null}
    </div>
  )
})
