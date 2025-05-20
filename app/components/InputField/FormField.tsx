'use client'

import React, { useId } from 'react'
import InputField from './index'
import InputFieldContainer from './InputFieldContainer'
import type { InputFieldProps } from './types'

/**
 * FormField - A complete form field component that composes an InputField inside a container
 *
 * This component renders an InputField within an InputFieldContainer, providing
 * a fully styled form field with label, input, and error elements positioned correctly.
 */
const FormField: React.FC<InputFieldProps> = (props) => {
  const { id: propId, label, required, fullWidth, size, className, labelClassName } = props

  const idToUse = propId || useId()

  return (
    <InputFieldContainer
      id={idToUse}
      label={label}
      required={required}
      fullWidth={fullWidth}
      size={size}
      className={className}
      labelClassName={labelClassName}
    >
      {/* Pass all props to InputField, assuming it doesn't render the outer container itself */}
      <InputField {...props} id={idToUse} />
    </InputFieldContainer>
  )
}

export default FormField
