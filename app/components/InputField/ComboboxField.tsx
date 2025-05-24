'use client'

import React, { useState, useEffect, useRef } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import { Check, ChevronsUpDown } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'
import { IconXMark, IconMagnifyingGlass } from './InputIcons'
import type { NormalizedOptionType } from './types'

const comboboxStyles = tv({
  slots: {
    comboboxTrigger: `
      flex items-center w-full border transition duration-150 ease-in-out bg-white/90 hover:enabled:bg-white focus-visible:enabled:bg-white
      focus:outline-none focus-visible:ring-2 inset-shadow-sm dark:hover:enabled:bg-black/40 dark:enabled:focus-visible:bg-black/50
      disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
    `,
    comboboxContent: `
      z-50 w-full min-w-[var(--radix-popover-trigger-width)] rounded-md border p-0 text-popover-foreground shadow-md outline-none
      overflow-hidden
      data-[state=open]:animate-in data-[state=closed]:animate-out
      data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
      data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
      data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2
      data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
    `,
    comboboxCommand: 'overflow-hidden rounded-md',
    // comboboxInput:
    //   'flex h-9 w-full rounded-md border-0 bg-transparent p-3 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
    comboboxList: 'max-h-[min(500px,calc(var(--radix-popover-content-available-height)-50px))] overflow-y-auto p-1',
    comboboxEmpty: 'py-6 text-center text-sm text-muted-foreground',
    comboboxGroup: 'overflow-hidden p-1',
    comboboxItem: `
      relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 outline-none
      data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50
    `,
    comboboxChevron: 'h-4 w-4 shrink-0 opacity-50',
    comboboxCheck: 'ml-auto h-4 w-4',
    comboboxPlaceholder: '',
    clearButton:
      'absolute p-1.5 top-1/2 -translate-y-1/2 justify-center group outline-none focus-visible:inset-ring-sky-500/40 focus-visible:inset-ring-2 rounded-full',
    clearButtonIcon: 'size-4',
  },
  variants: {
    size: {
      sm: {
        comboboxTrigger: 'pl-2 pr-1 py-1 text-sm leading-4 rounded-md',
        clearButton: 'right-0.5',
        clearButtonIcon: 'size-3',
      },
      md: {
        comboboxTrigger: 'pl-4 pr-2 py-2 text-sm sm:text-base sm:leading-5 rounded-md',
        clearButton: 'right-1',
        clearButtonIcon: 'size-4',
      },
      lg: {
        comboboxTrigger: 'pl-5 pr-3 py-3 text-base sm:text-lg leading-6 rounded-md',
        clearButton: 'right-1.5',
        clearButtonIcon: 'size-5',
      },
    },
    accent: {
      blue: {
        comboboxTrigger: 'focus-visible:ring-blue-500/40',
        comboboxItem: 'data-[selected=true]:bg-blue-600 data-[selected=true]:text-white',
      },
      sky: {
        comboboxTrigger: 'focus-visible:ring-sky-500/40',
        comboboxItem: 'data-[selected=true]:bg-sky-600 data-[selected=true]:text-white',
      },
      red: {
        comboboxTrigger: 'focus-visible:ring-red-500/40',
        comboboxItem: 'data-[selected=true]:bg-red-600 data-[selected=true]:text-white',
      },
      green: {
        comboboxTrigger: 'focus-visible:ring-green-500/40',
        comboboxItem: 'data-[selected=true]:bg-green-600 data-[selected=true]:text-white',
      },
      indigo: {
        comboboxTrigger: 'focus-visible:ring-indigo-500/40',
        comboboxItem: 'data-[selected=true]:bg-indigo-600 data-[selected=true]:text-white',
      },
      violet: {
        comboboxTrigger: 'focus-visible:ring-violet-500/40',
        comboboxItem: 'data-[selected=true]:bg-violet-600 data-[selected=true]:text-white',
      },
      purple: {
        comboboxTrigger: 'focus-visible:ring-purple-500/40',
        comboboxItem: 'data-[selected=true]:bg-purple-600 data-[selected=true]:text-white',
      },
      fuchsia: {
        comboboxTrigger: 'focus-visible:ring-fuchsia-500/40',
        comboboxItem: 'data-[selected=true]:bg-fuchsia-600 data-[selected=true]:text-white',
      },
      pink: {
        comboboxTrigger: 'focus-visible:ring-pink-500/40',
        comboboxItem: 'data-[selected=true]:bg-pink-600 data-[selected=true]:text-white',
      },
      rose: {
        comboboxTrigger: 'focus-visible:ring-rose-500/40',
        comboboxItem: 'data-[selected=true]:bg-rose-600 data-[selected=true]:text-white',
      },
      amber: {
        comboboxTrigger: 'focus-visible:ring-amber-500/40',
        comboboxItem: 'data-[selected=true]:bg-amber-600 data-[selected=true]:text-white',
      },
      yellow: {
        comboboxTrigger: 'focus-visible:ring-yellow-500/40',
        comboboxItem: 'data-[selected=true]:bg-yellow-500 data-[selected=true]:text-black',
      },
      lime: {
        comboboxTrigger: 'focus-visible:ring-lime-500/40',
        comboboxItem: 'data-[selected=true]:bg-lime-500 data-[selected=true]:text-black',
      },
      emerald: {
        comboboxTrigger: 'focus-visible:ring-emerald-500/40',
        comboboxItem: 'data-[selected=true]:bg-emerald-600 data-[selected=true]:text-white',
      },
      teal: {
        comboboxTrigger: 'focus-visible:ring-teal-500/40',
        comboboxItem: 'data-[selected=true]:bg-teal-600 data-[selected=true]:text-white',
      },
      cyan: {
        comboboxTrigger: 'focus-visible:ring-cyan-500/40',
        comboboxItem: 'data-[selected=true]:bg-cyan-600 data-[selected=true]:text-white',
      },
    },
    theme: {
      slate: {
        comboboxTrigger: `border-slate-400/80 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-200`,
        comboboxContent: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700',
        comboboxPlaceholder: 'text-slate-400 dark:text-slate-500',
        comboboxItem: `
          hover:bg-slate-100/50 dark:hover:bg-slate-800/50
        `,
        clearButtonIcon:
          'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300',
      },
      gray: {
        comboboxTrigger: `border-gray-400/80 bg-gray-50 dark:bg-gray-950/50 text-gray-700 dark:text-gray-200`,
        comboboxContent: 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700',
        comboboxPlaceholder: 'text-gray-400 dark:text-gray-500',
        clearButtonIcon: 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300',
      },
      zinc: {
        comboboxTrigger: `border-zinc-400/80 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-700 dark:text-zinc-200`,
        comboboxContent: 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700',
        comboboxPlaceholder: 'text-zinc-400 dark:text-zinc-500',
        clearButtonIcon: 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300',
      },
      neutral: {
        comboboxTrigger: `border-neutral-400/80 bg-neutral-50 dark:bg-neutral-950/50 text-neutral-700 dark:text-neutral-200`,
        comboboxContent: 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700',
        comboboxPlaceholder: 'text-neutral-400 dark:text-neutral-500',
        clearButtonIcon:
          'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300',
      },
      stone: {
        comboboxTrigger: `border-stone-400/80 bg-stone-50 dark:bg-stone-950/50 text-stone-700 dark:text-stone-200`,
        comboboxContent: 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700',
        comboboxPlaceholder: 'text-stone-400 dark:text-stone-500',
        clearButtonIcon:
          'text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300',
      },
    },
  },
  defaultVariants: {
    size: 'md',
    accent: 'sky',
    theme: 'gray',
  },
})

