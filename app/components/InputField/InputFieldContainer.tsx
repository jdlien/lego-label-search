'use client'

import React, { ReactNode } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { useTheme } from '../../context/ThemeContext'
import InputLabel from './InputLabel'

// Import just what we need from the existing inputFieldStyles
const containerStyles = tv({
  slots: {
    inputFieldOuterContainer: 'py-0.5 sm:grid sm:grid-cols-3 sm:items-start sm:gap-x-4 sm:gap-y-1.5',
    label: 'block text-sm sm:text-base font-medium', // For InputLabel component and its text color
  },
  variants: {
    size: {
      sm: {
        inputFieldOuterContainer: 'my-2',
        label: 'sm:text-sm sm:mt-0.25 sm:pt-2',
      },
      md: {
        inputFieldOuterContainer: 'my-3',
        label: 'text-sm sm:text-base sm:mt-px sm:pt-3',
      },
      lg: {
        inputFieldOuterContainer: 'my-4',
        label: 'text-base sm:text-lg sm:mt-0.25 sm:pt-3.75',
      },
    },
    fullWidth: {
      true: {
        label: 'sm:col-span-3',
      },
      false: {},
    },
  },
  defaultVariants: {
    size: 'md',
    fullWidth: false,
  },
})

export type InputFieldContainerProps = {
  children: ReactNode
  id?: string
  label?: ReactNode
  required?: boolean
  className?: string
  labelClassName?: string
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const InputFieldContainer: React.FC<InputFieldContainerProps> = ({
  children,
  id,
  label,
  required,
  className,
  labelClassName,
  fullWidth = false,
  size,
}) => {
  const { defaultUISize } = useTheme()
  const sizeToUse = size || defaultUISize
  const styles = containerStyles({ size: sizeToUse, fullWidth, class: className })

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
    </div>
  )
}

export default InputFieldContainer
