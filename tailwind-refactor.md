<!-- @format -->

# Tailwind CSS Refactor Plan

This document outlines the plan to refactor this Next.js project from Chakra UI to Tailwind CSS v4.1 (CSS-only configuration).

## General Setup (Tailwind CSS v4.1 - CSS-only)

1.  **Remove Chakra UI**:

    - Uninstall Chakra UI packages: `npm uninstall @chakra-ui/react @emotion/react @emotion/styled framer-motion` (or yarn/pnpm equivalent).
    - Remove any Chakra-specific setup from `next.config.js` if present.

2.  **Install Tailwind CSS**:

    - `npm install -D tailwindcss`

3.  **Create `styles/app.css`**:

    ```css
    @import 'tailwindcss';

    @custom-variant dark (&:where(.dark, .dark *));
    /* Use a fancier :not(.light) selector if you want to use 'light' on a class to override dark mode */
    /* @custom-variant dark (&:where(.dark, .dark *):not(:has(.light), .light *)); */

    @theme {
      /* Define custom theme properties here, e.g., colors, fonts, breakpoints */
      /* We could make it easier to customize colors later by using bespoke 'brand' colors that we can change instead of the default Tailwind colors */
      --color-brand-50: #f7fafc;
      --color-brand-100: #edf2f7;
      /* ... */
      --color-brand-900: #1a365d;

      /* Add other theme customizations (fonts, breakpoints) as needed. */
    }

    @layer base {
      /* Global base styles */
      html {
        /* Default to light mode, Tailwind handles dark via 'dark:' prefix based on parent class */
        @apply h-full;
      }
      body {
        /* Example light mode gradient from _app.js for overscroll background */
        @apply bg-gradient-to-b from-brand-700 from-50% to-brand-100 to-50% text-gray-800 min-h-screen flex flex-col;
        /* Example dark mode background */
        @apply dark:bg-gray-800 dark:text-white;
      }
      #__next {
        @apply flex flex-col flex-grow;
      }
      /* Add other global styles or element defaults here */
    }

    @layer components {
      /* Define component classes here if needed */
    }

    @layer utilities {
      /* Define utility classes here if needed */
    }
    ```

4.  **Import Tailwind CSS**:

    - In `pages/_app.js`, import the CSS file: `import '../styles/app.css';` (adjust path accordingly).

5.  **Dark Mode Setup**:
    - Tailwind CSS uses a class (typically `dark`) on an ancestor element (like `<html>` or `<body>`) to enable dark mode styles (e.g., `dark:bg-black`).
    - You will need to implement a mechanism to toggle this class. A library like `next-themes` is recommended:
      - Install `next-themes`: `npm install next-themes`
      - Wrap your application in `pages/_app.js` with `<ThemeProvider attribute="class">`.
      - Create a component to toggle the theme (e.g., a button that calls `setTheme('light')` or `setTheme('dark')` from `useTheme()`).

## File-by-File Refactoring Analysis

### 1. `pages/_app.js`

- **Chakra UI Usage**:

  - `ChakraProvider`: Wraps the entire application.
  - `extendTheme`: Custom fonts (`system-ui`), colors (`brand` palette), initial color mode, global styles for `html`, `body`, `#__next` (including a distinctive split background gradient for body in light mode).
  - `ColorModeScript`, `useColorMode`, `useColorModeValue`: For theme (dark/light mode) management.
  - `Flex`, `Box`: Basic layout.
  - `ThemeColorMetaUpdater`: Custom component to update `theme-color` meta tag based on Chakra's color mode.

- **Refactoring Notes**:

  - Remove `ChakraProvider`, `ColorModeScript`, and all Chakra imports.
  - Implement Tailwind setup as described in "General Setup".
  - **Color Mode**:
    - Replace Chakra's color mode with `next-themes` or a similar solution.
    - Adapt `ThemeColorMetaUpdater` to use the new theme context (e.g., `useTheme()` from `next-themes`) to get the current mode and set the `theme-color` meta tag appropriately. The colors for the meta tag (`#1A202C` for dark, `#2b6cb0` for light) should be translated to your Tailwind color palette if they differ.
  - **Layout Components**:
    - Convert Chakra `Flex` and `Box` components to `div` or semantic HTML elements with Tailwind utility classes.
      - Outer `Flex` -> `<div className="flex flex-col flex-1 min-h-0">`
      - `Box as={PWAViewportAdjuster}` -> `<PWAViewportAdjuster className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-white dark:bg-gray-900" ...>` (background will be dynamic).
      - Inner `Box` (page wrapper) -> `<div className="flex-1 min-h-0">`
  - **Custom Theme**:
    - Transfer `brand` colors to the `@theme` block in `app.css`.
    - Tailwind's default sans-serif stack includes `system-ui`, so explicit font declarations might not be needed unless further customization is desired.
  - **Global Styles**:
    - Translate global styles for `html`, `body`, `#__next` to `@apply` directives in `app.css` under `@layer base`.
    - The light mode body background: `bg-gradient-to-b from-brand-700 from-50% to-brand-100 to-50%`.
    - The dark mode body background: `dark:bg-gray-800`.
    - The HTML background: `dark:bg-gray-800` (if dark is the default or toggled), or a light equivalent like `bg-gray-100`. The original was `props.colorMode === 'dark' ? '#1A202C' : '#1A202C'`, which implies it was always dark (`#1A202C`). This needs clarification for Tailwind, perhaps `bg-gray-800` for html.

- **Potential Pitfalls**:

  - **Dark Mode Implementation**: Ensuring `next-themes` (or chosen solution) is correctly configured and all components respond as expected.
  - **PWA Component Refactoring**: `PWATopBar`, `PWABottomNav`, `PWAViewportAdjuster`, `BottomOverscrollElement` will need their internal Chakra UI dependencies removed and styles refactored to Tailwind. This file primarily deals with their structural layout.
  - **Gradient Background**: Accurately replicating the split gradient for the `body` in light mode. The `from-50%` and `to-50%` classes for gradients will achieve this sharp split.
  - **Specificity**: Careful management of global styles vs. component styles.

- **Non-trivial components to recreate/adapt**:
  - The color mode switching logic and state management (likely using `next-themes`).
  - `ThemeColorMetaUpdater` to work with the new theme system.

### 2. `components/Header.js`

