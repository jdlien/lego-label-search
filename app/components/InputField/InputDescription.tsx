import React, { ReactNode } from 'react'
import clsx from 'clsx'

// --- TYPE DEFINITIONS ---
interface InputDescriptionProps {
  id: string
  description?: ReactNode
  className?: string
}

// --- COMPONENT ---
const InputDescription: React.FC<InputDescriptionProps> = ({ id, description, className }) => {
  if (!description) return null
  return (
    <p id={id} className={clsx('mt-1 text-sm text-zinc-500 dark:text-zinc-400', className)}>
      {description}
    </p>
  )
}

export default InputDescription
