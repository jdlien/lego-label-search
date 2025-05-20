component {
  /**
   * Generates form inputs that support @jdlien/validator and incorporate structure
   * to work well with apps.epl.ca's Tailwind-based styles.
   *
   * A TypeScript version of this tag is available called AppInput.ts.
   *
   * This can can be used via the <cf_input> tag with HTML attributes or by instantiating
   * an instance of the AppInput component and calling the html() or writeOutput() methods.
   *
   * input = new AppInput({
   *   type: 'text',
   *   name: 'myInput',
   *   value: 'myValue',
   *   required: true
   * }).html()
   *
   * writeOutput(input)
   *
   * new AppInput(attributes).writeOutput()
   *
   * TODO:
   *  - Add a type to support the fileinput tag
   *  - When loaded on www2, use the 'stone' gray instead of 'zinc'
   *    - In init, swap the default classes with www2 alternates]
   *  - Add the disable attribute to multi-radio/select inputs in the TS version
   *  - Add the disabled markdown rendering/handling features to the TS version
   */
  property name="hasEndTag" type="boolean" default=false;
  property name="id" type="string" default="";
  property name="type" type="string" default="text";
  property name="name" type="string" default="";
  property name="value" type="string" default="";
  property name="error" type="string";
  property name="options" type="array";
  property name="compact" type="boolean" default="false"
    hint="If true, there will be less space around the options in multiple radios and checkboxes.";
  property name="required" type="boolean" default=false;
  property name="disabled" type="boolean" default=false;
  property name="fullWidth" type="boolean" default=false;
  property name="horizontal" type="boolean" default=false;
  property name="noErrorEl" type="boolean" default=false;
  property name="emptyOption" type="boolean" default=true;
  property name="useMarkdown" type="boolean" default=false;
  property name="attributesString" type="string" default="";


  // Generated values
  property name="labelEl" type="string" default="";
  property name="prefixEl" type="string" default="";
  property name="suffixEl" type="string" default="";
  property name="errorEl" type="string" default="";
  property name="colorEl" type="string" default="";
  property name="descriptionEl" type="string" default="";

  // Default styling for built-in elements
  property name="borderColor" type="string"
    default="border-zinc-350 dark:border-zinc-500";
  property name="borderStone" type="string"
    default="border-stone-350 dark:border-stone-500";
  property name="prefixSuffixColor" type="string"
    default="bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400";
  property name="prefixSuffixStone" type="string"
    default="bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-400";
  property name="labelClassDefault" type="string"
    default="block font-medium sm:mt-px sm:pt-1";
  property name="prefixClassDefault" type="string"
    default="px-1 min-w-[30px] border border-r-0 inline-flex items-center justify-center";
  property name="suffixClassDefault" type="string"
    default="px-1 border border-l-0";
  property name="errorClassDefault" type="string"
    default="error hidden text-sm text-red-600 transition dark:text-red-500";
  property name="descriptionClassDefault" type="string"
    default="mt-1 text-sm text-zinc-500 dark:text-zinc-400";
  property name="columnsClass" type="string"
    default="" hint="The number of columns to use for multiple radio/checkbox inputs";

  function init(required struct attributes) {
    // If this is www2, use the stone colors instead of zinc
    var isW2 = cgi.server_name.findNoCase('www2') != 0

    if (isW2) {
      variables.borderColor = variables.borderStone
      variables.prefixSuffixColor = variables.prefixSuffixStone
    }

    // Set appropriate hue of gray based on the environment
    variables.prefixClassDefault &= ' ' & prefixSuffixColor & ' ' & borderColor
    variables.suffixClassDefault &= ' ' & prefixSuffixColor & ' ' & borderColor

    // Must be set before setupInputAttributes as this is checked within
    variables.disabled = attributes.keyExists('disabled') && attributes.disabled != false ? true : false

    // Ensure appropriate values are set for input attributes
    attributes = setupInputAttributes(attributes)

    // Set variables needed outside of init()
    variables.type = attributes.type
    variables.hasEndTag = !!'select,textarea,button'.listFindNoCase(variables.type)
    variables.required = attributes.keyExists('required') && attributes.required != false ? true : false
    variables.horizontal = attributes.horizontal ?: false
    variables.id = attributes.id
    variables.name = attributes.name
    variables.emptyOption = attributes?.emptyOption == false ? false : true
    variables.noErrorEl = attributes.keyExists('noErrorEl') && attributes.noErrorEl != false ? true : false
    variables.compact = attributes.keyExists('compact') && attributes.compact != false ? true : false
    attributes.delete('compact')
    setColumnsClass(attributes?.columns)
    attributes.delete('columns')

    if (isDefined('attributes.options')) variables.options = variables.normalizeOptions(attributes.options)
    if (isDefined('attributes.value')) variables.value = attributes.value
    if (isDefined('attributes.error')) variables.error = attributes.error
    // If fullWidth is true, the input will use all the available columns
    if (isDefined('attributes.fullWidth') && attributes.fullWidth != false) variables.fullWidth = true
    if (attributes.keyExists('full-width') && attributes['full-width'] != false) variables.fullWidth = true

    // Set optional elements
    variables.labelEl = generateLabelEl(attributes)
    variables.colorEl = generateColorEl(attributes)
    variables.errorEl = generateErrorEl(attributes)
    variables.prefixEl = generatePrefixEl(attributes)
    variables.suffixEl = generateSuffixEl(attributes)
    variables.descriptionEl = generateDescriptionEl(attributes)

    // Set up the input attributes - must be done after labelEl and errorEl are set
    variables.attributesString = generateAttributesString(attributes)

    return this
  } // end init()

  /** Returns the a random string including lowercase & uppercase letters and numbers */
  string function randString(required numeric length = 9) {
    var str = ''
    for (var i = 1; i <= length; i++) {
      var rng = randRange(0, 2)
      str &= rng
        ? rng == 1 ? chr(randRange(65, 90)) : chr(randRange(97, 122)) // A-Z or a-z
        : chr(randRange(48, 57)) // 0-9
    }

    return str
  }

  /** Returns an ID based on the attributes or generates a random one */
  string function generateId(required struct attributes) {
    // If the id is undefined, use the name or generate a random one
    if (len(attributes?.id)) return attributes.id

    if (len(attributes?.name)) return attributes.name & '-' & randString()

    return 'input-' & randString()
  }

  /** Generates an HTML element string for a specified FontAwesome icon */
  string function faIcon(required string iconName) {
    return '<i class="fa fa-#iconName#" aria-hidden="true"></i>'
  }

  /** Set appropriate defaults for input attributes based on the input type */
  struct function setupInputAttributes(required struct attributes) {
    attributes.id = generateId(attributes)

    // Default the name to the id if it's not set
    if (!len(attributes?.name)) attributes.name = attributes?.id

    // If there's a pattern attribute, also add a data-pattern attribute (to appease TS in Validator)
    if (len(attributes?.pattern)) attributes['data-pattern'] = attributes.pattern

    attributes.type = lCase(attributes.type ?: 'text')
    // Adjust default settings based on type
    switch(attributes.type) {
      case 'select':
        param attributes.classDefault = 'block w-full';
        if (len(attributes?.placeholder)) attributes['data-placeholder'] = attributes.placeholder
        break;

      case 'checkbox':
        param attributes.classDefault = '';
        break;

      case 'radio':
        param attributes.classDefault = '';
        break;

      case 'decimal':
        attributes.type = 'text'
      case 'number':
        param attributes.inputmode = 'decimal'; // Numeric keyboard on mobile
        if (!attributes.keyExists('data-type')) attributes['data-type'] = 'decimal'
        break;

      case 'integer':
        attributes.type = 'text'
        param attributes.inputmode = 'numeric'; // Numeric keyboard on mobile
        if (!attributes.keyExists('data-type')) attributes['data-type'] = 'integer'
        break;

      case 'email':
        // Add an email keyboard on mobile devices
        param attributes.inputmode = 'email';
        param attributes.prefix = faIcon('envelope');
        param attributes.placeholder = '____@____.___';
        attributes['data-type'] = 'email';
        break;

      case 'postal':
        // Postal isn't a real type, setting that to text
        attributes.type = 'text'
        attributes['data-type'] = 'postal';
        param attributes.prefix = faIcon('map-marker-alt');
        param attributes.placeholder = '___ ___';
        break;

      case 'url':
        // Add a URL keyboard on mobile devices
        param attributes.inputmode = 'url';
        // Not including the prefix by default - it should be part of the input value
        param attributes.prefix = faIcon('link');
        param attributes.placeholder = 'https://____.___';
        break;

      case 'tel':
      case 'phone':
        // Add a telephone keyboard on mobile devices
        param attributes.inputmode = 'tel';
        attributes.type = 'tel'
        param attributes.prefix = faIcon('phone');
        param attributes.placeholder = '___-___-____';
        attributes['data-type'] = 'tel';
        break;

      case 'date':
        param attributes.prefix = faIcon('calendar-alt');
        param attributes.placeholder = 'YYYY-Mmm-D';
        attributes['data-type'] = 'date';
        // Override built-in date validation
        // (you don't likely want it except maybe on iPhone)
        attributes.type = 'text';
        // a data-date-range attribute can be added with the following values:
        // - future
        // - past
        break;

      case 'datetime':
        param attributes.prefix = faIcon('calendar-day');
        param attributes.placeholder = 'YYYY-Mmm-D h:mm AM';
        attributes['data-type'] = 'datetime';
        // For native datetime inputs, use datetime-local. We likely don't want this, however.
        attributes.type = 'text';
        break;

      case 'time':
        param attributes.prefix = faIcon('clock');
        param attributes.placeholder = 'H:MM AM';
        attributes['data-type'] = 'time';
        // Override the built-in time validation with a custom one
        attributes.type = 'text';
        break;

      case 'password':
        param attributes.prefix = faIcon('lock');
        break;

      case 'color':
        param attributes.prefix = faIcon('palette');
        attributes['data-type'] = 'color';
        attributes.type = 'text';
        break;

      case 'markdown':
        variables.useMarkdown = true;
        attributes['data-markdown'] = true;
        attributes.type = 'textarea';
      case 'textarea':
        param attributes.classDefault = 'block w-full border'; // maybe not necessary?
        // If this is a disabled markdown field, we hide the actual input and show the rendered markdown
        if (variables.useMarkdown && variables.disabled) attributes.classDefault &= ' hidden'
        break;


      case 'submit':
        param attributes.classDefault = 'btn-primary block w-full text-lg';
        break;

      case 'display':
        // Used to only display a span and not a form input
        param attributes.classDefault = 'block w-full sm:mt-px sm:pt-1';
    }

    // If we haven't yet set a default class, set it to the default
    param attributes.classDefault = 'block w-full px-1.5 transition';

    // We can handle any special classes needed for fields with a prefix here,
    // such as rounding one side with a prefix and both sides without
    attributes.classDefault &= len(attributes?.prefix) ? '' : ''

    return attributes
  }

  /** This silly function is a byproduct of the fact that tailwind needs to see the entire class names */
  // safelist: columns-1 columns-2 columns-3 columns-4 columns-5 columns-6 columns-7 columns-8 columns-9 columns-10
  void function setColumnsClass(any cols) {
    if (!arguments.keyExists('cols')) arguments.cols = ''
    variables.columnsClass = isNumeric(cols) ? 'columns-' & cols : cols
  } // end setColumnsClass(

  /**
   * Returns a class attribute string. A default class may be set in the cfc property variables
   * which can be overridden and combined with additional custom classes for an element.
   * @param elType The type of element (eg label, error, prefix, suffix, description, etc)
   * @param attributes The attributes struct used in the constructor (or cf_input custom tag).
   * @return A class attribute string. (eg class="classDefault classOther")
   */
  string function classAttr(required string elType, required struct attributes) {
    var classDefault = attributes.keyExists(elType & 'ClassDefault')
      ? attributes['#elType#ClassDefault']
      : variables['#elType#ClassDefault'] ?: ''

    // If this is a "fullWidth" input, also make the label full width
    if (elType == 'label' && variables.fullWidth) classDefault &= ' sm:col-span-3'

    return 'class="#trim(classDefault & ' ' & (attributes['#elType#Class'] ?: ''))#"'
  }

  string function generateLabelEl(required struct attributes) {
    if (!isDefined('attributes.label')) return ''

    // If label is 'true' (case-sensitive), assume CF is treating it as boolean and remove.
    // Use the compare method to avoid evaluating as a boolean.
    if (!attributes.label.compare('true')) attributes.label = ''

    var labelEl = '<label for="#attributes?.id#" id="#attributes?.id#-label" '
    labelEl &= classAttr('label', attributes)
    labelEl &= '>#attributes.label#</label>'

    return labelEl
  }

  string function generateColorEl(required struct attributes) {
    // If this is a color picker, add a color selector element to show the native color picker
    // When the input is changed, it should update the value of the associated main input
    if (!attributes.keyExists('data-type') || attributes["data-type"] != 'color') return ''

    var pickColor = len(attributes?.value) ? attributes.value : '##888888'

    return '
      <label id="#attributes.id#-color-label"
        for="#attributes.id#-color"
        class="min-w-[30px] border border-l-0 #variables.borderColor# cursor-pointer"
        style="background-color: #pickColor#"
      >
        <input type="color"
          id="#attributes.id#-color"
          class="invisible w-full h-full"
          value="#pickColor#"
        />
      </label>
    '
  }

  string function generateErrorEl(required struct attributes) {
    // Add a blank error element (unless noErrorEl is true) but hide it by default.
    // Error message's ID is based on the input name to use a single error message for a group of inputs
    if (variables.noErrorEl) return ''

    var errorEl = '<div class="min-h-[20px]">'
    errorEl &= '<div '
    errorEl &= classAttr('error', attributes)
    errorEl &= ' id="#attributes?.id#-error"></div>'
    errorEl &= '</div>'

    return errorEl
  }

  /** Returns a prefixEl - must run after generateColorEl */
  string function generatePrefixEl(required struct attributes) {
    if (!len(attributes?.prefix)) return ''

    var prefixFor = attributes?.id
    // If there's a color element, this prefix is used for that instead of the input
    if (len(variables?.colorEl)) prefixFor &= '-color'

    var prefixEl = '<label for="#prefixFor#" '
    prefixEl &= classAttr('prefix', attributes)
    prefixEl &= '>'
    prefixEl &= attributes.prefix
    prefixEl &= '</label>'

    return prefixEl
  }

  string function generateSuffixEl(required struct attributes) {
    if (!len(attributes?.suffix)) return ''

    var suffixEl = '<label for="#attributes.id#" id="#attributes.id#-suffix" '
    suffixEl &= classAttr('suffix', attributes)
    suffixEl &= '>'
    suffixEl &= attributes.suffix
    suffixEl &= '</label>'

    return suffixEl
  }

  string function generateDescriptionEl(required struct attributes) {
    if (!isDefined('attributes.description')) return ''

    var descriptionEl = '<p '
    descriptionEl &= classAttr('description', attributes)
    descriptionEl &= '>'
    descriptionEl &= attributes.description
    descriptionEl &= '</p>'

    return descriptionEl
  }

  /** Returns a string with input element attributes. Must run after labelEl and errorEl are set */
  string function generateAttributesString(required struct attributes) {
    // Merge classDefault and provided class
    var class = listRemoveDuplicates(trim(attributes.classDefault & ' ' & attributes?.class), ' ')

    // Create a string of all the attributes to be added to the HTML
    var attributesString = 'class="#class#"'

    // Add type for tags other than select and textarea that do not require end tag
    if (!listFindNoCase('select,textarea,display', attributes.type)) attributesString &= ' type="#attributes.type#"'

    // Special Attributes get handled separately and do not simply get added to the attributes string
    var booleanAttributes = 'checked,disabled,readonly,required,multiple'
    var specialAttributes = booleanAttributes.listAppend(
      'class,type,error,errorClass,classDefault,labelClassDefault,options,horizontal,description,label,prefix,value'
    )

    // Don't add the value attribute or input-specific for display-only elements
    if (variables.type == 'display') specialAttributes = specialAttributes.listAppend('maxLength,name,placeholder')

    // Handle adding boolean attributes here if they are defined and the value is not falsy
    listEach(booleanAttributes, (attr) => {
      if (attributes.keyExists(attr) && attributes[attr] != false) attributesString &= ' #attr#'
    })

    // Build the string with HTML attributes that we don't specially handle here
    for (attr in attributes) {
      if (listFindNoCase(specialAttributes, attr)) continue;

      // Specify what quotes to use. Use single quotes if the value contains double quotes (e.g., JSON).
      var qu = attributes[attr].find('"') ? "'" : '"'
      attributesString &= (' ' & lCase(attr) & '=' & qu & attributes[attr] & qu)
    }

    // Add the error attribute to the input so we can use it later
    attributesString &= ' data-error-default="#attributes?.error#"'

    // If there's a maxlength attribute, add a data-maxlength attribute
    if (attributes.keyExists('maxLength')) attributesString &= ' data-max-length="#attributes.maxLength#"'

    // Add ARIA attributes. aria-required not needed as we use the required attribute
    if (len(variables.labelEl)) attributesString &= ' aria-labelledby="#variables?.id#-label"'
    if (len(variables.errorEl)) attributesString &= ' aria-describedby="#variables?.id#-error"'

    if (!variables.hasEndTag && attributes.keyExists('value')) {
      var escapedValue = encodeForHTMLAttribute(attributes.value)
      attributesString &= ' value="#escapedValue#"'
    }

    return attributesString
  }

  /** Returns a boolean indicating if the value is likely a valid time */
  boolean function isLikelyTime(required string value) {
    // Value has a colon and is under 6 digits
    if (value.reFindNoCase('^\s*\d{1,2}:\d{2}(:\d{2})?\s*([ap]m?)?$')) return true

    // Value has 'am' or 'pm' and is under 6 digits, eg. 12 am, 6PM
    if (value.reFindNoCase('^\d{1,2} ?[ap]m?$')) return true

    return false
  }

  /** Accepts options in a variety of formats and returns a normalized array of value/label option structs */
  array function normalizeOptions(required any options) {
    // Convert query to array
    if (isQuery(options)) options = Util::toValueLabelArray(options)

    // Convert list to simple array
    if (isSimpleValue(options)) options = listToArray(options)

    return options.map((opt) => {
      // Convert simple values to structs
      if (isSimpleValue(opt)) opt = { value: opt, label: opt }
      if (!opt.keyExists('value')) throw('Option must have a value. Filter out any undefined/NULL values.')
      // If the value is a date (but not a time), convert it to a string (to handle bug with query of dates)
      if (isDate(opt.value) && !isLikelyTime(opt.value)) opt.value = opt.value.format('yyyy-mm-dd')

      // Remove any trailing commas from values
      if (opt.value.len() > 1) opt.value = opt.value.reReplaceNoCase(',$', '')
      // Ensure any option with a value also has a label, if it doesn't already
      if (!opt.keyExists('label')) opt.label = opt.value
      return opt
    })
  }

  /** Returns a container with options for select, radio, or checkbox inputs. Used within start() */
  string function generateOptions(required array options) {
    // Create the input group for all the options
    // Radio buttons get larger rounded corners
    var roundedClass = variables.type == 'radio' ? 'rounded-2xl' : 'rounded-sm'
    var verticalClass = 'mb3 ' & variables.columnsClass & (variables.compact ? '' : ' space-y-1')
    var divClasses = variables.horizontal ? 'shadow-inner #roundedClass# bg-zinc-300/10 flex flex-wrap items-center space-x-0.5' : verticalClass
    var optClasses = variables.horizontal ? 'p-0.5' : 'py-1'
    // Open the group div
    var html = '<div class="sm:col-span-2 #divClasses#">'

    // Loop through options
    var i = 1
    for (var option in options) {
      // Create a unique ID for the input. This presumes the values are unique.
      var optionId = option.keyExists('id') && len(option.id)
        ? option.id
        : variables.id & '-' & i++ & '-' & reReplaceNoCase(option.value, '[^\da-z]', '', 'ALL')

      // Determine if the option is selected
      var checked = variables?.value == option.value || option?.selected == true

      // Support multiple selections for checkboxes
      if (variables.type == 'checkbox' && !checked) {
        // If the value is a list, check if the option value is in the list
        checked = variables.value.listFind(option.value) != 0
      }

      html &= '<div class="#optClasses#">'

      // Create the input
      html &= '<div class="flex #variables.horizontal ? 'items-center' : 'items-start'#">'
      // Note: we are using the same name for all inputs, so for checkboxes, multiple selections
      //  will be submitted as a comma-separated list of values to the server.
      // Also if checkboxes are required, the form will not submit if any are not checked.
      // This is not likely what you'd want - generally use checkboxes where it's okay to not
      // select anything.
      html &= '
        <label
          class="checked-border #variables.type == 'radio' ? 'rounded-full' : ''#"
          for="#optionId#">
            <input
              id="#optionId#"
              #variables.required ? 'required' : ''#
              #variables.disabled ? 'disabled' : ''#
              name="#variables.name#"
              type="#variables.type#"
              value="#option.value#"
              #len(variables?.error) ? 'data-error-default="#variables?.error#"' : ''#
              #checked ? 'checked' : ''#
              class="block transition"
              #len(variables.errorEl) ? 'aria-describedby="#variables?.id#-error"' : ''#
            />
            <span class="checked-label">#option.label#</span>
          </label>'
      html &= '</div>'

      // Extended description, if provided
      if (len(option?.description)) html &= '<div class="mt-0.5 text-sm">#option.description#</div>'
      // End the radio div
      html &= '</div>'
    }

    // End the group div
    html &= '</div>'

    return html
  } // end generateOptions()

  /** Returns the HTML for the start of the input */
  string function start() {
    // First handle single checkboxes and radio inputs
    if ('checkbox,radio'.listFindNoCase(variables.type) && !variables.keyExists('options')) {
      // If the value is truthy, add a checked attribute
      var checked = len(variables?.value) && variables.value != false ? 'checked' : ''

      return variables.labelEl & '
        <div class="my-0.5 sm:mt-0 sm:col-span-2 pt-2">
          <div class="flex">
            <input #(variables.type == 'display' ? 'disabled' : '')# #variables.attributesString# #checked#/>
          </div>
          #variables.descriptionEl#
          #variables.errorEl#
        </div>';
    }

    // Next handle inputs with an end tag (e.g., button, select, textarea)
    if (variables.hasEndTag) {
      var inputContent = variables.type == 'button' ? variables?.value : ''

      return variables.labelEl & '
        <div class="mb-0.5 mt-1 sm:mt-0 #variables.fullWidth == true ? 'sm:col-span-3' : 'sm:col-span-2'#">
        <#variables.type# #variables.attributesString#>#inputContent#'
    }

    // Inputs with no end tag
    var html = variables.labelEl;

    html &= '
      <div class="my-0.5 sm:mt-0 #variables.fullWidth == true ? 'sm:col-span-3' : 'sm:col-span-2'#">
        <div class="flex">'

    var optionsExist = isArray(variables?.options) && variables?.options.len() > 0
    var validType = 'select,radio,checkbox'.listFindNoCase(variables?.type) != 0

    if (optionsExist && validType) html &= generateOptions(variables.options)
    else if (variables.type == 'display') html &= '<span #variables.attributesString#>#variables.value#</span>'
    else html &= '#variables.prefixEl#<input #variables.attributesString# />#variables.colorEl##variables.suffixEl#'

    html &= '
        </div>
        #variables.descriptionEl#
        #variables.errorEl#
      </div>'

    return html
  } // end start()

  /** Returns the HTML for the end of the input with the close tag, if necessary */
  string function end() {
    if (!variables.hasEndTag) return ''

    var html = ''

    if (variables.type == 'textarea') html &= encodeForHTML(variables?.value)

    if (variables.type == 'select') {
      // Note: additional options could be added to the select by adding option tags to the body of the cf_input tag
      // Add an optional blank option if the select
      if (variables.emptyOption) html &= '<option></option>'

      if (isDefined('variables.options')) for (opt in variables.options) {
        html &= '<option
          value="#opt.value#"
          #isDefined('variables.value') && variables.value.listFindNoCase(opt.value) ? 'selected' : ''#
          #opt?.selected == true ? 'selected' : ''#
          >#opt.keyExists('label') ? opt.label : opt.value#</option>'
      }
    }

    html &= '</#variables.type#>'

    if (variables.useMarkdown && variables.disabled == true && server.keyExists('util')) {
      html &= '<div id="#id#-markdown" class="w-full border border-zinc-350 dark:border-zinc-500 min-h-[30px] apps-prose !max-w-none px-1.5 bg-zinc-150 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300 shadow-inner">'
        & server.util.markdownToHTML(variables.value)
        & '</div>'
    }

    html &= variables.descriptionEl
      & variables.errorEl
      & '</div>'

    // Here, there used to be JS injected to initialize EasyMDE. Now it's done in formSetup()
    // that runs in appsHeader. Essentially, you need to run the following JS:
    /*
    if (variables.useMarkdown) html &= '
      <script>
          let editorEnabled = #variables?.disabled == true ? "false" : "true"#
          if (typeof EasyMDE === "function") {
            if (editorEnabled) {
              new EasyMDE({
                element: document.getElementById("#variables.id#"),
                autoDownloadFontAwesome: false,
                forceSync: true,
              })
            }
          } else console.error("EasyMDE is not defined.")
      </script>
    '
    */

    return html
  } // end end()

  /** Returns the HTML for the input */
  string function html() {
    return this.start() & this.end()
  } // end html()

  /** Immediately writes the HTML for the input */
  void function writeOutput() {
    writeOutput(this.html())
  }
}