- **Chakra UI Usage**:

  - Layout: `Box`, `Flex`, `Spacer`
  - Typography: `Heading`
  - Interactive Elements: `Link` (used with NextLink), `Button`, `IconButton`
  - Icons: `MoonIcon`, `SunIcon`, `HamburgerIcon` from `@chakra-ui/icons`
  - Color Mode: `useColorMode`, `useColorModeValue` for `bgColor`, `buttonHoverBg`
  - Mobile Drawer: `Drawer`, `DrawerOverlay`, `DrawerContent`, `DrawerCloseButton`, `DrawerHeader`, `DrawerBody`, `useDisclosure`
  - Styling Props: `bg`, `color`, `px`, `py`, `boxShadow`, `size`, `_hover`, `variant`, `display` (for responsive show/hide), `gap`, `align`, `maxW`, `mx`, `mr`, `sx` (for conditional active link styling)

- **Refactoring Notes**:

  - **Overall Structure**:
    - Replace `<Box as=\"header\">` with `<header className=\"bg-brand-700 dark:bg-gray-800 text-white px-4 py-2 shadow-md\">`. (Colors will depend on the new theme system)
    - Replace outer `<Flex align=\"center\" maxW=\"1200px\" mx=\"auto\">` with `<div className=\"flex items-center max-w-6xl mx-auto\">`. (Tailwind's `max-w-6xl` is `1152px`, `max-w-7xl` is `1280px`; pick closest or define custom max-width in `@theme`)
  - **Logo/Brand**:
    - Replace `<Heading as=\"h1\" size=\"lg\">` with `<h1 className=\"text-2xl font-semibold\">` (or adjust size as needed, e.g., `text-xl`). The SVG logo itself remains.
    - Chakra `Link` with `_hover={{ textDecoration: 'none' }}` becomes an `<a>` tag with `className=\"hover:no-underline flex items-center gap-3\"`
  - **Desktop Navigation**:
    - Replace `<Flex gap={4} align=\"center\" display={{ base: 'none', md: 'flex' }}>` with `<nav className=\"hidden md:flex items-center gap-4 ml-auto\">` (using `ml-auto` to push nav right, replacing `Spacer`)
    - Chakra `Button` components used as links will become `<a>` tags styled as buttons:
      - `variant=\"ghost\"` and `_hover={{ bg: buttonHoverBg }}`: Translate to Tailwind classes like `bg-transparent hover:bg-brand-600 dark:hover:bg-gray-700 rounded px-3 py-2 transition-colors`
      - `color=\"white\"` is inherited from the header's text color
      - Conditional active styling `sx={currentPath === '...' ? { bg: 'whiteAlpha.300' } : {}}`: This translates to dynamic classes, e.g., `className={\`px-3 py-2 rounded transition-colors \${currentPath === '/' ? 'bg-white/30' : 'hover:bg-brand-600 dark:hover:bg-gray-700'}\`}`
  - **Color Mode Toggle**:
    - `IconButton` becomes a `<button>` styled with Tailwind
    - `useColorMode` and `toggleColorMode` replaced by `useTheme()` from `next-themes` (e.g., `const { theme, setTheme } = useTheme()`)
    - Icons: Replace Chakra icons (`MoonIcon`, `SunIcon`) with appropriate SVGs (e.g., from Heroicons, Feather Icons, or custom)
      ```html
      <button
        type="button"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="p-2 rounded-md hover:bg-brand-600 dark:hover:bg-gray-700 transition-colors"
      >
        {/* Conditional SVG rendering based on theme */}
        {theme === 'light' ? <MoonSVGIcon className="h-5 w-5" /> : <SunSVGIcon className="h-5 w-5" />}
      </button>
      ```
  - **Mobile Navigation (Hamburger & Drawer)**:
    - Outer `<Flex display={{ base: 'flex', md: 'none' }}>` becomes `<div className=\"flex md:hidden items-center ml-auto\">` (if Spacer was before it, otherwise adjust)
    - Hamburger `IconButton`: A `<button>` with an SVG hamburger icon. `onClick={onOpen}` will toggle state for the drawer
    - **Drawer**: This is a complex component
      - Chakra's `Drawer`, `DrawerOverlay`, `DrawerContent`, etc. provide built-in accessibility and transition features
      - **Recommendation**: Use a library like Headless UI (`@headlessui/react`) for its `Dialog` (modal) component, which can be styled with Tailwind to function as a drawer. This handles accessibility (focus trapping, ARIA attributes) and transitions
      - If building manually (not recommended for drawers due to complexity):
        - Manage `isOpen` state (e.g., `useState`)
        - Overlay: `<div className=\"fixed inset-0 bg-black/50 z-40\" />` (conditional render)
        - Drawer Panel: `<div className=\"fixed top-0 right-0 h-full w-3/4 max-w-sm bg-brand-700 dark:bg-gray-800 text-white p-4 shadow-xl z-50 transform transition-transform ease-in-out duration-300 {isOpen ? 'translate-x-0' : 'translate-x-full'}\">` (adjust width, background, add padding for safe areas `pt-safe-top pr-safe-right pb-safe-bottom pl-safe-left` if needed and supported, or use manual padding)
        - `DrawerCloseButton`: `<button>` with an "X" SVG icon, positioned absolutely or at the top
        - `DrawerHeader`, `DrawerBody`: `divs` with appropriate padding/styling
        - Navigation links inside the drawer: Similar to desktop, styled vertically. Add `onClick={closeDrawerHandler}` to each link
      - The PWA safe area paddings (`pt=\"env(safe-area-inset-top, 0)\"`, etc.) can be handled by adding Tailwind utility classes for padding if Headless UI doesn't manage this, or by directly using `env()` in CSS if necessary
  - **SVG Icons**: Source `MoonIcon`, `SunIcon`, `HamburgerIcon` as SVGs. For example, from `heroicons`

- **Potential Pitfalls**:

  - **Drawer Implementation**: Recreating an accessible and animated drawer is complex. Headless UI is highly recommended
  - **Icon Sourcing/Styling**: Ensuring SVG icons are correctly sized and colored
  - **Responsive Breakpoints**: Aligning Chakra's `base`, `md` breakpoints with Tailwind's defaults (`sm`, `md`, `lg`, etc.) or custom breakpoints
  - **Active Link State**: Robustly handling active link styling across desktop and mobile navigation using `router.pathname` and conditional classes

- **Non-trivial components to recreate/adapt**:
  - **Drawer Menu**: This is the most significant. Includes overlay, content panel, open/close state, animations, accessibility features (Strongly suggest Headless UI `Dialog`)
  - **Color Mode Toggle Button**: Integrating with `next-themes` and using SVG icons

### 3. `components/ImageSearchModal.js`

- **Chakra UI Usage**:

  - Relies on `BaseModal` for the fundamental modal structure.
  - Layout: `Box`, `Flex`, `VStack`, `HStack`, `Center`, `Grid`, `AspectRatio`, `Spacer`.
  - Interactive: `Button` (with `isLoading`, `isDisabled`, `colorScheme`, `variant`).
  - Feedback: `Alert`, `AlertIcon`, `Spinner`, `Badge`.
  - Text: `Text`, `Heading`.
  - Media: `Image` (with `fallback`, `objectFit`).
  - Links: `Link` (with `isExternal`).
  - Theming: `useColorModeValue` for dynamic colors (`borderColor`, `textColorSecondary`, `cardBg`, `linkColor`, `placeholderBg`).
  - Styling Props: Extensive use of responsive and direct styling props (`spacing`, `p`, `borderRadius`, `borderWidth`, `flexGrow`, `maxH`, `w`, etc.).

- **Refactoring Notes**:

  - **Modal Foundation (`BaseModal`)**: This is the core dependency. `ImageSearchModal`'s refactor depends heavily on `BaseModal` being refactored to an accessible solution, ideally Headless UI's `Dialog` component styled with Tailwind.
    - Props like `isOpen`, `onClose`, `title`, `scrollBehavior=\\"inside\\\"` from `BaseModal` will map to Headless UI `Dialog` features. `scrollBehavior=\\"inside\\\"` means the `Dialog.Panel` should have `overflow-y-auto` and a constrained `max-h` (e.g., `max-h-[80vh]`).
  - **Layout Conversion**:
    - Replace Chakra layout components (`VStack`, `Box`, etc.) with `div`s and Tailwind utilities (flexbox, grid, spacing, padding, margins).
      - `VStack spacing={4}` -> `<div class=\\\"flex flex-col space-y-4\\\">`
      - `HStack spacing={2}` -> `<div class=\\\"flex space-x-2\\\">`
      - `Grid templateColumns={{ base: \'1fr\', sm: \'100px 1fr\' }} gap={4}` -> `<div class=\\\"grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-4\\\">`
      - `Center` -> `<div class=\\\"flex items-center justify-center\\\">`
  - **Buttons (`<Button>`)**:
    - Convert to HTML `<button>` elements styled with Tailwind. Create base button styles and variants for different `colorScheme` (e.g., `blue`, `green`) and `variant` (`outline`).
    - `isLoading`: Conditionally render an SVG spinner inside the button and apply `disabled:opacity-75 cursor-not-allowed`. The button text could be hidden or replaced during loading.
    - `isDisabled`: Apply `disabled:opacity-75 cursor-not-allowed` and the HTML `disabled` attribute.
  - **Alerts (`<Alert>`)**:
    - Replace with `div`s styled for alerts (background, border, text color, icon). E.g., `status=\\\"error\\\"` -> `bg-red-100 border-red-400 text-red-700 p-4 rounded-md flex items-center`. Add an SVG icon.
    - `status=\\\"warning\\\"` -> Similar, with yellow/amber colors.
  - **Spinner (`<Spinner>`)**:
    - Replace with an SVG loading spinner. Many free options are available (e.g., from `heroicons` or custom animated SVGs).
  - **Image (`<Image>`)**:
    - Convert to `<img>` tag. Tailwind utilities for `object-contain`, `rounded-md`, `max-h- [...]`, `max-w-full`, `border`.
    - `fallback` behavior: This is custom. Use the `onError` attribute on the `<img>` tag. If the image fails to load, `onError` can trigger a state change to render a placeholder `div` (e.g., with a background color, an icon, or a spinner).
  - **Badge (`<Badge>`)**:
    - Convert to `<span>` styled with Tailwind (e.g., `bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full`).
  - **Text & Heading**: Convert to `p`, `span`, `h1`-`h6` with Tailwind typography utilities.
  - **Links (`<Link>`)**: Convert to `<a>` tags. `isExternal` implies `target=\\\"_blank\\\" rel=\\\"noopener noreferrer\\\"`. Style with Tailwind (e.g., `text-blue-600 hover:underline dark:text-blue-400`).
  - **Color Mode Values (`useColorModeValue`)**: Replace with dynamic class application based on the `next-themes` hook (e.g., `className={\`\${theme === \'dark\' ? \'border-gray-600\' : \'border-gray-200\'}\`}`).
  - **Camera View & File Input**: `<video>`, `<canvas>`, and `<input type=\\\"file\\\">` are standard HTML. Their associated JavaScript logic for camera access, image capture, and file handling remains. Style the visible parts (like the video feed container) with Tailwind. The `borderRadius: \'var(--chakra-radii-md)\'` becomes `rounded-md` on the video element\'s container or directly if possible.
  - **Stateful Logic**: All existing React state management (`useState`, `useEffect`, event handlers like `handleSubmit`, `handleFileChange`, `takePicture`) will remain largely the same, as it dictates the component\'s behavior rather than its appearance tied to Chakra components.

- **Potential Pitfalls**:

  - **`BaseModal` Refactor**: The success of this component's refactor is critically tied to how `BaseModal` is handled. If `BaseModal` isn't converted to an accessible and functional Tailwind-based modal (e.g., using Headless UI `Dialog`), `ImageSearchModal` will inherit problems.
  - **Image Fallback Logic**: Implementing a clean image fallback in React requires careful state management or a custom component/hook.
  - **Button Loading/Disabled States**: Ensuring these states are visually clear and correctly prevent interaction.
  - **Responsive Design**: Translating Chakra's responsive props (e.g., `maxH={{ base: \'75vh\', md: \'600px\' }}`) to Tailwind's responsive prefixes (`max-h-[75vh] md:max-h-[600px]`).
  - **Accessibility of Camera/Upload UI**: Ensuring custom controls for camera and upload are keyboard accessible and have proper ARIA attributes if not using standard browser elements directly for interaction.

- **Non-trivial components to recreate/adapt**:
  - **The entire modal presentation layer**: This is effectively recreating the UI within the (to be refactored) `BaseModal`. This includes all the conditional UI states (API status, error, loading, camera active, preview, results).
  - **Custom `Image` component with fallback behavior**.
  - **Visually distinct button states** for loading and disabled states, incorporating spinners.
  - The **results display section** with its grid layout and combination of text, images, and badges.

### 4. `components/BaseModal.js`

- **Chakra UI Usage**:

  - Core Modal Components: `Modal`, `ModalOverlay`, `ModalContent`, `ModalHeader`, `ModalBody`, `ModalCloseButton`.
  - Theming: `useColorModeValue` for `modalBg`, `headerBg`, `borderColor`.
  - Props: `isOpen`, `onClose`, `title`, `children`, `size`, `scrollBehavior=\"inside\"`, `motionPreset=\"slideInBottom\".
  - Styling: `maxW`, `maxH`, `mx`, `mt`, `mb`, `borderRadius`, `boxShadow`, `bg`, `borderColor`, `borderWidth`, `overflow`, `pb`, `pt`, `px`, `top`, `right`.
  - Custom Logic: `useEffect` to set a CSS custom property (`--modal-vertical-clearance`) for PWA vertical spacing, used with `env(safe-area-inset-*)` for responsive and PWA-aware sizing and margins.

- **Refactoring Notes (using Headless UI `@headlessui/react`)**:

  - **Core Replacement**: Replace Chakra `Modal*` components with Headless UI `Dialog`, `Dialog.Panel`, `Dialog.Title`, and `Transition`. Install `@headlessui/react`.
  - **Structure with Headless UI**:

    ```jsx
    import { Dialog, Transition } from '@headlessui/react'
    import { Fragment, useEffect, useRef } from 'react'
    // Import an SVG close icon (e.g., XMarkIcon from heroicons)
    const BaseModal = ({ isOpen, onClose, title, children, size = 'xl' }) => {
      // const { theme } = useTheme(); // From next-themes for dark mode classes
      // const modalBg = theme === 'dark' ? 'dark:bg-gray-800' : 'bg-white';
      // const headerBg = theme === 'dark' ? 'dark:bg-gray-700' : 'bg-gray-50';
      // const borderColor = theme === 'dark' ? 'dark:border-gray-600' : 'border-gray-200';

      const initialFocusRef = useRef(null) // For focusing an element inside the modal

      // PWA vertical clearance logic (can remain similar)
      useEffect(() => {
        const pwaClearance = '80px'
        const defaultClearance = '60px'
        if (isOpen) {
          const isPwaMode = window.matchMedia('(display-mode: standalone)').matches
          document.documentElement.style.setProperty(
            '--modal-vertical-clearance',
            isPwaMode ? pwaClearance : defaultClearance
          )
        } else {
          // Reset when closed
          document.documentElement.style.setProperty('--modal-vertical-clearance', defaultClearance)
        }
        return () => document.documentElement.style.setProperty('--modal-vertical-clearance', defaultClearance)
      }, [isOpen])

      // Determine max-width based on size prop (example)
      let maxWidthClass = 'lg:max-w-[850px]' // Default from existing code for 'xl' or general use
      if (size === 'sm') maxWidthClass = 'max-w-sm'
      else if (size === 'md') maxWidthClass = 'max-w-md'
      else if (size === 'lg') maxWidthClass = 'max-w-lg'
      else if (size === '2xl') maxWidthClass = 'max-w-2xl'
      // Add more sizes as needed, or use the existing explicit maxW values

      return (
        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={onClose} initialFocus={initialFocusRef}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/40 dark:bg-black/60" aria-hidden="true" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-10 sm:translate-y-0 sm:scale-95" // Slide from bottom / scale up
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-10 sm:translate-y-0 sm:scale-95" // Slide to bottom / scale down
                >
                  <Dialog.Panel
                    className={`w-full ${maxWidthClass} max-w-[95%] md:max-w-[85%] transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-left align-middle shadow-xl transition-all`}
                    style={{
                      maxHeight:
                        'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - var(--modal-vertical-clearance, 60px))',
                      marginTop: 'calc(env(safe-area-inset-top) + (var(--modal-vertical-clearance, 60px) / 3)) ', // Adjusted margin for centering effect with clearance
                      marginBottom: 'calc(env(safe-area-inset-bottom) + (var(--modal-vertical-clearance, 60px) / 3))',
                      // Note: For non-base (md, lg), style might need to be adjusted if env() vars are not desired
                      // e.g., by setting different --modal-vertical-clearance for md+ or by JS style adjustment
                    }}
                  >
                    <div className="flex items-center justify-between py-3 px-4 md:py-4 md:px-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                        ref={initialFocusRef}
                      >
                        {title}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="p-1 rounded-md text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close</span>
                        {/* <XMarkIcon className="h-6 w-6" aria-hidden="true" /> */}
                      </button>
                    </div>
                    <div
                      className="p-4 md:p-6 overflow-y-auto"
                      style={{ maxHeight: 'calc(100% - 60px)' /* Approx header height */ }}
                    >
                      {' '}
                      {/* Ensure body scrolls if content overflows panel */}
                      {children}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )
    }
    ```

  - **Theming**: Apply Tailwind dark mode classes (`dark:bg-gray-800`, etc.) based on `next-themes`.
  - **Sizing (`size` prop & `maxW`)**: Translate Chakra's `size` or direct `maxW` to Tailwind's `max-w-*` utility classes on `Dialog.Panel`. The example uses `max-w-[95%] md:max-w-[85%] lg:max-w-[850px]` from the original code.
  - **Transitions (`motionPreset`)**: Use Headless UI `Transition.Child` props (`enterFrom`, `enterTo`, etc.) to replicate `slideInBottom` (e.g., by translating Y). The example shows a combination of opacity and scale/translate.
  - **PWA Clearance & Safe Areas**: The `useEffect` for `--modal-vertical-clearance` can remain. Apply `maxHeight`, `marginTop`, `marginBottom` using this variable and `env(safe-area-inset-*)` via inline styles on `Dialog.Panel`. This is the most complex styling part to get right cross-platform.
    - It might be necessary to have different style objects or classes applied via JS for base vs. md/lg breakpoints if the `env()` variables are not desired or behave differently on larger screens for margin calculations.
  - **Modal Close Button**: A styled `<button>` with an SVG icon and `sr-only` text, using `onClick={onClose}`.
  - **Scrolling (`scrollBehavior=\"inside\"`)**: Achieved by `overflow-y-auto` on the main `Dialog.Panel` (due to its `maxHeight`) or on the inner content body div, along with a `maxHeight` on that body (e.g., `style={{ maxHeight: 'calc(100% - HEADER_HEIGHT)' }}`). Headless UI's examples usually make the panel itself scrollable.
  - **Initial Focus**: Use `initialFocus` prop on `Dialog` pointing to a `useRef` on an element like `Dialog.Title` or the first focusable element for accessibility.

- **Potential Pitfalls**:

  - **Complex Sizing/Margin Logic**: The dynamic `maxHeight`, `marginTop`, `marginBottom` using CSS variables and `env()` for safe areas is tricky. Requires careful testing on different devices, PWA mode, and standalone browser.
  - **Headless UI Nuances**: Correctly implementing `Dialog` and `Transition` for accessibility (especially focus trapping, which `Dialog` handles) and smooth animations.
  - **Transition Animations**: Replicating `slideInBottom` precisely or creating a new pleasant transition.
  - **CSS Custom Property Scope**: Ensuring `--modal-vertical-clearance` is set and cleared correctly and doesn't interfere if multiple modals were theoretically possible (though usually not the case).

- **Non-trivial components to recreate/adapt**:
  - **The entire modal shell**: Replacing Chakra components with Headless UI and Tailwind, including overlay, panel, header, body, and close button.
  - **The dynamic styling for PWA safe areas and vertical clearance**: This is the most challenging part and will likely involve inline styles on the `Dialog.Panel`. It may require JavaScript to adjust styles based on breakpoints if CSS alone is insufficient for the `env()` and `var()` calculations across different screen sizes for the margin properties specifically.
  - **Accessible custom close button**.

### 5. `components/PartDetailModal.js`

- **Chakra UI Usage**:

  - Relies on `BaseModal` for the overall modal window.
  - Uses `Box`, `Spinner`, `Text` for the loading state.
  - Uses `Alert`, `AlertIcon` for displaying errors.
  - Delegates the actual content rendering to the `PartDetail` component.

- **Refactoring Notes**:

  - **Modal Foundation**: Will use the refactored `BaseModal` (Headless UI `Dialog` + Tailwind).
  - **Loading State**:
    - `<Box textAlign=\"center\" p={8}>` -> `<div className=\"text-center p-8\">`
    - Chakra `Spinner` -> Custom SVG spinner.
    - Chakra `Text` -> `<p className=\"mt-4 font-medium\">Loading part details...</p>`
  - **Error State**:
    - Chakra `Alert status=\"error\"` -> `<div className=\"flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400\" role=\"alert\">` (Example Tailwind alert styling). Include an SVG error icon.
    - **Content Display**: The `PartDetail` component (`<PartDetail part={part} ... />`) is rendered. This means `PartDetail.js` must also be refactored from Chakra to Tailwind.
    - **Data Fetching Logic**: The `useEffect` hook and associated state (`part`, `isLoading`, `error`) are not tied to Chakra UI and will remain as is.

- **Potential Pitfalls**:

  - Heavy dependency on the successful refactor of both `BaseModal.js` and `PartDetail.js`.
  - Ensuring the loading and error states are visually clear and consistent with the new Tailwind design.

- **Non-trivial components to recreate/adapt**:
  - The visual representation of the loading state (spinner, text layout).
  - The visual representation of the error state (alert box, icon, text layout).
  - The content itself is deferred to `PartDetail.js`.

### 6. `components/PartDetail.js`

- **Chakra UI Usage**:

  - Layout: `Box`, `Flex`, `VStack`, `HStack`.
  - Typography: `Heading`, `Text`.
  - Data Display: `Badge` (interactive for categories/alternates), `Divider`.
  - Media: `Image` (with a custom WebP->PNG fallback, and a further fallback to text ID).
  - Feedback: `Spinner`, `Alert`, `AlertIcon` (for its own loading/error states).
  - Theming: `useColorModeValue` for backgrounds, borders, text colors.
  - Styling Props: Extensive use for layout, appearance, and responsiveness (`p`, `borderRadius`, `boxShadow`, `_hover`, `minW`, `colorScheme`, etc.).
  - Responsive Design: Conditional styling for layout (`direction={{ base: 'column', md: 'row' }}`) and padding (`p={isInModal ? { base: 0, md: 4 } : 5}`).

- **Refactoring Notes**:

  - **Outer Container (`<Box>`)**: Convert to `div`. Conditional styling (shadows, borders, radius, padding) based on `isInModal` prop will be applied via dynamic Tailwind classes.
    - `bg={bgColor}` -> `bg-white dark:bg-gray-800`.
    - `borderColor={borderColor}` -> `border-gray-200 dark:border-gray-700`.
  - **Main Layout (`<Flex>`)**: Convert `Flex` to `<div className=\"flex flex-col md:flex-row gap-4 md:gap-6 items-start\">`.
  - **Image Section**:
    - Image container `Box`: `<div className=\"border rounded-md bg-white h-[300px] flex items-center justify-center overflow-hidden min-w-full md:min-w-[300px] max-w-full md:max-w-[300px] mx-auto md:mx-0\">`.
    - Chakra `Image` -> `<img>`. Translate props like `maxHeight`, `objectFit`, `padding` to Tailwind classes.
    - `onError={handleImageError}` (WebP->PNG logic) remains.
    - The final text ID fallback (Chakra `Text` within `fallback` prop): This needs custom React state. Example: `const [showImageFallbackText, setShowImageFallbackText] = useState(false);` Set this to true in `handleImageError` if `imageSrc` is already PNG. Then render `<img>` or `<div className=\"text-xl text-gray-500\">{part.id}</div>` conditionally.
  - **Text Content & Headings**: Convert `Heading`, `Text` to semantic HTML (`hX`, `p`, `span`) with Tailwind typography utilities (`text-lg`, `font-semibold`, `text-gray-600 dark:text-gray-300`, etc.).
  - **Badges (`<Badge>`)**:
    - Convert to `<span>` or `<button>`/`<a>` (if interactive) styled with Tailwind. E.g., `className=\"px-2 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800\"`.
    - Different `colorScheme` map to different Tailwind background/text color utility combos.
    - For interactive badges (categories, alternate IDs): Use `<button type=\"button\" ...>` or `<a>` styled as badges. Replicate `_hover` styles with `hover:bg-gray-200 dark:hover:bg-gray-600`, etc. Ensure they are keyboard accessible.
  - **Divider (`<Divider>`)**: Replace with `<hr className=\"my-4 border-gray-200 dark:border-gray-700\" />`.
  - **Category Path (Breadcrumbs)**: The mapping logic remains. Convert Chakra `Flex`, `Text`, `Badge` to `div`, `span`, and styled button/span elements. The \"›\" separator will be a simple `<span>›</span>`.
  - **`dangerouslySetInnerHTML`**: Remains on a `div` or `p` for `part.description`. Consider implications if styling is needed for this content.
  - **Loading/Error States**: If these remain in `PartDetail` (for standalone use):
    - Loading: `div` with SVG spinner and `p` tag, similar to `PartDetailModal`.
    - Error/Not Found: `div` styled as an alert with SVG icon and text, similar to `PartDetailModal`.
  - **Color Mode Values (`useColorModeValue`)**: Replace with conditional classes based on `next-themes` hook (e.g., `text-gray-600 dark:text-gray-400`).

- **Potential Pitfalls**:

  - **Image Fallback Complexity**: Implementing the multi-step image fallback (WebP -> PNG -> Text ID) correctly using React state and `onError`.
  - **Interactive Badges**: Ensuring clickable badges for categories and alternate IDs are accessible (focusable, keyboard operable) and visually distinct on hover/focus.
  - **Styling `dangerouslySetInnerHTML` Content**: Content injected this way will not pick up Tailwind classes on its internal elements unless global styles target them.
  - **Responsive Layout**: Accurately translating Chakra's responsive props like `direction`, `minW`, `maxW`, `p` into Tailwind's responsive prefix classes (`md:`, `lg:`, etc.).
  - **Clarity on Loading/Error States**: Deciding if `PartDetail` should manage its own loading/error UI or if it will always be handled by a parent like `PartDetailModal`. If the latter, these can be removed from `PartDetail`.

- **Non-trivial components/logic to recreate/adapt**:
  - **Image display with the three-stage fallback mechanism** (WebP -> PNG -> Text ID).
  - **Interactive badge elements** for navigation (categories, alternate parts), including hover states and click handlers.
  - **Breadcrumb display for category hierarchy**.
  - The overall responsive two-column layout with specific min/max widths for the image column.

### 7. `components/PartCard.js`

- **Chakra UI Usage**:

  - Main Structure: `Card`, `CardBody`.
  - Layout: `Box`, `Flex`, `Stack`.
  - Typography: `Heading`, `Text` (with `noOfLines`).
  - Media: `Image` (with WebP->PNG fallback, and `Icon` for SVG fallback), `Icon` for custom SVGs.
  - Interactive: `Button` (ghost variant, `isLoading`, `loadingText`), `useToast`. (No `Checkbox` is directly rendered in the card for selection).
  - Theming: `useColorModeValue` for many dynamic colors, `useTheme` to access `colors.brand[700]`.
  - Custom Component: `PillContainer` for displaying category pills.
  - Styling Props: Extensive for appearance, layout, and interaction (`boxShadow`, `_hover`, `borderColor`, `bg`, `noOfLines`, etc.).

- **Refactoring Notes**:

  - **Outer Card (`Card`, `CardBody`)**: Replace with a single `div` styled with Tailwind utilities for border, shadow, background (conditional on `isSelected`), rounded corners, hover effects, etc.
    - `bg={isSelected ? cardSelectedBg : cardBg}` -> Dynamic classes like `className={\`{\${isSelected ? 'bg-blue-50 dark:bg-blue-900' : 'bg-white dark:bg-gray-700'}} border {\${isSelected ? 'border-blue-400' : 'border-gray-200 dark:border-gray-600'}} ...hover:shadow-md transition-all duration-200 rounded-md overflow-hidden relative w-full min-h-[150px]\`}`
  - **Layout**: Convert `Flex`, `Stack` to `div`s with Tailwind flexbox (`flex`, `flex-row`, `gap-3`, `flex-1`, `space-y-1`, etc.)
  - **Image Section**:
    - Clickable image container (`Flex as=\"a\"`): Convert to `<a>` with `onClick={handlePartClick}` and Tailwind classes for sizing, flex centering, border, background, cursor.
    - Chakra `Image` -> `<img>`. WebP->PNG fallback logic (`imageSrc` state, `handleImageError`) remains.
    - Chakra `Icon as={BrickIcon}` for image fallback -> Render the custom `<BrickIcon />` SVG directly, styled with Tailwind (e.g., `className=\"h-10 w-10 text-gray-400 dark:text-gray-500\"`)
  - **Part ID & Name (Clickable)**:
    - `Heading as=\"a\"`, `Text as=\"a\"`: Convert to `<a>` tags styled with Tailwind for font, color, hover underline, and click handler (`handlePartClick`)
    - `noOfLines` for truncation: For a CSS-only Tailwind v4 setup, achieving multi-line truncation typically requires the `@tailwindcss/line-clamp` plugin. If not using a config file to add plugins, you might need to define line-clamp utilities in your CSS file\'s `@layer utilities` or use a simpler fixed height with `overflow-hidden` and `text-ellipsis` for single lines.
  - **Category Text**: Convert `Text` to `p` or `span` with Tailwind text utilities.
  - **PillContainer**: This is a custom child component. It will also need refactoring if it uses Chakra internally. The `color={colors.brand[700]}` prop suggests it might need to be adapted to accept Tailwind class names or configured to use Tailwind\'s theme system if it accesses theme values directly.
  - **Download Buttons**:
    - Chakra `Button` -> `<button>` with Tailwind styles. `variant=\"ghost\"` -> `bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1`
    - `isLoading`, `loadingText`: Implement by conditionally rendering text or an SVG spinner within the button and applying `disabled:opacity-50`
    - `Icon as={DownloadIcon}` -> Render `<DownloadIcon />` (custom SVG) within the button.
  - **Toast Notifications (`useToast`)**: Chakra `useToast` must be replaced. Consider a library like `react-hot-toast` or a simple custom solution. Update all `toast(...)` calls.
  - **SVG Icons (`BrickIcon`, `DownloadIcon`)**: These are already defined as React components returning SVGs. They can be used directly. Style them via `className` if needed (e.g., `h-4 w-4 mr-1`).
  - **Color Mode Values (`useColorModeValue`)**: Replace with conditional Tailwind classes based on `next-themes` (e.g., `className={\`text-gray-800 dark:text-gray-100\`}`)

- **Potential Pitfalls**:

  - **Toast Replacement**: Selecting, installing, and integrating a new toast library, and updating all call sites.
  - **Line Clamping**: Achieving robust multi-line text truncation without the official line-clamp plugin can be tricky. A CSS-only solution might involve defining custom utilities.
  - **`PillContainer` Integration**: Ensuring `PillContainer` is refactored and can accept styling information in a Tailwind-friendly way (e.g., passing Tailwind classes as props or it using theme values correctly).
  - **Clickable Area Overlaps**: With multiple nested clickable elements (card, image, title, buttons, pills), ensure event propagation (`e.stopPropagation()`) is correctly used to prevent unintended actions.
  - **Button Loading States**: Implementing clear visual feedback for buttons in loading state (spinner, text change, disabled appearance).

- **Non-trivial components/logic to recreate/adapt**:
  - **A new toast notification system/integration**.
  - **Line-clamping solution** for text if multi-line is required and the plugin isn\'t used.
  - **Visual states for download buttons** (idle, loading).
  - **The image display with its two-stage fallback** (WebP -> PNG -> SVG Icon).
  - The card\'s selected state styling.

### 8. `components/SearchBar.js`

- **Chakra UI Usage**:

  - Layout: `Box`, `Flex`.
  - Form Elements: `Input`, `InputGroup`, `InputLeftElement`, `InputRightElement` (for text input with icons), `Select` (for category dropdown), `Button` (for submit), `IconButton` (for clear search), `Link` (as a button for image search).
  - Icons: `Icon as={SearchIcon}` (custom SVG component), inline SVGs for clear button and image search link.
  - Theming: `useColorModeValue` for link colors.
  - Styling Props: `width`, `gap`, `size=\"lg\"`, `borderRadius`, `colorScheme`, responsive props for layout.

- **Refactoring Notes**:

  - **Overall Form Structure**: The `<form>` and outer `Box` (now `div`) remain. `Flex` layouts become `div`s with Tailwind flex utilities.
    - `Flex direction={{ base: 'column', md: 'row' }} gap={2} align=\"flex-end\" wrap=\"wrap\"` -> `<div className=\"flex flex-col md:flex-row gap-2 items-end flex-wrap\">`
  - **Search Input Field (`InputGroup`, `Input`, `InputLeftElement`, `InputRightElement`)**:
    - Replace `InputGroup` with a `div className=\"relative\"`.
    - `InputLeftElement`: `<div className=\"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none\"><SearchIcon className=\"h-5 w-5 text-gray-400 dark:text-gray-500\" /></div>`
    - Chakra `Input`: HTML `<input type=\"text\" className=\"w-full h-12 px-3 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm\" />` (adjust padding for icons, ensure `size=\"lg\"` equivalent height/text if needed - Tailwind\'s default form sizes are smaller).
    - `InputRightElement` (for clear button): `<div className=\"absolute inset-y-0 right-0 pr-3 flex items-center\">`. Clear `IconButton` becomes `<button type=\"button\" className=\"p-1 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none\"><ClearSVGIcon className=\"h-5 w-5\" /></button>` (use the inline SVG for clear)
  - **Category Select (`<Select>`)**:
    - Replace Chakra `Select` with HTML `<select className=\"w-full h-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm\">`. The `<option>` elements remain; `style` on disabled option for separator is likely fine for basic appearance.
  - **Submit Button (`<Button>`)**:
    - Replace Chakra `Button` with `<button type=\"submit\" className=\"px-4 py-2 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-lg min-w-[64px]\">Go</button>`
  - **Image Search Link (`Link as=\"button\"`)**:
    - Replace with `<button type=\"button\" onClick={onImageSearch} className=\"w-full md:w-auto text-lg text-blue-500 dark:text-blue-300 hover:underline hover:text-blue-600 dark:hover:text-blue-400 mt-2 md:mt-0 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\">`
    - Inner `Flex` becomes `<span className=\"flex items-center justify-center gap-2\">`. The camera SVG remains.
  - **SVG Icons**: `SearchIcon` component can be used directly. Inline SVGs for clear and image search camera are also fine. Apply sizing/color via `className` if not inherent (e.g., `h-5 w-5`).
  - **JavaScript Logic**: All state management (`useState`, `useRef`), side effects (`useEffect`), router interactions (`useRouter`), debouncing, and event handlers are independent of Chakra UI and will remain unchanged.

- **Potential Pitfalls**:

  - **Form Element Styling**: Achieving consistent and accessible cross-browser styling for native `<input>`, `<select>`, and `<button>` elements using only Tailwind utilities requires careful application of styles for borders, padding, focus states, dark mode, etc. Without `@tailwindcss/forms`, more manual styling is needed.
  - **Select Dropdown Appearance**: Native `<select>` dropdowns have limited styling capabilities for the option list itself.
  - **Positioning Icons in Input**: Ensuring the absolute-positioned icons within the text input are correctly aligned and the input text has appropriate padding to avoid overlap.
  - **Responsive Behavior**: Confirming the flexbox layout wraps and distributes elements correctly on various screen sizes.

- **Non-trivial components/logic to recreate/adapt**:
  - **The styled text input with integrated search icon (left) and clear button (right)**. This requires careful use of relative/absolute positioning and padding.
  - **The styled select dropdown** to match the overall aesthetic.
  - The **Image Search button/link** with its icon and text, styled distinctively.

### 9. `pages/index.js` (Homepage)

- **Chakra UI Usage**:

  - Layout: `Box` (main page wrapper), `Container` (for content width constraint), `VStack` (for vertical stacking of search bar and results), `Center` (for loading spinner).
  - Typography: `Text` (for initial state message).
  - Feedback: `Spinner` (loading state), `Alert`, `AlertIcon`, `AlertTitle`, `AlertDescription` (error state).
  - Interactive: `Link` (styled as a button in the initial message to trigger image search).
  - Theming: `useColorModeValue` for `pageBg`, `textColor`, `linkColor`.
  - Custom Components: Relies heavily on imported custom components: `Header`, `SearchBar`, `SearchResults`, `PartDetailModal`, `ImageSearchModal`, `Footer`.

- **Refactoring Notes**:

  - **Main Page Structure**:
    - Outer `Box` -> `<div className=\"min-h-screen bg-gray-50 dark:bg-gray-900\">`. (Background colors based on `pageBg`).
    - `Container maxW=\"container.2xl\"` -> `<div className=\"container mx-auto max-w-screen-2xl px-4 pt-4 pb-3\">`. (Tailwind\'s `container` sets responsive max-widths; `max-w-screen-2xl` is a direct utility. `px-4` for horizontal padding).
    - `VStack spacing={0} align=\"stretch\"` -> `<div className=\"flex flex-col items-stretch\">`. (Add `space-y-X` if specific spacing is needed between direct children like SearchBar and Results area).
  - **Loading State (`isLoading`)**:
    - `Center py={6}` -> `<div className=\"flex justify-center items-center py-6\">`
    - Chakra `Spinner` -> Replace with an SVG spinner component (e.g., a rotating SVG icon).
  - **Error State (`error`)**:
    - Chakra `Alert` and its sub-components -> A single `div` styled as an error alert, containing an SVG error icon and text elements for title and description.
      Example: `<div className=\"rounded-md bg-red-100 dark:bg-red-900/40 p-4 my-4\"> ...flex container for icon and text... </div>`
  - **Initial State Message (`!isLoading && !error && !hasSearched`)**:
    - `Box textAlign=\"center\"` -> `<div className=\"text-center pt-4 pb-32\">`
    - Chakra `Text` -> `<p className=\"text-gray-600 dark:text-gray-300 text-lg\">`
    - Chakra `Link as=\"button\"` for image search -> `<button type=\"button\" onClick={handleImageSearchModalOpen} className=\"text-blue-500 dark:text-blue-300 hover:underline hover:text-blue-600 dark:hover:text-blue-400 font-medium\">search using an image</button>`
  - **Child Components**: `Header`, `SearchBar`, `SearchResults`, `PartDetailModal`, `ImageSearchModal`, `Footer` will all be refactored independently. This page mainly orchestrates their placement and manages shared state / modal visibility.
  - **JavaScript Logic**: All existing React state (`useState`), side effects (`useEffect` for data fetching and modal triggers), router interactions (`useRouter`), and event handlers (`handlePartClick`, `handleImageSearchModalOpen`, etc.) are not tied to Chakra UI and will remain largely the same.
  - **Color Mode Values**: `pageBg`, `textColor`, `linkColor` will be handled by applying Tailwind classes with dark mode variants directly (e.g., `bg-gray-50 dark:bg-gray-900`).

- **Potential Pitfalls**:

  - **Container Sizing**: Ensuring the `max-w-screen-2xl` (or equivalent) and `px-4` provides the intended layout width and padding consistently.
  - **Dependencies on Child Components**: The page\'s appearance and functionality are highly dependent on the successful refactoring of all imported child components.
  - **Visual Cohesion**: Ensuring the loading, error, and initial placeholder states are styled harmoniously with the rest of the Tailwind-refactored application.

- **Non-trivial components/logic to recreate/adapt (within this file\'s direct JSX)**:
  - The visual presentation of the **loading state** (spinner and layout).
  - The visual presentation of the **error alert** (icon, text, colors, layout).
  - The **initial placeholder message** with its specific text and clickable trigger for image search.
  - The overall page flex column layout for SearchBar and results/placeholder area.

### 10. `components/SearchResults.js`

- **Chakra UI Usage**:

  - Layout: `Box` (main container), `Grid` (for responsive layout of part cards), `Flex` (for summary text and buttons).
  - Typography: `Heading`, `Text`.
  - Interactive: `Button` (with `variant=\"link\"`).
  - Feedback: `useToast` (imported but not directly used in the provided JSX for results display, may be for selection actions not shown).
  - Theming: `useColorModeValue` for `textColor`, `buttonBorderColor`, `buttonHoverBg`, `infoTextColor`.
  - Custom Components: `PartCard` (for each result), `PartDetailModal` (conditionally rendered).

- **Refactoring Notes**:

  - **Main Container**: Convert outer `Box` to `div`.
  - **No Results State**:
    - `Box textAlign=\"center\" py={10}` -> `<div className=\"text-center py-10\">`.
    - `Heading` -> `<h3 className=\"text-lg font-medium text-gray-500 dark:text-gray-400 mb-4\">No results found</h3>`.
    - `Button variant=\"link\"` for \"Reset Search\" -> `<button type=\"button\" onClick={() => router.push('/')} className=\"text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline\">Reset Search</button>`.
  - **Results Summary Area**:
    - `Flex` containers for text and \"Search All Categories\" button -> `div` with Tailwind flex utilities.
    - `Text` elements for counts -> `<p className=\"text-gray-600 dark:text-gray-300\">... {totalResults} results ...</p>`.
    - `Button variant=\"link\"` for \"Search All Categories\" -> Similar to \"Reset Search\" button, styled as a link.
  - **Grid Layout for Results (`Grid`)**:
    - Replace Chakra `Grid` with `<div className=\"grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-2 mb-4\">`. (Adjust `sm` and `md` if they were meant to be different from 1 column, original was `repeat(1, 1fr)` for them too).
  - **Rendering `PartCard`**: The `.map()` function iterating through `results` and rendering `<PartCard ... />` remains. The `PartCard` component itself will be the refactored Tailwind version. Props passed (`key`, `part`, `isSelected`, `onToggleSelect`, `onPartClick`) remain the same.
  - **Modal**: Conditional rendering of `<PartDetailModal ... />` remains. It will be the refactored Tailwind-based modal.
  - **JavaScript Logic**: All React state (`selectedParts`, `selectedPartId`, `isModalOpen`), router interactions, and event handlers (`handleToggleSelect`, `handlePartClick`, etc.) are independent of Chakra UI and will stay.
  - **Toast Notifications**: If `useToast` was intended for any actions (e.g., after selecting parts, which isn\'t fully shown), those calls would need to be replaced with the new toast system (e.g., `react-hot-toast`).
  - **Color Mode Values**: Replace `useColorModeValue` calls with direct Tailwind classes incorporating `dark:` prefixes (e.g., `text-gray-600 dark:text-gray-300`).

- **Potential Pitfalls**:

  - **Grid Responsiveness**: Ensuring the Tailwind grid classes (`grid-cols-1 lg:grid-cols-2 xl:grid-cols-3`) correctly match the intended responsive behavior from Chakra\'s `templateColumns`. The original `sm` and `md` were also 1 column.
  - **Dependencies**: High dependency on the successful refactoring of `PartCard.js` and `PartDetailModal.js`.
  - **Toast Functionality**: If toasts are used for selection or other actions not detailed in the current view, ensuring the new toast system is correctly implemented for those cases.

- **Non-trivial components/logic to recreate/adapt**:
