# Toast/Dialog Top Layer Investigation Report

## The Problem

When a `<dialog>` is opened with `showModal()`, toasts become either:
1. **Invisible** - hidden behind the dialog's `::backdrop` pseudo-element
2. **Non-interactive** - visible but clicks go to the backdrop instead of the toast

## Current Setup

### Dialog Component (`app/components/Dialog.tsx`)
- Uses native `<dialog>` element with `showModal()` API
- Has a `::backdrop` pseudo-element that covers the entire viewport
- Registers itself with `DialogContext` when open
- CSS transitions for open/close animations (`transition-all duration-300`)

### Toast Component (`app/components/ToastPop.tsx`)
- Uses React Context for state management
- Portals to `document.body` via `createPortal()`
- Individual toasts have `pointer-events-auto` for interactivity
- Supports swipe-to-dismiss and auto-dismiss timer

### Context (`app/context/DialogContext.tsx`)
- Tracks the currently active dialog element
- Provides `activeDialog` state and `setActiveDialog` function

## Key Technical Concepts

### Browser Top Layer
- Both `<dialog>` (via `showModal()`) and `[popover]` elements render in the browser's "top layer"
- Top layer is above ALL regular z-index stacking - z-index has no effect
- **Stacking order within top layer is determined by the order elements were added**
- The `::backdrop` pseudo-element is part of the dialog in the top layer

### The Core Issue
When dialog opens via `showModal()`:
1. Dialog + backdrop go into top layer
2. Backdrop covers entire viewport
3. Any element added to top layer BEFORE the dialog is below it
4. Any element added AFTER should be above it... but this isn't working reliably

## Approaches Tried

### 1. Portal Into Active Dialog
**Concept:** Portal toast container INTO the dialog element, making it part of the dialog's DOM tree.

**Implementation:**
```tsx
const portalTarget = activeDialog || document.body
// ...
createPortal(toastElements, portalTarget)
```

**Results:**
- ✅ Toasts ARE interactive when dialog is open
- ❌ Causes dialog to re-animate/flicker when toasts appear/disappear
- ❌ Toast re-animates when portal target changes (dialog opens/closes)

**Why it fails:** Adding/removing DOM nodes inside the dialog triggers CSS transitions because dialog has `transition-all`. Also, React unmounts/remounts components when portal target changes, resetting animation state.

### 2. Popover API with Re-show
**Concept:** Use `popover="manual"` to put toast in top layer, re-show after dialog opens to move it above.

**Implementation:**
```tsx
// In Dialog.tsx after showModal():
document.querySelectorAll('[popover]:popover-open').forEach((popover) => {
  popover.hidePopover()
  popover.showPopover()
})
```

**Results:**
- ❌ Toast still appears behind dialog backdrop
- ❌ Clicking toast closes the dialog (click goes to backdrop)

**Why it fails:** Re-showing the popover synchronously after `showModal()` doesn't reliably put it above the dialog in the top layer. The browser's top layer stacking behavior doesn't work as expected.

### 3. Re-show Popover via React State
**Concept:** Detect dialog state changes in ToastProvider and re-show popover.

**Implementation:**
```tsx
useEffect(() => {
  if (prevDialogRef.current !== activeDialog) {
    queueMicrotask(() => {
      if (popover.matches(':popover-open')) {
        popover.hidePopover()
        popover.showPopover()
      }
    })
  }
}, [activeDialog])
```

**Results:**
- ❌ Toast still not interactive
- ❌ Timing issues - by the time React state updates, dialog is already blocking

**Why it fails:** React state updates are async, so by the time we detect the dialog opened and try to re-show the popover, the dialog has already been painted and is blocking clicks.

### 4. Simple Popover (Current)
**Concept:** Just use popover API, portal to body, accept limitations.

**Implementation:**
```tsx
<div ref={popoverRef} popover="manual" ...>
  {toasts}
</div>

useEffect(() => {
  if (toasts.length > 0) popoverRef.current.showPopover()
  else popoverRef.current.hidePopover()
}, [toasts.length])
```

**Results:**
- ❌ Toast appears behind dialog backdrop
- Toast is in top layer but below dialog

**Why it fails:** If the dialog was opened before the toast, the dialog is higher in the top layer stack. Even re-showing doesn't fix it.

### 5. Track Entered Toasts
**Concept:** Prevent re-animation by tracking which toasts have already animated in.

**Implementation:**
```tsx
const enteredToastsRef = useRef<Set<string>>(new Set())
// Pass hasEntered to Toast, skip animation if true
```

**Results:**
- ✅ Prevents toast re-animation on portal change
- ❌ Doesn't solve the visibility/interactivity problem

### 6. Suppress Transitions During Portal Move
**Concept:** Set `transition: none` while portal target is changing.

**Implementation:**
```tsx
const [isMovingPortal, setIsMovingPortal] = useState(false)
// Detect portal change, set flag, use requestAnimationFrame to clear
style={{ ...(isMovingPortal && { transition: 'none' }) }}
```

**Results:**
- Reduced flicker somewhat
- ❌ Still had visual artifacts
- ❌ Didn't solve core visibility issue

## What We Know For Certain

1. **Top layer ignores z-index** - No amount of z-index will put a regular element above a dialog's backdrop

2. **Popover and dialog both use top layer** - But stacking order is unpredictable/not working as documented

3. **Portaling into dialog works for interactivity** - But causes animation side effects

4. **Dialog has `transition-all`** - This makes it sensitive to any DOM changes inside it

5. **React's portal behavior** - Changing portal target unmounts/remounts, resetting component state

6. **`::backdrop` is a pseudo-element** - Can't be targeted or moved in the DOM, it's part of the dialog

## Potential Unexplored Solutions

### A. Modify Dialog's CSS Transitions
Instead of `transition-all`, use specific transitions that won't trigger on content changes:
```css
transition: opacity 300ms, backdrop-color 300ms;
```
This might allow portaling into dialog without animation side effects.

### B. Use Two Toast Containers
- One always in body (for when no dialog)
- One always inside DialogProvider that renders into dialogs
- Sync state between them without moving DOM nodes

### C. CSS-only backdrop handling
Research if there's a way to make elements appear above `::backdrop` without using top layer.

### D. Different Dialog Implementation
Instead of native `<dialog>`, use a div-based modal that doesn't use top layer, allowing z-index control.

### E. Investigate Browser Differences
Test if the behavior differs in Chrome vs Firefox vs Safari - might be a browser bug.

### F. Use `inert` Attribute
When dialog opens, set `inert` on the dialog's backdrop interaction somehow, though this might not be possible with `::backdrop`.

## File Locations

- `app/components/ToastPop.tsx` - Toast system
- `app/components/Dialog.tsx` - Dialog component
- `app/context/DialogContext.tsx` - Dialog state tracking
- `app/layout.tsx` - Provider hierarchy
- `app/components/PartDetailModal.tsx` - Example dialog usage

## Current State of Code

The code is currently in a "simple popover" state - toasts use popover API, portal to body, but appear behind dialog backdrops.
