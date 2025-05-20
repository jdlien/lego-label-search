'use client'

import React, { useId, ChangeEvent, FocusEvent, HTMLInputTypeAttribute, ReactNode } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
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
} from './InputIcons' // Adjusted path

// Import sub-components
import InputLabel from './InputLabel' // Adjusted path
import InputError from './InputError' // Adjusted path
import InputDescription from './InputDescription' // Adjusted path
import InputAffix from './InputAffix' // Adjusted path

// Import types
import type { OptionType, NormalizedOptionType, InputFieldProps } from './types'
// Import TV styles
// import { inputFieldStyles, type InputFieldStyleProps } from './inputField.styles'

const inputFieldStyles = tv({
  slots: {
    // Applied to the outermost div, formerly form-item
    root: 'py-0.5 sm:grid sm:grid-cols-3 sm:items-start sm:gap-x-4 sm:gap-y-1.5 my-3',
    labelSlot: 'block text-sm sm:text-base font-medium sm:mt-px sm:pt-1', // For InputLabel component and its text color
    inputContainer: 'mt-1 sm:mt-0', // Wrapper for the input group or standalone checkbox/radio
    inputGroup: 'relative flex shadow-sm', // Wraps prefix, input, suffix. Base rounding via compound variants.
    inputElement: `
      block w-full border px-4 py-2 text-sm sm:text-base transition duration-150 ease-in-out sm:leading-5
      focus:outline-none focus:ring-2 focus:ring-sky-500/40 inset-shadow-sm
      `,
    // Specific slots for checkbox/radio elements
    checkboxRadioGroup: 'space-y-2', // Container for multiple checkboxes/radios
    checkboxRadioItem: 'flex items-start',
    checkboxRadioInputWrapper: 'flex h-5 items-center',
    checkboxRadioInput: 'size-5 rounded', // Theme-specific: accent color, border, focus ring
    checkboxRadioLabelWrapper: 'ml-3 text-sm',
    checkboxRadioLabel: 'font-medium', // Theme-specific: text color

    affixSlot: 'inline-flex items-center px-3 text-sm', // For InputAffix (prefix/suffix)
    // Theme-specific: Border, bg, text. Assumes InputAffix handles its own edge rounding.

    descriptionSlot: '', // For InputDescription component and its text color
    errorSlot: 'mt-2 text-sm', // For InputError component, primarily for error text color
    displaySpan: 'block w-full sm:mt-px sm:pt-1', // For type='display'

    // Slots for custom select arrow
    selectArrowContainerSlot: 'absolute inset-y-0 right-0 flex items-center pointer-events-none opacity-60',
    selectArrowIconSlot: 'size-6 mr-0.75 text-gray-500 dark:text-gray-400', // Default size, margin, and color
  },
  variants: {
    theme: {
      zinc: {
        inputElement: `
          border-zinc-300 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-200
          placeholder-zinc-400 dark:placeholder-zinc-500 dark:hover:enabled:bg-zinc-900/80
          `,
        labelSlot: 'text-zinc-700 dark:text-zinc-100',
        descriptionSlot: 'text-zinc-500 dark:text-zinc-400',
        affixSlot: 'border-zinc-300 dark:border-zinc-500 bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
        checkboxRadioInput: 'border-zinc-300 dark:border-zinc-500',
        checkboxRadioLabel: 'text-zinc-700 dark:text-zinc-200',
      },
      stone: {
        inputElement: `border-stone-300 dark:border-stone-500 bg-stone-50 dark:bg-stone-900/50 text-stone-700 dark:text-stone-200
        placeholder-stone-400 dark:placeholder-stone-500 dark:hover:enabled:bg-stone-900/80
        `,
        labelSlot: 'text-stone-700 dark:text-stone-100',
        descriptionSlot: 'text-stone-500 dark:text-stone-400',
        affixSlot:
          'border-stone-300 dark:border-stone-500 bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
        checkboxRadioInput: 'border-stone-300 dark:border-stone-500',
        checkboxRadioLabel: 'text-stone-700 dark:text-stone-200',
      },
      gray: {
        inputElement: `border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-950/50 text-gray-700 dark:text-gray-200
          placeholder-gray-400 dark:placeholder-gray-500 dark:hover:enabled:bg-gray-950/80
        `,
        labelSlot: 'text-gray-700 dark:text-gray-100',
        descriptionSlot: 'text-gray-500 dark:text-gray-400',
        affixSlot: 'border-gray-300 dark:border-gray-500 bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        checkboxRadioInput: 'border-gray-300 dark:border-gray-500',
        checkboxRadioLabel: 'text-gray-700 dark:text-gray-200',
      },
      slate: {
        inputElement: `border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200
          placeholder-slate-400 dark:placeholder-slate-500 dark:hover:enabled:bg-slate-900/80
        `,
        labelSlot: 'text-slate-700 dark:text-slate-100',
        descriptionSlot: 'text-slate-500 dark:text-slate-400',
        affixSlot:
          'border-slate-300 dark:border-slate-500 bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        checkboxRadioInput: 'border-slate-300 dark:border-slate-500',
        checkboxRadioLabel: 'text-slate-700 dark:text-slate-200',
      },
      neutral: {
        inputElement: `border-neutral-300 dark:border-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-700 dark:text-neutral-200
          placeholder-neutral-400 dark:placeholder-neutral-500 dark:hover:enabled:bg-neutral-900/80
        `,
        labelSlot: 'text-neutral-700 dark:text-neutral-100',
        descriptionSlot: 'text-neutral-500 dark:text-neutral-400',
        affixSlot:
          'border-neutral-300 dark:border-neutral-500 bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
        checkboxRadioInput: 'border-neutral-300 dark:border-neutral-500',
        checkboxRadioLabel: 'text-neutral-700 dark:text-neutral-200',
      },
    },
    inputType: {
      // Corresponds to 'rawType' prop
      text: {},
      select: {
        inputElement: `pr-8 appearance-none`, // We use a separate element for the select arrow icon
      },
      textarea: {},
      // For checkbox/radio, their specific slots (checkboxRadioInput, etc.) are primary. inputElement slot is often not used or cleared.
      checkbox: { inputElement: '' },
      radio: { inputElement: '' },
      display: { inputElement: '', inputGroup: 'shadow-none' }, // 'display' uses displaySpan, not typical inputElement
      // Other types like 'email', 'date', etc., will use base 'inputElement' styles unless specified
      // 'markdown' should be handled by component logic to map to 'textarea' type for styling
      // 'color' might need special handling for its custom picker UI part
    },
    disabled: {
      true: {
        // General disabled opacity, cursor. BG color is theme-dependent via compoundVariants.
        inputElement: 'opacity-50 cursor-not-allowed',
        checkboxRadioInput: 'opacity-50 cursor-not-allowed',
        affixSlot: 'opacity-50 cursor-not-allowed',
      },
    },
    error: {
      true: {
        inputElement:
          'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/40',
        errorSlot: 'text-red-600 dark:text-red-500', // Ensures error text color
        // labelSlot: "text-red-600 dark:text-red-500", // Optional: make label red on error
      },
    },
    // Boolean variants for structural changes, used in compoundVariants primarily
    hasPrefix: { true: {} },
    hasSuffix: { true: {} },
    // For checkbox/radio group layout
    horizontalLayout: {
      true: { checkboxRadioGroup: 'flex flex-wrap items-center space-x-4 space-y-0' },
    },
    fullWidth: {
      true: {
        labelSlot: 'sm:col-span-3',
        inputContainer: 'sm:col-span-3',
      },
      false: {
        // labelSlot: 'sm:col-span-2',
        inputContainer: 'sm:col-span-2',
      },
    },
  },
  compoundVariants: [
    // Disabled states with theme-specific background for inputElement (overrides hover)
    {
      theme: 'zinc',
      disabled: true,
      class: { inputElement: 'bg-zinc-100 dark:bg-zinc-700 hover:enabled:bg-zinc-100 dark:hover:enabled:bg-zinc-700' },
    },
    {
      theme: 'stone',
      disabled: true,
      class: {
        inputElement: 'bg-stone-100 dark:bg-stone-700 hover:enabled:bg-stone-100 dark:hover:enabled:bg-stone-700',
      },
    },
    {
      theme: 'gray',
      disabled: true,
      class: { inputElement: 'bg-gray-100 dark:bg-gray-700 hover:enabled:bg-gray-100 dark:hover:enabled:bg-gray-700' },
    },
    {
      theme: 'slate',
      disabled: true,
      class: {
        inputElement: 'bg-slate-100 dark:bg-slate-700 hover:enabled:bg-slate-100 dark:hover:enabled:bg-slate-700',
      },
    },
    {
      theme: 'neutral',
      disabled: true,
      class: {
        inputElement:
          'bg-neutral-100 dark:bg-neutral-700 hover:enabled:bg-neutral-100 dark:hover:enabled:bg-neutral-700',
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
  ],
  defaultVariants: {
    theme: 'zinc', // Matches your component's prop default
    disabled: false,
    error: false,
    hasPrefix: false,
    hasSuffix: false,
    horizontalLayout: false,
    inputType: 'text',
    fullWidth: false, // Default to not fullWidth
  },
})

export type InputFieldStyleProps = VariantProps<typeof inputFieldStyles>

const normalizeOptions = (options?: OptionType[]): NormalizedOptionType[] => {
  if (!options) return []
  return options
    .map((opt) => {
      if (typeof opt === 'string') return { value: opt, label: opt }
      if (opt === undefined || opt.value === undefined) {
        console.warn('Option must have a value. Filtering out undefined/NULL values.', opt)
        return null // Will be filtered out
      }

      const value = opt.value.length > 1 && opt.value.endsWith(',') ? opt.value.replace(/,$/, '') : opt.value
      const label = 'label' in opt && opt.label !== undefined ? opt.label : value
      const normalized: NormalizedOptionType = { value, label }

      if (opt.description !== undefined) normalized.description = opt.description
      if (opt.selected !== undefined) normalized.selected = opt.selected // Keep for initial state if needed

      return normalized
    })
    .filter((opt) => opt !== null) as NormalizedOptionType[]
}

const InputField: React.FC<InputFieldProps> = (props) => {
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
    label,
    error,
    description,
    prefix: rawPrefix,
    suffix: rawSuffix,
    options: rawOptions,
    emptyOption = true,
    horizontal,
    noErrorEl,
    fullWidth,
    theme = 'zinc', // Default theme
    // Class overrides
    labelClassName,
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
      currentPlaceholder = rawPlaceholder || (typeof emptyOption === 'string' ? emptyOption : undefined)
      break
    case 'textarea':
      break
    case 'checkbox':
    case 'radio':
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
      break
    case 'display':
      break
  }

  const normalizedOptions = normalizeOptions(rawOptions)

  // Determine the inputType for styling variants (tv expects one of its defined inputType values)
  let styleInputType: InputFieldStyleProps['inputType']
  if (
    rawType === 'select' ||
    rawType === 'textarea' ||
    rawType === 'checkbox' ||
    rawType === 'radio' ||
    rawType === 'display'
  ) {
    styleInputType = rawType as InputFieldStyleProps['inputType']
  } else if (isMarkdown) {
    styleInputType = 'textarea'
  }

  const styles = inputFieldStyles({
    theme,
    disabled,
    error: !!error,
    hasPrefix: !!currentPrefix,
    hasSuffix: !!currentSuffix,
    inputType: styleInputType,
    horizontalLayout: horizontal && (rawType === 'checkbox' || rawType === 'radio') && normalizedOptions.length > 0,
    fullWidth: fullWidth,
    class: className,
  })

  const ariaDescribedBy: string[] = []
  if (description) ariaDescribedBy.push(`${idToUse}-description`)
  if (error && !noErrorEl) ariaDescribedBy.push(`${idToUse}-error`)

  const nativeInputProps: Record<string, any> = {
    id: idToUse,
    name: propName,
    onChange: propOnChange,
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
    'aria-labelledby': label ? `${idToUse}-label` : undefined,
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
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Select arrow icon - could change the text color of this div to adjust the color of the icon */}
          <div className={styles.selectArrowContainerSlot()}>
            {/* TODO: These classes should be added to InputField.styles.ts as a variant so we can use TV to style the icon size/position. */}
            {/* The TODO is now addressed by using styles.selectArrowIconSlot() */}
            <svg className={styles.selectArrowIconSlot()} viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" />
            </svg>
          </div>
        </div>
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

              // TODO: In appInput.cfc we have a slightly different structure that allows us to use a
              // border around checked checkboxes and radios. We should refactor to use that structure.
              // There was also a hover effect. This version doesn't do that at all yet.
              return (
                <div key={optionId} className={styles.checkboxRadioItem()}>
                  <div className={styles.checkboxRadioInputWrapper()}>
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
                  </div>
                  <div className={styles.checkboxRadioLabelWrapper()}>
                    <label htmlFor={optionId} className={styles.checkboxRadioLabel()}>
                      {opt.label}
                    </label>
                    {opt.description && <p className={styles.descriptionSlot()}>{opt.description}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )
      } else {
        // Single checkbox
        return (
          <div className="flex items-start">
            <div className={styles.checkboxRadioInputWrapper()}>
              <input
                {...nativeInputProps}
                type={inputType as HTMLInputTypeAttribute}
                value={propValue}
                checked={propChecked}
                defaultChecked={propDefaultChecked}
                className={styles.checkboxRadioInput({ class: baseInputClassName })}
              />
            </div>
            {label && (
              <div className={styles.checkboxRadioLabelWrapper()}>
                <InputLabel
                  htmlFor={idToUse}
                  label={label}
                  className={styles.checkboxRadioLabel({ class: labelClassName })}
                  required={required}
                />
              </div>
            )}
          </div>
        )
      }
    }

    if (rawType === 'display') {
      return (
        <span id={idToUse} className={styles.displaySpan({ class: baseInputClassName })} {...restHtmlAttributes}>
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

  const showOuterLabel =
    label && !((rawType === 'checkbox' || rawType === 'radio') && normalizedOptions.length === 0 && !label)

  // Return the outer container div with the label and input container
  return (
    <div className={styles.root()} data-testid="input-field-outer-container">
      {showOuterLabel && (
        <InputLabel
          htmlFor={idToUse}
          label={label}
          className={styles.labelSlot({ class: labelClassName, fullWidth: fullWidth })}
          required={required}
        />
      )}
      <div
        className={styles.inputContainer({ class: rawType === 'checkbox' || rawType === 'radio' ? 'pt-2' : '' })}
        data-testid="input-container"
      >
        {(rawType === 'checkbox' || rawType === 'radio') && normalizedOptions.length === 0 ? (
          <>
            {renderInput()}
            <InputDescription
              id={`${idToUse}-description`}
              description={description}
              className={styles.descriptionSlot({ class: descriptionClassName })}
            />
            {!noErrorEl && (
              <InputError
                id={`${idToUse}-error`}
                error={error}
                className={styles.errorSlot({ class: errorClassName })}
              />
            )}
          </>
        ) : (
          <>
            {(rawType !== 'checkbox' && rawType !== 'radio') || normalizedOptions.length === 0 ? (
              rawType !== 'checkbox' && rawType !== 'radio' && rawType !== 'display' ? (
                <div className={styles.inputGroup()}>
                  {currentPrefix && (
                    <InputAffix isPrefix htmlFor={idToUse} className={styles.affixSlot({ class: prefixClassName })}>
                      {currentPrefix}
                    </InputAffix>
                  )}
                  {renderInput()}
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
                    <InputAffix
                      isPrefix={false}
                      className={styles.affixSlot({ class: suffixClassName })}
                      htmlFor={idToUse}
                    >
                      {currentSuffix}
                    </InputAffix>
                  )}
                </div>
              ) : (
                renderInput()
              )
            ) : (
              renderInput()
            )}

            <InputDescription
              id={`${idToUse}-description`}
              description={description}
              className={styles.descriptionSlot({ class: descriptionClassName })}
            />
            {!noErrorEl && (
              <InputError
                id={`${idToUse}-error`}
                error={error}
                className={styles.errorSlot({ class: errorClassName })}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default InputField
