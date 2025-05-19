import React, { ReactNode } from 'react'
import clsx from 'clsx'

// --- TYPE DEFINITIONS ---
interface InputLabelProps {
  htmlFor: string
  label: ReactNode
  className?: string
  required?: boolean // To add asterisk or other indicators if needed
  fullWidth?: boolean // For layout consistency
}

// --- COMPONENT ---
const InputLabel: React.FC<InputLabelProps> = ({ htmlFor, label, className, required, fullWidth }) => {
  if (!label) return null
  return (
    <label
      htmlFor={htmlFor}
      id={`${htmlFor}-label`}
      className={clsx(
        'block text-sm font-medium text-zinc-700 dark:text-zinc-300',
        fullWidth && 'sm:col-span-3', // Example for grid layout
        'sm:mt-px sm:pt-1', // From original AppInput
        className
      )}
    >
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  )
}

export default InputLabel
