import { tv, type VariantProps } from 'tailwind-variants'
import clsx from 'clsx'

export const inputFieldStyles = tv({
  slots: {
    root: 'form-item', // Applied to the outermost div
    labelSlot: '', // For the InputLabel component and its text color
    inputContainer: 'mt-1 sm:mt-0', // Wrapper for the input group or standalone checkbox/radio
    inputGroup: 'relative flex shadow-sm', // Wraps prefix, input, suffix. Base rounding via compound variants.
    inputElement: clsx(
      // The actual <input>, <select>, <textarea>
      'block w-full px-3 py-1.5 text-base transition duration-150 ease-in-out sm:text-sm sm:leading-5',
      'focus:outline-none focus:ring-2 focus:ring-offset-0'
      // Theme-specific: borders, bg, text, placeholder, focus ring, hover bg
      // State-specific: error borders/ring, disabled opacity/bg
    ),
    // Specific slots for checkbox/radio elements
    checkboxRadioGroup: 'space-y-2', // Container for multiple checkboxes/radios
    checkboxRadioItem: 'flex items-start',
    checkboxRadioInputWrapper: 'flex h-5 items-center',
    checkboxRadioInput: 'h-4 w-4 rounded', // Theme-specific: accent color, border, focus ring
    checkboxRadioLabelWrapper: 'ml-3 text-sm',
    checkboxRadioLabel: 'font-medium', // Theme-specific: text color
    checkboxRadioDescription: '', // Theme-specific: text color (subtle)

    affixSlot: 'inline-flex items-center px-3 text-sm', // For InputAffix (prefix/suffix)
    // Theme-specific: Border, bg, text. Assumes InputAffix handles its own edge rounding.

    descriptionSlot: '', // For InputDescription component and its text color
    errorSlot: 'mt-2 text-sm', // For InputError component, primarily for error text color
    displaySpan: 'block w-full sm:mt-px sm:pt-1', // For type='display'
  },
  variants: {
    theme: {
      zinc: {
        inputElement:
          'border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-blue-500 hover:enabled:bg-zinc-100 dark:hover:enabled:bg-zinc-700',
        labelSlot: 'text-zinc-700 dark:text-zinc-200',
        descriptionSlot: 'text-zinc-500 dark:text-zinc-400',
        affixSlot: 'border-zinc-300 dark:border-zinc-500 bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400', // Adjusted from original themeClassSet.prefixSuffixColors
        checkboxRadioInput: 'border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500',
        checkboxRadioLabel: 'text-zinc-700 dark:text-zinc-200',
        checkboxRadioDescription: 'text-zinc-500 dark:text-zinc-400',
      },
      stone: {
        inputElement:
          'border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 focus:ring-amber-500 hover:enabled:bg-stone-100 dark:hover:enabled:bg-stone-700',
        labelSlot: 'text-stone-700 dark:text-stone-200',
        descriptionSlot: 'text-stone-500 dark:text-stone-400',
        affixSlot:
          'border-stone-300 dark:border-stone-500 bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-400',
        checkboxRadioInput: 'border-stone-300 dark:border-stone-600 text-indigo-600 focus:ring-indigo-500', // Assuming indigo accent for now
        checkboxRadioLabel: 'text-stone-700 dark:text-stone-200',
        checkboxRadioDescription: 'text-stone-500 dark:text-stone-400',
      },
      gray: {
        inputElement:
          'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-amber-500 hover:enabled:bg-gray-100 dark:hover:enabled:bg-gray-700',
        labelSlot: 'text-gray-700 dark:text-gray-200',
        descriptionSlot: 'text-gray-500 dark:text-gray-400',
        affixSlot: 'border-gray-300 dark:border-gray-500 bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
        checkboxRadioInput: 'border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500', // Assuming indigo accent for now
        checkboxRadioLabel: 'text-gray-700 dark:text-gray-200',
        checkboxRadioDescription: 'text-gray-500 dark:text-gray-400',
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
          'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400',
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
      true: { inputContainer: 'sm:col-span-3' },
      false: { inputContainer: 'sm:col-span-2' },
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
