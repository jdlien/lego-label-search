'use client'

import React, { useId, ChangeEvent, FocusEvent, HTMLInputTypeAttribute, ReactNode } from 'react'

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
import { inputFieldStyles, type InputFieldStyleProps } from './inputField.styles'

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
          <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none opacity-60">
            {/* TODO: These classes should be added to InputField.styles.ts as a variant so we can use TV to style the icon size/position. */}
            <svg className="size-6 mr-0.75" viewBox="0 0 20 20" fill="currentColor">
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
                    {opt.description && <p className={styles.checkboxRadioDescription()}>{opt.description}</p>}
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

  return (
    <div className={styles.root()}>
      {showOuterLabel && (
        <InputLabel
          htmlFor={idToUse}
          label={label}
          className={styles.labelSlot({ class: labelClassName })}
          required={required}
          fullWidth={fullWidth}
        />
      )}
      <div className={styles.inputContainer()}>
        {(rawType === 'checkbox' || rawType === 'radio') && normalizedOptions.length === 0 ? (
          <>
            {renderInput()}
            {!noErrorEl && (
              <InputError
                id={`${idToUse}-error`}
                error={error}
                className={styles.errorSlot({ class: errorClassName })}
              />
            )}
            <InputDescription
              id={`${idToUse}-description`}
              description={description}
              className={styles.descriptionSlot({ class: descriptionClassName })}
            />
          </>
        ) : (
          <>
            {(rawType !== 'checkbox' && rawType !== 'radio') || normalizedOptions.length === 0 ? (
              rawType !== 'checkbox' && rawType !== 'radio' && rawType !== 'display' ? (
                <div className={styles.inputGroup()}>
                  {currentPrefix && (
                    <InputAffix isPrefix className={styles.affixSlot({ class: prefixClassName })}>
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

            {!noErrorEl && (
              <InputError
                id={`${idToUse}-error`}
                error={error}
                className={styles.errorSlot({ class: errorClassName })}
              />
            )}
            <InputDescription
              id={`${idToUse}-description`}
              description={description}
              className={styles.descriptionSlot({ class: descriptionClassName })}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default InputField
