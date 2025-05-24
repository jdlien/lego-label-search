'use client'

import React, { useId, ChangeEvent, FocusEvent, HTMLInputTypeAttribute, ReactNode, useState, useEffect } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
// Import the useTheme hook and types
import { useTheme } from '../../context/ThemeContext'
// Custom SVG icons
import {
  IconEnvelope,
  IconMapMarker,
  IconLink,
  IconPhone,
  IconCalendar,
  IconCalendarDay,
  IconClock,
  IconLock,
  IconPalette,
  IconXMark,
} from './InputIcons' // Adjusted path

// Import sub-components
import InputDescription from './InputDescription' // Adjusted path
import InputAffix from './InputAffix' // Adjusted path
import ComboboxField from './ComboboxField' // New extracted component

// Import types
import type { OptionType, NormalizedOptionType, InputFieldProps } from './types'
// Import TV styles
// import { inputFieldStyles, type InputFieldStyleProps } from './inputField.styles'

const inputFieldStyles = tv({
  slots: {
    // Applied to the outermost div, formerly form-item (this is now the InputFieldContainer)
    inputFieldOuterContainer: 'py-0.5 sm:grid sm:grid-cols-3 sm:items-start sm:gap-x-4 sm:gap-y-1.5',
    inputContainer: 'sm:mt-0', // Wrapper for the input group or standalone checkbox/radio
    inputGroup: 'relative flex shadow-sm', // Wraps prefix, input, suffix. Base rounding via compound variants.
    clearButton:
      'absolute p-1.5 top-1/2 -translate-y-1/2 justify-center group outline-none focus-visible:inset-ring-sky-500/40 focus-visible:inset-ring-2 rounded-full',
    clearButtonIcon: 'size-4', // Base size, theme variants will handle colors
    inputElement: `
      block w-full border transition duration-150 ease-in-out bg-white/90 hover:enabled:bg-white focus-visible:enabled:bg-white
      focus:outline-none focus:ring-0 focus-visible:ring-2 inset-shadow-sm dark:hover:enabled:bg-black/40 dark:enabled:focus-visible:bg-black/50
      `,

    // Specific slots for checkbox/radio elements
    checkboxRadioGroup: 'space-y-2', // Container for multiple checkboxes/radios
    checkboxRadioItem: '',
    checkboxRadioInputWrapper: 'flex items-center',
    checkboxRadioInput: '', // Size and shape of checkbox and radio inputs
    checkboxRadioDescriptionWrapper: '', // Affects checkbox/radio descriptions
    checkboxRadioLabel: 'font-medium', // Theme-specific: text color
    // New slot for the checkedbox and radio border container. Note: dark:has-checked seems not to work here.
    checkboxRadioContainer: `
      inline-flex items-center border shadow-inner
      enabled:hover:bg-white transition-colors duration-150 ease-in-out
      has-checked:text-black dark:has-checked:text-shadow-sm
      dark:hover:bg-black/50 disabled:pointer-events-none
    `,
    checkedLabelText: 'ml-1.5 mr-1', // For the label text to have proper spacing
    affix: 'inline-flex items-center', // For InputAffix (prefix/suffix)
    description: '', // For InputDescription component and its text color
    error: 'mt-2 text-sm', // For InputError component, primarily for error text color
    display: 'block w-full sm:mt-px sm:pt-1', // For type='display'

    // Slots for custom select arrow
    selectArrowContainer: 'absolute inset-y-0 right-0 flex items-center pointer-events-none opacity-60',
    selectArrowIcon: 'mr-0.75 text-gray-500 dark:text-gray-400', // Default size, margin, and color
  },
  variants: {
    size: {
      sm: {
        inputFieldOuterContainer: 'my-2',
        inputElement: 'px-2 py-1 text-sm leading-4',
        clearButton: 'right-0.5',
        checkboxRadioInputWrapper: '',
        checkboxRadioContainer: 'text-sm px-0.5',
        checkboxRadioInput: 'size-4',
        checkboxRadioDescriptionWrapper: 'text-sm',
        checkedLabelText: 'ml-1 mr-0.5',
        affix: 'px-2 min-w-[29px]',
        clearButtonIcon: 'size-3',
        selectArrowIcon: 'size-5',
        error: 'text-sm',
      },
      md: {
        inputFieldOuterContainer: 'my-3',
        inputElement: 'px-4 py-2 text-sm sm:text-base sm:leading-5',
        clearButton: 'right-1',
        checkboxRadioInputWrapper: '',
        checkboxRadioContainer: 'px-0.5',
        checkboxRadioInput: 'size-5',
        checkboxRadioDescriptionWrapper: 'text-sm',
        checkedLabelText: 'ml-1.5 mr-1',
        affix: 'px-3 min-w-[42px]',
        clearButtonIcon: 'size-4',
        selectArrowIcon: 'size-6',
        error: 'text-sm',
      },
      lg: {
        inputFieldOuterContainer: 'my-4',
        inputElement: 'px-5 py-3 text-base sm:text-lg leading-6',
        clearButton: 'right-1.5',
        checkboxRadioInputWrapper: '',
        checkboxRadioContainer: 'px-0.5 py-0.5',
        checkboxRadioInput: 'size-6',
        checkboxRadioDescriptionWrapper: 'text-base',
        checkedLabelText: 'ml-2 mr-1.5',
        affix: 'px-3.5 text-lg min-w-[52px]',
        clearButtonIcon: 'size-5',
        selectArrowIcon: 'size-7',
        error: 'text-base',
      },
    },
    accent: {
      blue: {
        inputElement: 'focus-visible:ring-blue-500/40',
        checkboxRadioInput: 'accent-blue-600',
        checkboxRadioContainer: 'has-checked:border-blue-600',
      },
      sky: {
        inputElement: 'focus-visible:ring-sky-500/40',
        checkboxRadioInput: 'accent-sky-600',
        checkboxRadioContainer: 'has-checked:border-sky-600',
      },
      red: {
        inputElement: 'focus-visible:ring-red-500/40',
        checkboxRadioInput: 'accent-red-600',
        checkboxRadioContainer: 'has-checked:border-red-600',
      },
      green: {
        inputElement: 'focus-visible:ring-green-500/40',
        checkboxRadioInput: 'accent-green-600',
        checkboxRadioContainer: 'has-checked:border-green-600',
      },
      indigo: {
        inputElement: 'focus-visible:ring-indigo-500/40',
        checkboxRadioInput: 'accent-indigo-600',
        checkboxRadioContainer: 'has-checked:border-indigo-600',
      },
      violet: {
        inputElement: 'focus-visible:ring-violet-500/40',
        checkboxRadioInput: 'accent-violet-600',
        checkboxRadioContainer: 'has-checked:border-violet-600',
      },
      purple: {
        inputElement: 'focus-visible:ring-purple-500/40',
        checkboxRadioInput: 'accent-purple-600',
        checkboxRadioContainer: 'has-checked:border-purple-600',
      },
      fuchsia: {
        inputElement: 'focus-visible:ring-fuchsia-500/40',
        checkboxRadioInput: 'accent-fuchsia-600',
        checkboxRadioContainer: 'has-checked:border-fuchsia-600',
      },
      pink: {
        inputElement: 'focus-visible:ring-pink-500/40',
        checkboxRadioInput: 'accent-pink-600',
        checkboxRadioContainer: 'has-checked:border-pink-600',
      },
      rose: {
        inputElement: 'focus-visible:ring-rose-500/40',
        checkboxRadioInput: 'accent-rose-600',
        checkboxRadioContainer: 'has-checked:border-rose-600',
      },
      amber: {
        inputElement: 'focus-visible:ring-amber-500/40',
        checkboxRadioInput: 'accent-amber-600',
        checkboxRadioContainer: 'has-checked:border-amber-600',
      },
      yellow: {
        inputElement: 'focus-visible:ring-yellow-500/40',
        checkboxRadioInput: 'accent-yellow-600',
        checkboxRadioContainer: 'has-checked:border-yellow-600',
      },
      lime: {
        inputElement: 'focus-visible:ring-lime-500/40',
        checkboxRadioInput: 'accent-lime-600',
        checkboxRadioContainer: 'has-checked:border-lime-600',
      },
      emerald: {
        inputElement: 'focus-visible:ring-emerald-500/40',
        checkboxRadioInput: 'accent-emerald-600',
        checkboxRadioContainer: 'has-checked:border-emerald-600',
      },
      teal: {
        inputElement: 'focus-visible:ring-teal-500/40',
        checkboxRadioInput: 'accent-teal-600',
        checkboxRadioContainer: 'has-checked:border-teal-600',
      },
      cyan: {
        inputElement: 'focus-visible:ring-cyan-500/40',
        checkboxRadioInput: 'accent-cyan-600',
        checkboxRadioContainer: 'has-checked:border-cyan-600',
      },
    },
    // Offer all Tailwind shades of gray as options, from coolest to warmest
    theme: {
      slate: {
        inputElement: `border-slate-400/80 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-200
          placeholder-slate-400 dark:placeholder-slate-500
        `,
        description: 'text-slate-500 dark:text-slate-400',
        affix: 'border-slate-400/80 bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        checkboxRadioInput: 'border-slate-400/80',
        checkboxRadioLabel: 'text-slate-700 dark:text-slate-200',
        checkboxRadioContainer: `
          border-slate-400/30 bg-slate-50 text-slate-700 dark:bg-slate-950/50 dark:text-slate-100
        `,
        clearButtonIcon:
          'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300',
      },
      gray: {
        inputElement: `border-gray-400/80 bg-gray-50 dark:bg-gray-950/50 text-gray-700 dark:text-gray-200
          placeholder-gray-400 dark:placeholder-gray-500
        `,
        description: 'text-gray-500 dark:text-gray-400',
        affix: 'border-gray-400/80 bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        checkboxRadioInput: 'border-gray-400/80',
        checkboxRadioLabel: 'text-gray-700 dark:text-gray-200',
        checkboxRadioContainer: `
          border-gray-400/30 bg-gray-50 text-gray-700 dark:bg-gray-950/50 dark:text-gray-100
        `,
        clearButtonIcon: 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300',
      },
      zinc: {
        inputElement: `border-zinc-400/80 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-700 dark:text-zinc-200
          placeholder-zinc-400 dark:placeholder-zinc-500
          `,
        description: 'text-zinc-500 dark:text-zinc-400',
        affix: 'border-zinc-400/80 bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
        checkboxRadioInput: 'border-zinc-400/80',
        checkboxRadioLabel: 'text-zinc-700 dark:text-zinc-200',
        checkboxRadioContainer: `
          border-zinc-400/30 bg-zinc-50 text-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100
        `,
        clearButtonIcon: 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300',
      },
      neutral: {
        inputElement: `border-neutral-400/80 bg-neutral-50 dark:bg-neutral-950/50 text-neutral-700 dark:text-neutral-200
          placeholder-neutral-400 dark:placeholder-neutral-500
        `,
        description: 'text-neutral-500 dark:text-neutral-400',
        affix: 'border-neutral-400/80 bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
        checkboxRadioInput: 'border-neutral-400/80',
        checkboxRadioLabel: 'text-neutral-700 dark:text-neutral-200',
        checkboxRadioContainer: `
          border-neutral-400/30 bg-neutral-50 text-neutral-700 dark:bg-neutral-950/50 dark:text-neutral-100
        `,
        clearButtonIcon:
          'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300',
      },
      stone: {
        inputElement: `border-stone-400/80 bg-stone-50 dark:bg-stone-950/50 text-stone-700 dark:text-stone-200
        placeholder-stone-400 dark:placeholder-stone-500
        `,
        description: 'text-stone-500 dark:text-stone-400',
        affix: 'border-stone-400/80 bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
        checkboxRadioInput: 'border-stone-400/80',
        checkboxRadioLabel: 'text-stone-700 dark:text-stone-200',
        checkboxRadioContainer: `
          border-stone-400/30 bg-stone-50 text-stone-700 dark:bg-stone-950/50 dark:text-stone-100
        `,
        clearButtonIcon:
          'text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300',
      },
    },
    inputType: {
      // Corresponds to 'rawType' prop
      text: {},
      select: {
        inputElement: `pr-8 appearance-none`, // We use a separate element for the select arrow icon
      },
      combobox: {}, // Radix-based combobox with find-as-you-type functionality
      textarea: {},
      // For checkbox/radio, their specific slots (checkboxRadioInput, etc.) are primary. inputElement slot is often not used or cleared.
      checkbox: {},
      radio: {}, // Removed checkboxRadioDescriptionWrapper: 'ml-1.5' to move to compound variants
      display: { inputGroup: 'shadow-none' }, // 'display' uses displaySpan, not typical inputElement
      // Other types like 'email', 'date', etc., will use base 'inputElement' styles unless specified
      // 'markdown' should be handled by component logic to map to 'textarea' type for styling
      // 'color' might need special handling for its custom picker UI part
    },
    disabled: {
      true: {
        // General disabled opacity, cursor. BG color is theme-dependent via compoundVariants.
        inputElement: 'opacity-50 cursor-not-allowed',
        checkboxRadioInput: 'opacity-50 cursor-not-allowed',
        affix: 'opacity-50 cursor-not-allowed',
      },
    },
    error: {
      true: {
        inputElement:
          'border-red-500 dark:border-red-400 focus-visible:border-red-500 dark:focus-visible:border-red-400 focus-visible:ring-red-500/40',
        error: 'text-red-600 dark:text-red-500', // Ensures error text color
      },
    },
    // Boolean variants for structural changes, used in compoundVariants primarily
    hasPrefix: { true: {} },
    hasSuffix: { true: {} },
    // For checkbox/radio group layout
    horizontalLayout: {
      true: { checkboxRadioGroup: 'flex flex-wrap items-start space-x-4 space-y-0' },
    },
    fullWidth: {
      true: {
        inputContainer: 'sm:col-span-3',
      },
      false: {
        inputContainer: 'sm:col-span-2',
      },
    },
    clearButton: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    // Disabled states with theme-specific background for inputElement (overrides hover)
    {
      theme: 'slate',
      disabled: true,
      class: {
        inputElement: 'bg-slate-100 dark:bg-slate-700 hover:enabled:bg-slate-100 dark:hover:enabled:bg-slate-700',
      },
    },
    {
      theme: 'gray',
      disabled: true,
      class: { inputElement: 'bg-gray-100 dark:bg-gray-700 hover:enabled:bg-gray-100 dark:hover:enabled:bg-gray-700' },
    },
    {
      theme: 'zinc',
      disabled: true,
      class: { inputElement: 'bg-zinc-100 dark:bg-zinc-700 hover:enabled:bg-zinc-100 dark:hover:enabled:bg-zinc-700' },
    },
    {
      theme: 'neutral',
      disabled: true,
      class: {
        inputElement:
          'bg-neutral-100 dark:bg-neutral-700 hover:enabled:bg-neutral-100 dark:hover:enabled:bg-neutral-700',
      },
    },
    {
      theme: 'stone',
      disabled: true,
      class: {
        inputElement: 'bg-stone-100 dark:bg-stone-700 hover:enabled:bg-stone-100 dark:hover:enabled:bg-stone-700',
      },
    },
    // Input group and input element rounding based on prefix/suffix presence
    // The inputGroup itself gets rounded-md. The inputElement's rounding is adjusted.
    { hasPrefix: false, hasSuffix: false, class: { inputGroup: 'rounded-md', inputElement: 'rounded-md' } },
    {
      hasPrefix: true,
      hasSuffix: false,
      class: { inputGroup: 'rounded-md', inputElement: 'rounded-l-none rounded-r-md' },
    },
    {
      hasPrefix: false,
      hasSuffix: true,
      class: { inputGroup: 'rounded-md', inputElement: 'rounded-r-none rounded-l-md' },
    },
    { hasPrefix: true, hasSuffix: true, class: { inputGroup: 'rounded-md', inputElement: 'rounded-none' } },

    // Ensure that for types like checkbox/radio, if they are somehow rendered using inputGroup, it doesn't get default input styles
    { inputType: 'checkbox', class: { inputGroup: 'shadow-none border-none bg-transparent' } }, // Example: clear inputGroup styles for checkbox type if it uses it.
    { inputType: 'radio', class: { inputGroup: 'shadow-none border-none bg-transparent' } },

    // Adjust the checkbox/radio container rounding based on input type
    {
      inputType: 'radio',
      class: { checkboxRadioContainer: 'rounded-full' },
    },
    {
      inputType: 'checkbox',
      class: { checkboxRadioContainer: 'rounded-xs', checkboxRadioInput: 'rounded' },
    },
    {
      clearButton: true,
      class: {
        inputElement: 'pr-8',
      },
    },
    // Size-specific padding for checkbox/radio input containers
    {
      inputType: 'checkbox',
      size: 'sm',
      class: { label: 'sm:pt-0', inputContainer: 'pt-0' },
    },
    {
      inputType: 'checkbox',
      size: 'md',
      class: { label: 'sm:pt-1.5', inputContainer: 'pt-1.5' },
    },
    {
      inputType: 'checkbox',
      size: 'lg',
      class: { label: 'sm:pt-1.75', inputContainer: 'pt-2' },
    },
    {
      inputType: 'radio',
      size: 'sm',
      class: { label: 'sm:pt-0', inputContainer: 'pt-1', checkboxRadioDescriptionWrapper: 'ml-1' },
    },
    {
      inputType: 'radio',
      size: 'md',
      class: { label: 'sm:pt-1.5', inputContainer: 'pt-1.5', checkboxRadioDescriptionWrapper: 'ml-1.5' },
    },
    {
      inputType: 'radio',
      size: 'lg',
      class: { label: 'sm:pt-1.75', inputContainer: 'pt-2', checkboxRadioDescriptionWrapper: 'ml-2' },
    },
  ],
  defaultVariants: {
    accent: 'sky',
    theme: 'gray', // Matches your component's prop default
    size: 'md', // Default size is medium
    disabled: false,
    error: false,
    hasPrefix: false,
    hasSuffix: false,
    horizontalLayout: false,
    inputType: 'text',
    fullWidth: false, // Default to not fullWidth
    clearButton: false,
  },
})

