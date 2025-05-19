import React, { ReactNode } from 'react'

interface InputLabelProps {
  htmlFor: string
  label: ReactNode
  className?: string
  required?: boolean // To add asterisk or other indicators if needed
}

const InputLabel: React.FC<InputLabelProps> = ({ htmlFor, label, className, required }) => {
  if (!label) return null
  return (
    <label htmlFor={htmlFor} id={`${htmlFor}-label`} className={className}>
      {label}
      {/* TODO: Maybe this should be optional, not automatically added. */}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  )
}

export default InputLabel
