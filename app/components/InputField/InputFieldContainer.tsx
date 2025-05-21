'use client'

import React, { ReactNode } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { useTheme } from '../../context/ThemeContext'
import InputLabel from './InputLabel'
import InputError from './InputError'
import type { ThemeColor, UISize } from '../../types/theme'

// Import just what we need from the existing inputFieldStyles
const containerStyles = tv({
  slots: {
    inputFieldOuterContainer: 'py-0.5 sm:grid sm:grid-cols-3 sm:items-start sm:gap-x-4 sm:gap-y-1.5',
    label: 'block text-sm sm:text-base font-medium', // For InputLabel component and its text color
    error: 'mt-0.5 text-red-600 dark:text-red-500', // Removed text-sm from base style
    errorContainer: '', // New slot for the error container div
  },
  variants: {
    size: {
      sm: {
        inputFieldOuterContainer: 'my-2',
        label: 'sm:text-sm sm:mt-0.25 sm:pt-2',
        error: 'text-sm',
        errorContainer: '',
      },
      md: {
        inputFieldOuterContainer: 'my-3',
        label: 'text-sm sm:text-base sm:mt-px sm:pt-3',
        error: 'text-sm',
        errorContainer: '',
      },
      lg: {
        inputFieldOuterContainer: 'my-4',
        label: 'text-base sm:text-lg sm:mt-0.25 sm:pt-3.75',
        error: 'text-base',
        errorContainer: '',
      },
    },
    fullWidth: {
      true: {
        label: 'sm:col-span-3',
        errorContainer: 'sm:col-span-3', // Make error span 3 columns when fullWidth is true
      },
      false: {
        errorContainer: 'sm:col-start-2 sm:col-span-2', // Start at column 2 and span 2 columns when not fullWidth
      },
    },
    // Add theme variants for label styling
    theme: {
      slate: {
        label: 'text-slate-700 dark:text-slate-100',
      },
      gray: {
        label: 'text-gray-700 dark:text-gray-100',
      },
      zinc: {
        label: 'text-zinc-700 dark:text-zinc-100',
      },
      neutral: {
        label: 'text-neutral-700 dark:text-neutral-100',
      },
      stone: {
        label: 'text-stone-700 dark:text-stone-100',
      },
    },
  },
  compoundVariants: [
    // Size-specific padding for labels to match input sizes
    {
      size: 'sm',
      class: { label: 'sm:pt-0.5' },
    },
    {
      size: 'md',
      class: { label: 'sm:pt-1.5' },
    },
    {
      size: 'lg',
      class: { label: 'sm:pt-2.5' },
    },
  ],
  defaultVariants: {
    size: 'md',
    fullWidth: false,
    theme: 'gray',
  },
})

export type InputFieldContainerProps = {
  children: ReactNode
  id?: string
  label?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  labelClassName?: string
  errorClassName?: string
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  noErrorEl?: boolean
  theme?: ThemeColor
}

const InputFieldContainer: React.FC<InputFieldContainerProps> = ({
  children,
  id,
  label,
  error,
  required,
  className,
  labelClassName,
  errorClassName,
  fullWidth = false,
  size,
  noErrorEl = false,
  theme,
}) => {
  const { defaultUISize, defaultTheme } = useTheme()
  const sizeToUse = size || defaultUISize
  const themeToUse = theme || defaultTheme
  const styles = containerStyles({
    size: sizeToUse,
    fullWidth,
    theme: themeToUse,
    class: className,
  })

  const showLabel = !!label

  return (
    <div className={styles.inputFieldOuterContainer()} data-testid="input-field-outer-container">
      {showLabel && (
        <InputLabel
          htmlFor={id}
          label={label}
          className={styles.label({ class: labelClassName, fullWidth: fullWidth })}
          required={required}
          data-testid="input-label"
        />
      )}
      {children}
      {!noErrorEl && error && (
        <div className={styles.errorContainer({ fullWidth })}>
          <InputError
            id={id ? `${id}-error` : undefined}
            error={error}
            className={styles.error({ class: errorClassName })}
          />
        </div>
      )}
    </div>
  )
}

export default InputFieldContainer
