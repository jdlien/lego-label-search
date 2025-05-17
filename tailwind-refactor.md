<!-- @format -->

# Tailwind CSS Refactor Plan

This document outlines the plan to refactor this Next.js project from Chakra UI to Tailwind CSS v4.1 (CSS-only configuration).
This also involves migrating to the new Next.js App Directory Structure and using Typescript instead of Javascript.

This project is well on its way. Note that the original files are still available for reference:

- The original `pages/` directory is now `components.old/`.
- The original `components/` directory is now `components.old/`.

- Once all routes are migrated and tested, you can remove the old directories.

## Remaining Tasks

Almost all components have been ported to the new `app/` directory with Tailwind CSS and Typescript, but there are many remaining issues and much work can still be done on styling to ensure a consistent and polished user experience.

- 'Sticky footer' appears below the bottom of the page. It should only be below the bottom of the viewport if the content is already off the bottom of the viewport.
- Create CSS components in `globals.css` for input and select elements.
  - Ensure they have nice ring and hover styles, etc.
- Work on polishing the modal dialog component to look great and work well.
- Part detail view is broken
- PartCard (shown in search results) needs work to be styled nicely.
- Ensure that the part detail modal view has a good appearance.
- Labels should be downloadable from part detail view.
- Work on the Image search modal view.
  - Ensure it works well in landscape and portrait modes on mobile devices.
- Ensure that the category view has a good appearance.
  - Accordion nesting needs a bit of work.
- Test the PWA functionality.
- Test overscroll behavior on mobile and ensure the background/tint colors are correct.
