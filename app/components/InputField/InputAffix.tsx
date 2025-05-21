import React, { ReactNode } from 'react'
import { tv } from 'tailwind-variants'

// --- TYPE DEFINITIONS ---
interface InputAffixProps {
  htmlFor?: string // Optional: for associating with the input, e.g., for color picker
  children: ReactNode
  className?: string
  isPrefix?: boolean
}

const inputAffixVariants = tv({
  base: 'inline-flex items-center justify-center border px-1',
  variants: {
    isPrefix: {
      true: 'rounded-l-md border-r-0',
      false: 'rounded-r-md border-l-0',
    },
    defaultVariants: {
      isPrefix: true,
    },
  },
})

const InputAffix: React.FC<InputAffixProps> = ({ htmlFor, children, className, isPrefix }) => {
  if (!children) return null
  return (
    <label // Using label for clickable area, similar to original
      htmlFor={htmlFor}
      className={inputAffixVariants({ isPrefix, className })}
      data-testid={`input-affix-${isPrefix ? 'prefix' : 'suffix'}`}
    >
      {children}
    </label>
  )
}

export default InputAffix
