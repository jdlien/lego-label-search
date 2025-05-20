'use client'

import React, { useState } from 'react'
import InputField from '../components/InputField' // Assuming InputField is in components
import { IconUser, IconAt, IconCurrencyDollar } from '../components/InputField/InputIcons' // Assuming icons might be used as prefixes/suffixes

/*
  TODO:
  - Allow a global theme to be set for the app so we don't have to set theme="gray" on every input field
  - Add size options to have jumbo inputs for an app where that aesthetic makes sense
*/

export default function ThemeTestPage() {
  const [textValue, setTextValue] = useState('Initial Text')
  const [emailValue, setEmailValue] = useState('test@example.com')
  const [passwordValue, setPasswordValue] = useState('password123')
  const [searchValue, setSearchValue] = useState('')
  const [telValue, setTelValue] = useState('555-1234')
  const [urlValue, setUrlValue] = useState('https://example.com')
  const [numberValue, setNumberValue] = useState('123')
  const [decimalValue, setDecimalValue] = useState('123.45')
  const [integerValue, setIntegerValue] = useState('100')
  const [postalValue, setPostalValue] = useState('A1B 2C3')

  const [dateValue, setDateValue] = useState('2023-10-26')
  const [datetimeValue, setDatetimeValue] = useState('2023-10-26T10:30')
  const [timeValue, setTimeValue] = useState('14:45')
  const [colorValue, setColorValue] = useState('#aabbcc')

  const [selectValue, setSelectValue] = useState('option2')
  const [textareaValue, setTextareaValue] = useState('This is some longer text for the textarea.')
  const [markdownValue, setMarkdownValue] = useState(
    '# Markdown Example\n\nThis is **bold** and this is *italic*.\n\n- Item 1\n- Item 2'
  )

  const [singleCheckbox, setSingleCheckbox] = useState(true)
  const [radioValue, setRadioValue] = useState('radio2')
  const [checkboxGroup, setCheckboxGroup] = useState(['check1', 'check3'])

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    {
      value: 'option3',
      label: 'Option 3 with a longer description that might wrap',
      description: 'This is a detailed description for option 3.',
    },
    'option4', // simple string option
  ]

  const radioCheckboxOptions = [
    { value: 'check1', label: 'Choice Alpha', description: 'Description for Alpha' },
    { value: 'check2', label: 'Choice Beta' },
    { value: 'check3', label: 'Choice Gamma', description: 'Description for Gamma' },
  ]

  const radioCheckboxOptionsNoDesc = [
    { value: 'check1', label: 'Choice Alpha' },
    { value: 'check2', label: 'Choice Beta' },
    { value: 'check3', label: 'Choice Gamma' },
  ]

  // Handler for checkbox group
  const handleCheckboxGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target as HTMLInputElement // Assert target type
    setCheckboxGroup((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)))
  }

  return (
    <div>
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold">Theme & UI Test Page</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Use this page to test new UI components and themes in isolation.
        </p>
        <div className="flex gap-4">
          <button className="btn">Default Button</button>
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-danger">Danger Button</button>
          <button className="btn btn-green">Green Button</button>
          <button className="btn btn-ghost">Ghost Button</button>
        </div>
        <div className="flex gap-4">
          <button className="btn" disabled>
            Disabled Button
          </button>
          <button className="btn btn-primary" disabled>
            Primary Button
          </button>
          <button className="btn btn-danger" disabled>
            Danger Button
          </button>
          <button className="btn btn-green" disabled>
            Green Button
          </button>
          <button className="btn btn-ghost" disabled>
            Ghost Button
          </button>
        </div>

        <div>
          <input type="text" className="field" placeholder="Field" />
        </div>
        <div>
          <input type="text" className="field" placeholder="Field Disabled" disabled />
        </div>
      </div>

      <header className="mb-12">
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white">InputField Component Showcase</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 text-center mt-2">
          Testing various states and types of the InputField component.
        </p>
      </header>

      {/* Standard Text Inputs */}
      <section className="p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2 border-gray-300 dark:border-gray-700">
          Standard Text Inputs
        </h2>
        <div className="">
          <InputField
            label="Basic Text Input"
            name="text_basic"
            placeholder="Enter some text"
            fullWidth={true}
            theme="gray"
          />

          <InputField
            label="With Clear Button Uncontrolled"
            name="text_clear_button"
            placeholder="Enter some text"
            theme="gray"
            clearButton
            defaultValue="A value here causes the clear button to be shown at the right."
          />

          <InputField
            label="With Clear Button Controlled"
            name="text_clear_button_controlled"
            placeholder="Enter some text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            theme="gray"
            clearButton
          />

          <p>Text Value: {textValue}</p>

          <InputField label="With Default Value" name="text_default" defaultValue="Hello World" fullWidth={true} />
          <InputField
            label="Controlled Text Input"
            name="text_controlled"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            theme="gray"
          />
          <InputField
            label="With Error"
            name="text_error"
            error="This field has an error."
            value="Incorrect Value"
            readOnly
          />
          <InputField label="With Description" name="text_desc" description="This is a helpful description." />
          <InputField label="Disabled" name="text_disabled" placeholder="Cannot type here" disabled />
          <InputField label="Read Only" name="text_readonly" value="You can only read this" readOnly />
          <InputField
            label="With Prefix"
            name="text_prefix"
            prefix={<IconUser />}
            placeholder="Username"
            theme="gray"
          />
          <InputField
            label="With Suffix (Icon)"
            name="text_suffix_icon"
            suffix={<IconAt />}
            placeholder="Email segment"
          />
          <InputField label="With Suffix (Text)" name="text_suffix_text" suffix=".com" placeholder="Domain" />
          <InputField
            label="With Prefix & Suffix"
            name="text_prefix_suffix"
            prefix="$"
            suffix=".00"
            placeholder="Amount"
            type="number"
          />
          <InputField label="Required Field" name="text_required" placeholder="Must be filled" required />
          <InputField
            type="email"
            label="Stone Theme"
            name="text_stone"
            theme="stone"
            placeholder="Stone theme input"
          />
          <InputField label="Full Width" name="text_full_width" fullWidth placeholder="Takes up more space" />
          <InputField
            label="No Error Element"
            name="text_no_error_el"
            error="Error hidden (check console)"
            noErrorEl
            placeholder="Error is present but not shown"
          />
          <InputField label="With Max Length (10)" name="text_maxlength" maxLength={10} placeholder="Max 10 chars" />
        </div>
      </section>

      {/* Specialized Text Inputs */}
      <section className="p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2 border-gray-300 dark:border-gray-700">
          Specialized Text Inputs
        </h2>
        <div className="">
          <InputField
            fullWidth={true}
            type="email"
            label="Email Input"
            name="email_input"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            description="Auto prefix & placeholder"
          />
          <InputField
            type="password"
            label="Password Input"
            name="password_input"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
          />
          <InputField
            type="search"
            label="Search Input"
            name="search_input"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <InputField
            type="tel"
            label="Telephone Input"
            name="tel_input"
            value={telValue}
            onChange={(e) => setTelValue(e.target.value)}
          />
          <InputField
            type="url"
            label="URL Input"
            name="url_input"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
          />
          <InputField
            type="number"
            label="Number Input"
            name="number_input"
            value={numberValue}
            onChange={(e) => setNumberValue(e.target.value)}
            placeholder="e.g., 123"
            suffix="Units"
          />
          <InputField
            type="decimal"
            label="Decimal Input (text)"
            name="decimal_input"
            value={decimalValue}
            onChange={(e) => setDecimalValue(e.target.value)}
            placeholder="e.g., 123.45"
            prefix={<IconCurrencyDollar />}
          />
          <InputField
            type="integer"
            label="Integer Input (text)"
            name="integer_input"
            value={integerValue}
            onChange={(e) => setIntegerValue(e.target.value)}
            placeholder="e.g., 100"
            error="Only integers allowed"
          />
          <InputField
            type="postal"
            label="Postal Code (text)"
            name="postal_input"
            value={postalValue}
            onChange={(e) => setPostalValue(e.target.value)}
            description="Auto prefix & placeholder"
          />
        </div>
      </section>

      {/* Date and Time Inputs */}
      <section className="p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2 border-gray-300 dark:border-gray-700">
          Date & Time Inputs
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Note: These use text inputs. For actual date pickers, integrate a library like Flatpickr by passing
          `data-fp-options`.
        </p>
        <div className="">
          <InputField
            type="date"
            label="Date Input"
            name="date_input"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            description="YYYY-MM-DD"
          />
          <InputField
            type="datetime"
            label="Date-Time Input"
            name="datetime_input"
            value={datetimeValue}
            onChange={(e) => setDatetimeValue(e.target.value)}
            placeholder="YYYY-MM-DD HH:MM"
          />
          <InputField
            type="time"
            label="Time Input"
            name="time_input"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            prefix="Event&nbsp;at:"
          />
          <InputField
            type="color"
            label="Color Input (text part)"
            name="color_text_input"
            value={colorValue}
            onChange={(e) => setColorValue(e.target.value)}
            description="Component shows icon; actual color picker UI is separate or via native type='color' if not overridden."
          />
          <InputField
            type="text"
            label="Date with Flatpickr (conceptual)"
            name="date_fp"
            placeholder="Click me (if Flatpickr initialized)"
            data-fp-options={JSON.stringify({ dateFormat: 'Y-m-d H:i' })}
            description="Pass data-fp-options for JS init"
          />
        </div>
      </section>

      {/* Select Input */}
      <section className="p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2 border-gray-300 dark:border-gray-700">Select Input</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputField
            type="select"
            label="Basic Select"
            name="select_basic"
            options={selectOptions}
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
          />
          <InputField
            type="select"
            label="Select with Empty Option (default)"
            name="select_empty"
            options={selectOptions}
            description="First option is empty"
          />
          <InputField
            type="select"
            label="Select with Custom Placeholder"
            name="select_placeholder"
            options={selectOptions}
            emptyOption="-- Please Choose --"
          />
          <InputField type="select" label="Select Disabled" name="select_disabled" options={selectOptions} disabled />
          <InputField
            type="select"
            label="Select with Error"
            name="select_error"
            options={selectOptions}
            error="Selection is required"
            value=""
            required
            readOnly
          />
          <InputField
            type="select"
            label="Select Stone Theme"
            name="select_stone"
            options={selectOptions}
            theme="stone"
          />
        </div>
      </section>

      <section className="p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2 border-gray-300 dark:border-gray-700">Gray Themes</h2>

        <div className="py-1 bg-slate-50 dark:bg-slate-900">
          <InputField type="email" label="Slate Theme" name="text_slate" theme="slate" placeholder="Slate" />
        </div>

        <div className="py-1 bg-gray-50 dark:bg-gray-900">
          <InputField type="email" label="Gray Theme" name="text_gray" theme="gray" placeholder="Gray" />
        </div>

        <div className="py-1 bg-zinc-50 dark:bg-zinc-900">
          <InputField type="email" label="Zinc Theme" name="text_zinc" theme="zinc" placeholder="Zinc" />
        </div>

        <div className="py-1 bg-neutral-50 dark:bg-neutral-900">
          <InputField type="email" label="Neutral Theme" name="text_neutral" theme="neutral" placeholder="Neutral" />
        </div>

        <div className="py-1 bg-stone-50 dark:bg-stone-900">
          <InputField type="email" label="Stone Theme" name="text_stone" theme="stone" placeholder="Stone" />
        </div>
      </section>

      {/* Textarea and Markdown */}
      <section className="p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2 border-gray-300 dark:border-gray-700">
          Textarea & Markdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputField
            type="textarea"
            label="Textarea"
            name="textarea_basic"
            value={textareaValue}
            onChange={(e) => setTextareaValue(e.target.value)}
            placeholder="Enter longer text here..."
          />
          <InputField
            type="textarea"
            label="Textarea with Description"
            name="textarea_desc"
            description="Max 200 characters."
            maxLength={200}
          />
          <InputField
            type="textarea"
            label="Textarea Disabled"
            name="textarea_disabled"
            value="Cannot edit this content"
            disabled
          />
          <InputField
            type="markdown"
            label="Markdown Editor (textarea)"
            name="markdown_editor"
            value={markdownValue}
            onChange={(e) => setMarkdownValue(e.target.value)}
            description="Uses a textarea, Markdown rendering is separate."
          />
        </div>
      </section>

      {/* Checkbox Inputs */}
      <section className="p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2 border-gray-300 dark:border-gray-700">
          Checkbox Inputs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <InputField
            type="checkbox"
            label="Single Checkbox"
            name="single_check"
            checked={singleCheckbox}
            onChange={(e) => setSingleCheckbox((e.target as HTMLInputElement).checked)}
            description="A standalone checkbox option"
          />
          <InputField type="checkbox" label="Single Checkbox (Stone)" name="single_check_stone" theme="stone" />
          <InputField type="checkbox" label="Disabled Checked" name="single_check_disabled_checked" checked disabled />
          <InputField type="checkbox" label="Disabled Unchecked" name="single_check_disabled_unchecked" disabled />
          <div className="md:col-span-2">
            <InputField
              type="checkbox"
              label="Checkbox Group (Vertical)"
              name="checkbox_group_vertical"
              options={radioCheckboxOptions}
              value={checkboxGroup} // Pass current selection array
              onChange={handleCheckboxGroupChange} // Custom handler for group
              description="Select multiple options."
            />
          </div>
          <div className="md:col-span-2">
            <InputField
              type="checkbox"
              label="Checkbox Group (Horizontal)"
              name="checkbox_group_horizontal"
              options={radioCheckboxOptions}
              value={checkboxGroup} // Pass current selection array
              onChange={handleCheckboxGroupChange} // Custom handler for group
              horizontal
              error="At least one option must be selected if this was required."
            />
          </div>

          <div className="md:col-span-2">
            <InputField
              type="checkbox"
              label="Checkbox Group (Horizontal, No Desc)"
              name="checkbox_group_horizontal"
              options={radioCheckboxOptionsNoDesc}
              value={checkboxGroup} // Pass current selection array
              onChange={handleCheckboxGroupChange} // Custom handler for group
              horizontal
              error="At least one option must be selected if this was required."
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <InputField
            type="radio"
            label="Radio Group (Horizontal, No Desc)"
            name="radio_group_horizontal_no_desc"
            options={radioCheckboxOptionsNoDesc}
            value={radioValue} // Pass current selection array
            onChange={(e) => setRadioValue(e.target.value)} // Custom handler for group
            horizontal
            error="At least one option must be selected if this was required."
          />
        </div>
      </section>

      {/* Radio Inputs */}
      <section className="p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2 border-gray-300 dark:border-gray-700">Radio Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <InputField
            type="radio"
            label="Radio Group (Vertical)"
            name="radio_group_vertical"
            options={radioCheckboxOptions}
            value={radioValue}
            onChange={(e) => setRadioValue(e.target.value)}
            description="Select one option."
          />
          <InputField
            type="radio"
            label="Radio Group (Horizontal)"
            name="radio_group_horizontal"
            options={radioCheckboxOptions.slice(0, 2)} // Fewer options for horizontal
            value={radioValue}
            onChange={(e) => setRadioValue(e.target.value)}
            horizontal
            error="A selection is mandatory."
            required
          />
          <InputField
            type="radio"
            label="Radio Group (Stone Theme)"
            name="radio_group_stone"
            options={radioCheckboxOptions}
            value={radioValue}
            onChange={(e) => setRadioValue(e.target.value)}
            theme="stone"
          />
          <InputField
            type="radio"
            label="Radio Group Disabled"
            name="radio_group_disabled"
            options={radioCheckboxOptions}
            value="check2" // Pre-select a disabled option
            disabled
          />
        </div>
      </section>

      {/* Other Input Types */}
      <section className="p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2 border-gray-300 dark:border-gray-700">Other Types</h2>
        <div className="">
          <InputField
            type="display"
            label="Display Only Field"
            name="display_field"
            value="This is static display text."
            description="Cannot be edited by user."
          />
          <InputField
            type="display"
            label="Display (Stone)"
            name="display_stone"
            value="Stone themed display"
            theme="stone"
          />
        </div>
      </section>

      {/* Test the original buttons and fields from the page */}
      <section className="p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2 border-gray-300 dark:border-gray-700">
          Original Page Elements (for comparison)
        </h2>
        <div className="flex gap-4 mb-4">
          <button className="btn">Default Button</button>
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-danger">Danger Button</button>
          <button className="btn btn-green">Green Button</button>
          <button className="btn btn-ghost">Ghost Button</button>
        </div>
        <div className="flex gap-4 mb-4">
          <button className="btn" disabled>
            Disabled Button
          </button>
          <button className="btn btn-primary" disabled>
            Primary Button
          </button>
          <button className="btn btn-danger" disabled>
            Danger Button
          </button>
          <button className="btn btn-green" disabled>
            Green Button
          </button>
          <button className="btn btn-ghost" disabled>
            Ghost Button
          </button>
        </div>
        <div className="mb-4">
          <input type="text" className="field" placeholder="Original Field" />
        </div>
        <div>
          <input type="text" className="field" placeholder="Original Field Disabled" disabled />
        </div>
      </section>

      <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>End of InputField component showcase.</p>
      </footer>
    </div>
  )
}