export type InputFieldStyleProps = VariantProps<typeof inputFieldStyles>

// Define the valid types for the tailwind-variants inputType variant
type TVStyleInputType = keyof typeof inputFieldStyles.variants.inputType

const normalizeOptions = (options?: OptionType[]): NormalizedOptionType[] => {
  if (!options) return []
  return options
    .map((opt) => {
      if (typeof opt === 'string') return { value: opt, label: opt }
      if (opt === undefined) {
        console.warn('Option must be defined. Filtering out undefined values.', opt)
        return null // Will be filtered out
      }

      // Handle both 'value' and 'id' fields, prioritizing 'value' if both exist
      const optObj = opt as Record<string, any>
      const rawValue = 'value' in optObj ? optObj.value : 'id' in optObj ? optObj.id : undefined

      if (rawValue === undefined) {
        console.warn('Option must have a value or id property. Filtering out undefined/NULL values.', opt)
        return null // Will be filtered out
      }

      const value =
        typeof rawValue === 'string' && rawValue.length > 1 && rawValue.endsWith(',')
          ? rawValue.replace(/,$/, '')
          : rawValue

      // Handle both 'label' and 'name' fields, prioritizing 'label' if both exist
      const rawLabel =
        'label' in optObj && optObj.label !== undefined
          ? optObj.label
          : 'name' in optObj && optObj.name !== undefined
          ? optObj.name
          : value

      const normalized: NormalizedOptionType = { value, label: rawLabel }

      if (optObj.description !== undefined) normalized.description = optObj.description
      if (optObj.selected !== undefined) normalized.selected = optObj.selected // Keep for initial state if needed
      if (optObj.disabled !== undefined && optObj.disabled !== false) normalized.disabled = optObj.disabled

      return normalized
    })
    .filter((opt) => opt !== null) as NormalizedOptionType[]
}

