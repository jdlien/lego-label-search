'use client'

import React, { useId } from 'react'
import InputField from './index'
import InputFieldContainer from './InputFieldContainer'
import type { FormFieldProps } from './types'
import { useTheme } from '../../context/ThemeContext'

/**
 * FormField - A complete form field component that composes an InputField inside a container
 *
 * This component renders an InputField within an InputFieldContainer, providing
 * a fully styled form field with label, input, and error elements positioned correctly.
 */
const FormField: React.FC<FormFieldProps> = (props) => {
  const {
    id: propId,
    label,
    required,
    fullWidth,
    size,
    className,
    labelClassName,
    error,
    errorClassName,
    noErrorEl,
    theme,
    ...inputFieldProps
  } = props

  const { defaultUISize, defaultTheme } = useTheme()
  const sizeToUse = size || defaultUISize
  const themeToUse = theme || defaultTheme

  const idToUse = propId || useId()

  return (
    <InputFieldContainer
      id={idToUse}
      label={label}
      error={error}
      required={required}
      fullWidth={fullWidth}
      size={sizeToUse}
      theme={themeToUse}
      className={className}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      noErrorEl={noErrorEl}
    >
      {/* Pass the remaining props to InputField and include fullWidth */}
      <InputField {...inputFieldProps} id={idToUse} size={sizeToUse} error={error} fullWidth={fullWidth} />
    </InputFieldContainer>
  )
}

export default FormField
