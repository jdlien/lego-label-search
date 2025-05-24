import type { ReactNode, ChangeEvent, FocusEvent, HTMLInputTypeAttribute } from 'react'
import type { ThemeColor, AccentColor, UISize } from '../../types/theme'

// --- TYPE DEFINITIONS ---

export type OptionType =
  | string
  | {
      value: string
      label?: string
      description?: string
      selected?: boolean // Note: In React, selection for controlled components is usually handled by the value prop
    }

export type NormalizedOptionType = {
  value: string
  label: string
  description?: string
  selected?: boolean // Retained for data structure, but 'checked' or 'value' prop will manage state
  disabled?: boolean
}

export interface BaseInputProps {
  // Core HTML attributes
  type?:
    | HTMLInputTypeAttribute // This includes 'button' and 'submit' as standard HTML input types
    | 'select'
    | 'textarea'
    | 'decimal'
    | 'integer'
    | 'postal'
    | 'date'
    | 'datetime'
    | 'time'
    | 'markdown'
    | 'display'
    | 'color' // Extended types
  name?: string
  id?: string // Will be auto-generated if not provided
  className?: string // For custom styling of the input wrapper or input itself
  value?: string | number | readonly string[]
  defaultValue?: string | number | readonly string[]
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
  maxLength?: number
  pattern?: string
  autoFocus?: boolean
  // Custom attributes from original class
  error?: ReactNode
  description?: ReactNode
  prefix?: ReactNode
  suffix?: ReactNode
  clearButton?: boolean
  'data-pattern'?: string // For validator compatibility
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  'data-type'?: string // For specific data handling, e.g., 'date', 'integer'
  'data-placeholder'?: string // Original had this for select
  'data-fp-options'?: string // For flatpickr or other JSON options
  'data-markdown'?: boolean
  // Behavior & Layout
  options?: Array<OptionType>
  emptyOption?: boolean | string // For select: true for empty, string for placeholder text
  horizontal?: boolean // For radio/checkbox groups
  noErrorEl?: boolean // To hide the error message element
  fullWidth?: boolean // Hint for layout, might influence wrapper or label
  // Theming - simplified for now, can be expanded
  theme?: ThemeColor
  accent?: AccentColor // Allow any accent color in props, even if not all are implemented yet
  size?: UISize
  // Classes for sub-elements (optional overrides)
  inputClassName?: string // Specifically for the <input>, <select>, <textarea>
  errorClassName?: string
  descriptionClassName?: string
  prefixClassName?: string
  suffixClassName?: string
  // Allow any other data-* attributes
  [key: `data-${string}`]: string | number | boolean | undefined
}

// Making all standard HTML input props available, plus our custom ones.
export type InputFieldProps = BaseInputProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof BaseInputProps | 'size'> &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, keyof BaseInputProps | 'size'> &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof BaseInputProps>

// FormFieldProps extends InputFieldProps to add label-related properties
export interface FormFieldProps extends InputFieldProps {
  label?: ReactNode
  labelClassName?: string
}