const InputField: React.FC<InputFieldProps> = (props) => {
  // Get default theme and accent from context
  const { defaultTheme, defaultAccent, defaultUISize } = useTheme()

  const {
    // Destructure all props, separating InputField-specific ones from those to be passed down
    type: rawType = 'text',
    name: propName,
    id: propId,
    className,
    value: propValue,
    defaultValue: propDefaultValue,
    checked: propChecked, // For single checkbox
    defaultChecked: propDefaultChecked, // For single checkbox
    onChange: propOnChange,
    onBlur: propOnBlur,
    placeholder: rawPlaceholder,
    error,
    description,
    prefix: rawPrefix,
    suffix: rawSuffix,
    clearButton,
    options: rawOptions,
    emptyOption = true,
    horizontal,
    fullWidth,
    theme = defaultTheme, // Use context default
    accent = defaultAccent, // Use context default
    size = defaultUISize, // Use context default
    inputClassName: baseInputClassName, // Renamed for clarity
    errorClassName,
    descriptionClassName,
    prefixClassName,
    suffixClassName,
    // Standard HTML attributes that are also explicitly part of InputFieldProps
    // These will be included in nativeInputProps if not overridden by derived values
    disabled,
    required,
    readOnly,
    maxLength,
    pattern: htmlPattern,
    autoFocus,
    inputMode: rawInputMode, // Will be processed
    'data-type': rawDataType, // Will be processed
    'data-fp-options': dataFpOptions,
    'data-markdown': dataMarkdown,
    ...restHtmlAttributes // Spread rest for additional HTML attributes for the input tag
  } = props

  const idToUse = propId || useId()

  // Add this - Track input value for clear button visibility
  const [inputHasValue, setInputHasValue] = useState(!!propValue || !!propDefaultValue)

  // Update internal tracking when controlled value changes
  useEffect(() => {
    if (propValue !== undefined) {
      setInputHasValue(!!propValue)
    }
  }, [propValue])

  // Update the handler to track value changes for both controlled and uncontrolled inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setInputHasValue(!!e.target.value)
    if (propOnChange) {
      propOnChange(e)
    }
  }

  // Add a specific handler for the clear button
  const handleClearButtonClick = () => {
    // Always update our tracking state
    setInputHasValue(false)

    // For controlled inputs
    if (propOnChange) {
      // Create a synthetic event with the empty value
      const syntheticEvent = {
        target: { value: '', name: propName, id: idToUse },
        currentTarget: { value: '', name: propName, id: idToUse },
      } as React.ChangeEvent<HTMLInputElement>
      propOnChange(syntheticEvent)
    }

    // For uncontrolled inputs
    const input = document.getElementById(idToUse) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    if (input) {
      input.value = ''
      // Trigger a native change event for any listeners
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  // Determine the inputType for styling variants (tv expects one of its defined inputType values)
  let styleInputType: TVStyleInputType = 'text' // Default to 'text'

  // Process type and derive related attributes
  let inputType = rawType
  let currentDataType = rawDataType
  let currentInputMode = rawInputMode
  let currentPrefix = rawPrefix
  let currentSuffix = rawSuffix // Added for completeness
  let currentPlaceholder = rawPlaceholder
  let isMarkdown = dataMarkdown

  // Default input classes are now handled by tv()

  switch (rawType) {
    case 'select':
      styleInputType = 'select'
      currentPlaceholder = rawPlaceholder || (typeof emptyOption === 'string' ? emptyOption : undefined)
      break
    case 'combobox':
      styleInputType = 'combobox'
      currentPlaceholder = rawPlaceholder || (typeof emptyOption === 'string' ? emptyOption : 'Search options...')
      break
    case 'textarea':
      styleInputType = 'textarea'
      break
    case 'checkbox':
      styleInputType = 'checkbox'
      break
    case 'radio':
      styleInputType = 'radio'
      break
    case 'decimal':
      inputType = 'text'
      currentInputMode = currentInputMode ?? 'decimal'
      currentDataType = currentDataType ?? 'decimal'
      break
    case 'integer':
      inputType = 'text'
      currentInputMode = currentInputMode ?? 'numeric'
      currentDataType = currentDataType ?? 'integer'
      break
    case 'email':
      currentInputMode = currentInputMode ?? 'email'
      currentPrefix = currentPrefix ?? <IconEnvelope />
      currentPlaceholder = currentPlaceholder ?? '____@____.___'
      currentDataType = currentDataType ?? 'email'
      break
    case 'postal':
      inputType = 'text'
      currentDataType = currentDataType ?? 'postal'
      currentPrefix = currentPrefix ?? <IconMapMarker />
      currentPlaceholder = currentPlaceholder ?? '___ ___'
      break
    case 'url':
      currentInputMode = currentInputMode ?? 'url'
      currentPrefix = currentPrefix ?? <IconLink />
      currentPlaceholder = currentPlaceholder ?? 'https://____.___'
      break
    case 'tel':
    case 'phone':
      inputType = 'tel'
      currentInputMode = currentInputMode ?? 'tel'
      currentPrefix = currentPrefix ?? <IconPhone />
      currentPlaceholder = currentPlaceholder ?? '___-___-____'
      currentDataType = currentDataType ?? 'tel'
      break
    case 'date':
      inputType = 'text'
      currentPrefix = currentPrefix ?? <IconCalendar />
      currentPlaceholder = currentPlaceholder ?? 'YYYY-MM-DD'
      currentDataType = currentDataType ?? 'date'
      break
    case 'datetime':
      inputType = 'text'
      currentPrefix = currentPrefix ?? <IconCalendarDay />
      currentPlaceholder = currentPlaceholder ?? 'YYYY-MM-DD HH:MM'
      currentDataType = currentDataType ?? 'datetime'
      break
    case 'time':
      inputType = 'text'
      currentPrefix = currentPrefix ?? <IconClock />
      currentPlaceholder = currentPlaceholder ?? 'HH:MM'
      currentDataType = currentDataType ?? 'time'
      break
    case 'password':
      currentPrefix = currentPrefix ?? <IconLock />
      break
    case 'color':
      inputType = 'text'
      currentPrefix = currentPrefix ?? <IconPalette />
      currentDataType = currentDataType ?? 'color'
      break
    case 'markdown':
      isMarkdown = true
      inputType = 'textarea'
      styleInputType = 'textarea'
      break
    case 'display':
      styleInputType = 'display'
      break
  }

  const normalizedOptions = normalizeOptions(rawOptions)

  const styles = inputFieldStyles({
    theme,
    accent,
    disabled,
    error: !!error,
    hasPrefix: !!currentPrefix,
    hasSuffix: !!currentSuffix,
    inputType: styleInputType,
    horizontalLayout: horizontal && (rawType === 'checkbox' || rawType === 'radio') && normalizedOptions.length > 0,
    fullWidth: fullWidth,
    class: className,
    clearButton: clearButton,
    size,
  })

  const ariaDescribedBy: string[] = []
  if (description) ariaDescribedBy.push(`${idToUse}-description`)

  const nativeInputProps: Record<string, any> = {
    id: idToUse,
    name: propName,
    onChange: handleInputChange, // Use our wrapped handler instead of direct propOnChange
    onBlur: propOnBlur,
    placeholder: currentPlaceholder,
    disabled,
    required,
    readOnly: rawType === 'display' ? true : readOnly,
    maxLength,
    pattern: htmlPattern,
    autoFocus,
    inputMode: currentInputMode,
    'data-type': currentDataType,
    'data-fp-options': dataFpOptions,
    'data-markdown': isMarkdown,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': ariaDescribedBy.length > 0 ? ariaDescribedBy.join(' ') : undefined,
    ...restHtmlAttributes, // Spread any remaining valid HTML attributes
  }

  const renderInput = () => {
    if (rawType === 'select') {
      return (
        <div className="relative w-full">
          <select
            {...nativeInputProps}
            value={propValue}
            defaultValue={propDefaultValue}
            className={styles.inputElement({ class: baseInputClassName })}
          >
            {(() => {
              if (emptyOption === false) return null // No empty option if explicitly false

              let text = ''
              if (typeof emptyOption === 'string') {
                text = emptyOption // Explicit string for emptyOption takes precedence
              } else {
                // emptyOption is true (or not a string and not false)
                text = rawPlaceholder || '' // Use props.placeholder (rawPlaceholder), or default to empty string
              }
              return <option value="">{text}</option>
            })()}
            {normalizedOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt?.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Select arrow icon - could change the text color of this div to adjust the color of the icon */}
          <div className={styles.selectArrowContainer()}>
            <svg className={styles.selectArrowIcon()} viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" />
            </svg>
          </div>
        </div>
      )
    }

    if (rawType === 'combobox') {
      return (
        <ComboboxField
          id={idToUse}
          name={propName}
          value={typeof propValue === 'string' ? propValue : ''}
          onChange={handleInputChange}
          onBlur={propOnBlur}
          placeholder={currentPlaceholder}
          disabled={disabled}
          readOnly={readOnly}
          options={normalizedOptions}
          emptyOption={emptyOption}
          clearButton={clearButton}
          className={baseInputClassName}
          size={size}
          accent={accent}
          theme={theme}
          parentStyles={{
            inputElement: styles.inputElement,
          }}
        />
      )
    }

    if (rawType === 'textarea' || isMarkdown) {
      return (
        <textarea
          {...nativeInputProps}
          value={propValue}
          defaultValue={propDefaultValue}
          rows={(nativeInputProps as any).rows || 3}
          className={styles.inputElement({ class: baseInputClassName })}
        />
      )
    }

    if (rawType === 'checkbox' || rawType === 'radio') {
      if (normalizedOptions.length > 0) {
        return (
          <div className={styles.checkboxRadioGroup()}>
            {normalizedOptions.map((opt, index) => {
              const optionId = `${idToUse}-${index}-${String(opt.value).replace(/[^\da-z]/gi, '')}`

              let isOptionChecked: boolean | undefined = undefined
              if (propValue !== undefined) {
                isOptionChecked =
                  rawType === 'radio'
                    ? propValue === opt.value
                    : Array.isArray(propValue)
                    ? propValue.includes(opt.value)
                    : propValue === opt.value // For single value checkbox group
              }

              let isOptionDefaultChecked: boolean | undefined = undefined
              if (propValue === undefined && propDefaultValue !== undefined) {
                isOptionDefaultChecked =
                  rawType === 'radio'
                    ? propDefaultValue === opt.value
                    : Array.isArray(propDefaultValue)
                    ? propDefaultValue.includes(opt.value)
                    : propDefaultValue === opt.value
              }

              return (
                <div key={optionId} className={styles.checkboxRadioItem()}>
                  <div className={styles.checkboxRadioInputWrapper()} data-testid="checkbox-radio-input-wrapper">
                    {/* Wrap both input and label. Note: complex dark variants don't seem to work in the main tv styles, so they are added here */}
                    <label
                      htmlFor={optionId}
                      className={styles.checkboxRadioContainer({
                        class: 'dark:has-checked:text-white',
                      })}
                      data-testid="checkbox-radio-container"
                    >
                      <input
                        id={optionId}
                        name={propName}
                        type={inputType as HTMLInputTypeAttribute}
                        value={opt.value}
                        onChange={propOnChange}
                        onBlur={propOnBlur}
                        disabled={disabled}
                        required={required && rawType === 'radio'}
                        checked={isOptionChecked}
                        defaultChecked={isOptionDefaultChecked}
                        className={styles.checkboxRadioInput({ class: baseInputClassName })}
                      />
                      <span className={styles.checkedLabelText()}>{opt.label}</span>
                    </label>
                  </div>
                  {opt.description && (
                    <div
                      className={styles.checkboxRadioDescriptionWrapper()}
                      data-testid="checkbox-radio-description-wrapper"
                    >
                      <p className={styles.description()}>{opt.description}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      } else {
        // Single checkbox
        return (
          <div className="flex items-start">
            <div className={styles.checkboxRadioInputWrapper()} data-testid="checkbox-radio-input-wrapper">
              {/* Single checkbox/radio. Note: dark:has-checked:text-white does not work in the main tv styles. */}
              <label
                htmlFor={idToUse}
                className={styles.checkboxRadioContainer({ class: 'dark:has-checked:text-white' })}
              >
                <input
                  {...nativeInputProps}
                  type={inputType as HTMLInputTypeAttribute}
                  value={propValue}
                  checked={propChecked}
                  defaultChecked={propDefaultChecked}
                  className={styles.checkboxRadioInput({ class: baseInputClassName })}
                />
                {/* No label rendering here as it's handled by FormField */}
              </label>
            </div>
          </div>
        )
      }
    }

    if (rawType === 'display') {
      return (
        <span id={idToUse} className={styles.display({ class: baseInputClassName })} {...restHtmlAttributes}>
          {propValue}
        </span>
      )
    }

    return (
      <input
        {...nativeInputProps}
        type={inputType as HTMLInputTypeAttribute}
        value={propValue}
        defaultValue={propDefaultValue}
        className={styles.inputElement({ class: baseInputClassName })}
      />
    )
  }

  // We no longer need showOuterLabel as we don't render the label here anymore

  // Return just the input container without the outer wrapper or label
  return (
    <div className={styles.inputContainer()} data-testid="input-container">
      {(rawType === 'checkbox' || rawType === 'radio') && normalizedOptions.length === 0 ? (
        <>
          {renderInput()}
          <InputDescription
            id={`${idToUse}-description`}
            description={description}
            className={styles.description({ class: descriptionClassName })}
          />
        </>
      ) : (
        <>
          {rawType === 'combobox' ||
          (rawType === 'checkbox' && normalizedOptions.length > 0) ||
          (rawType === 'radio' && normalizedOptions.length > 0) ||
          rawType === 'display' ? (
            renderInput()
          ) : (
            <div className={styles.inputGroup()}>
              {currentPrefix && (
                <InputAffix isPrefix htmlFor={idToUse} className={styles.affix({ class: prefixClassName })}>
                  {currentPrefix}
                </InputAffix>
              )}
              <div className="relative w-full">
                {renderInput()}
                {clearButton && inputHasValue && !disabled && !readOnly && (
                  <button
                    type="button"
                    className={styles.clearButton()}
                    onClick={handleClearButtonClick}
                    aria-label="Clear input"
                    data-testid="clear-button"
                  >
                    <IconXMark className={styles.clearButtonIcon()} />
                  </button>
                )}
              </div>
              {rawType === 'color' && false && (
                <label
                  htmlFor={`${idToUse}-colorpicker`}
                  className="min-w-[30px] cursor-pointer border border-l-0"
                  style={{
                    backgroundColor: (typeof propValue === 'string' ? propValue : '#888888') as string,
                  }}
                >
                  <input
                    type="color"
                    id={`${idToUse}-colorpicker`}
                    className="invisible h-full w-full"
                    value={typeof propValue === 'string' ? propValue : '#888888'}
                    onChange={propOnChange}
                  />
                </label>
              )}
              {currentSuffix && (
                <InputAffix isPrefix={false} className={styles.affix({ class: suffixClassName })} htmlFor={idToUse}>
                  {currentSuffix}
                </InputAffix>
              )}
            </div>
          )}

          <InputDescription
            id={`${idToUse}-description`}
            description={description}
            className={styles.description({ class: descriptionClassName })}
          />
        </>
      )}
    </div>
  )
}

export default InputField
