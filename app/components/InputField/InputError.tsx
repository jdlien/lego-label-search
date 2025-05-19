import React, { ReactNode } from 'react'
import clsx from 'clsx'

// --- TYPE DEFINITIONS ---
interface InputErrorProps {
  id: string
  error?: ReactNode
  className?: string
}

// --- COMPONENT ---
const InputError: React.FC<InputErrorProps> = ({ id, error, className }) => {
  if (!error) return <div className="min-h-[20px]"></div> // Maintain space like original
  return (
    <div className="min-h-[20px]">
      <p id={id} className={clsx('text-sm text-red-600 transition dark:text-red-500', className)}>
        {error}
      </p>
    </div>
  )
}

export default InputError