export type ComboboxStyleProps = VariantProps<typeof comboboxStyles>

interface ComboboxFieldProps extends ComboboxStyleProps {
  id: string
  name?: string
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  options: NormalizedOptionType[]
  emptyOption?: boolean | string
  clearButton?: boolean
  className?: string
  parentStyles?: {
    inputElement?: (props?: { class?: string }) => string
  }
}

const ComboboxField: React.FC<ComboboxFieldProps> = ({
  id,
  name,
  value = '',
  onChange,
  onBlur,
  placeholder,
  disabled,
  readOnly,
  options,
  clearButton,
  className,
  size = 'md',
  accent = 'sky',
  theme = 'gray',
  parentStyles,
}) => {
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const comboboxValue = typeof value === 'string' ? value : ''
  const pendingCloseRef = useRef(false)

  // Close popover after parent re-renders with new value (prevents race condition)
  useEffect(() => {
    if (pendingCloseRef.current) {
      setComboboxOpen(false)
      pendingCloseRef.current = false
    }
  }, [value])

  // Generate styles using the TV function
  const styles = comboboxStyles({ size, accent, theme })

  // Get display value for selected option - ensure string comparison
  const selectedOption = options.find((opt) => String(opt.value) === String(comboboxValue))
  const displayValue = selectedOption?.label || ''

  // Handle value changes
  const handleComboboxSelect = (value: string) => {
    if (onChange) {
      // Toggle behavior: if selecting the same value, clear it
      const finalValue = String(value) === String(comboboxValue) ? '' : String(value)
      const syntheticEvent = {
        target: { value: finalValue, name, id },
        currentTarget: { value: finalValue, name, id },
      } as React.ChangeEvent<HTMLInputElement>
      onChange(syntheticEvent)
    }

    // Instead of closing immediately, schedule it for after parent re-renders
    pendingCloseRef.current = true
  }

  // Handle clear button click
  const handleClearButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent opening the combobox

    if (onChange) {
      const syntheticEvent = {
        target: { value: '', name, id },
        currentTarget: { value: '', name, id },
      } as React.ChangeEvent<HTMLInputElement>
      onChange(syntheticEvent)
    }
    setComboboxOpen(false)
  }

  // Determine if clear button should be shown
  const showClearButton = clearButton && !!comboboxValue && !disabled && !readOnly

  // Handle blur for combobox button
  const handleComboboxBlur = () => {
    if (onBlur) {
      const syntheticEvent = {
        target: { value: comboboxValue, name, id },
        currentTarget: { value: comboboxValue, name, id },
      } as React.FocusEvent<HTMLInputElement>
      onBlur(syntheticEvent)
    }
  }

  // Handle Radix popover state changes
  const handlePopoverOpenChange = (open: boolean) => {
    setComboboxOpen(open)
  }

  return (
    <Popover.Root open={comboboxOpen} onOpenChange={handlePopoverOpenChange}>
      <Popover.Trigger asChild>
        <button
          id={id}
          role="combobox"
          aria-expanded={comboboxOpen}
          aria-haspopup="listbox"
          aria-controls={`${id}-listbox`}
          disabled={disabled}
          className={styles.comboboxTrigger({ class: className })}
          onBlur={handleComboboxBlur}
          data-testid="combobox-trigger"
        >
          <span className="flex-1 truncate text-left">
            {displayValue || <span className={styles.comboboxPlaceholder()}>{placeholder}</span>}
          </span>
          <div className="flex items-center">
            {showClearButton && (
              <div
                role="button"
                tabIndex={0}
                className={styles.clearButton({ class: 'relative translate-none cursor-pointer p-0' })}
                onClick={handleClearButtonClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    // Create a synthetic mouse event for the clear button click
                    const syntheticMouseEvent = {
                      preventDefault: () => {},
                      stopPropagation: () => {},
                    } as React.MouseEvent
                    handleClearButtonClick(syntheticMouseEvent)
                  }
                }}
                aria-label="Clear selection"
                data-testid="combobox-clear-button"
              >
                <IconXMark className={styles.clearButtonIcon()} />
              </div>
            )}
            <ChevronsUpDown className={styles.comboboxChevron()} />
          </div>
        </button>
      </Popover.Trigger>
      <Popover.Content className={styles.comboboxContent()} align="start" sideOffset={4}>
        <Command className={styles.comboboxCommand()}>
          <div
            className={styles.comboboxPlaceholder({
              class: 'relative flex items-center gap-1 border-b text-gray-400 dark:text-gray-500',
            })}
          >
            <IconMagnifyingGlass className="absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Command.Input
              placeholder="Search&hellip;"
              className={parentStyles?.inputElement?.({
                class: 'm-0 w-full border-none py-2 pl-9 focus-visible:ring-0',
              })}
            />
          </div>
          <Command.List className={styles.comboboxList()} id={`${id}-listbox`} data-testid="combobox-list">
            <Command.Empty className={styles.comboboxEmpty()}>No options found.</Command.Empty>
            <Command.Group className={styles.comboboxGroup()}>
              {/* Regular options */}
              {options.map((option) => (
                <Command.Item
                  key={option.value}
                  value={option.label}
                  keywords={[String(option.value), option.description || ''].filter(Boolean)}
                  disabled={option.disabled}
                  onSelect={() => handleComboboxSelect(option.value)}
                  className={styles.comboboxItem()}
                >
                  <div className="flex flex-1 items-center">
                    <div className="flex-1">
                      <div>{option.label}</div>
                      {option.description && <div className="text-xs opacity-70">{option.description}</div>}
                    </div>
                  </div>
                  <Check
                    className={`${styles.comboboxCheck()} ${
                      String(comboboxValue) === String(option.value) ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </Popover.Content>
    </Popover.Root>
  )
}

export default ComboboxField
