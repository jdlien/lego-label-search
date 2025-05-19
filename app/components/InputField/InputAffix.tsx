import React, { ReactNode } from 'react'
import clsx from 'clsx'

// --- TYPE DEFINITIONS ---
interface InputAffixProps {
  htmlFor?: string // Optional: for associating with the input, e.g., for color picker
  children: ReactNode
  className?: string
  isPrefix?: boolean
}

const InputAffix: React.FC<InputAffixProps> = ({ htmlFor, children, className, isPrefix }) => {
  if (!children) return null
  return (
    <label // Using label for clickable area, similar to original
      htmlFor={htmlFor}
      className={clsx(
        'inline-flex min-w-[30px] items-center justify-center border px-1',
        isPrefix ? 'rounded-l-md border-r-0' : 'rounded-r-md border-l-0',
        className
      )}
    >
      {children}
    </label>
  )
}

export default InputAffix
