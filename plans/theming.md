# Comprehensive Theming Migration Plan

This document outlines the strategy for re-skinning the application using a modern CSS variable framework, supporting both dark and light modes, and adhering to a monochromatic aesthetic with key exceptions.

## 1. Architectural Overview

We will implement a structured CSS variable system organized into several files within `src/assets/css/`.

### File Structure

- `src/assets/css/variables/colors.css`: The "primitive" color palette. Defines all raw colors used across all themes.
- `src/assets/css/variables/typography.css`: Typography scales (`--size-xs` to `--size-xl`), font weights, and the default macOS GUI font face.
- `src/assets/css/themes/light.css`: Semantic mappings for light mode (e.g., `--bg-primary: var(--gray-50)`).
- `src/assets/css/themes/dark.css`: Semantic mappings for dark mode (e.g., `--bg-primary: var(--gray-900)`).
- `src/assets/css/main.css`: The main entry point that imports all other files.

## 2. Design System Standards

### Typography

- **Font Face**: San Francisco (macOS GUI font).
  ```css
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  ```
- **Scale**:
  - `--size-xs`: 0.75rem (12px)
  - `--size-s`: 0.875rem (14px)
  - `--size-m`: 1rem (16px)
  - `--size-l`: 1.125rem (18px)
  - `--size-xl`: 1.25rem (20px)
  - `--size-2xl`: 1.5rem (24px)

### Monochromatic Palette

The UI will be strictly monochromatic, using a pure grayscale scale.

- **Grayscale**: Pure black to pure white. No blue/slate tints for the main interface.
- **Accent**: High contrast (Black in light mode, White in dark mode).
- **Key exceptions** (ONLY for functional/biological signals):
  - **Success/Bio-Positive**: Emerald/Green
  - **Error/Bio-Negative**: Rose/Red
  - **Warning**: Amber/Orange
  - **Information/Tendency**: Sky Blue (preserved only for chart lines)

### Semantic Variable Naming

Variables should describe _intent_, not _appearance_:

- `--color-bg-base`: Main app background.
- `--color-bg-surface`: Card/Panel background.
- `--color-text-primary`: Main text color.
- `--color-border-subtle`: Default border color.
- `--color-accent`: High-contrast primary action (grayscale).

## 3. Implementation Strategy

### Phase 1: Foundation

1. Create the file structure in `src/assets/css/`.
2. Populate `colors.css` with a full primitive palette (Neutral, Emerald, Rose, Amber, Sky).
3. Populate `typography.css`.
4. Define semantic mappings in `light.css` and `dark.css`.
5. Update `main.ts` or `App.vue` to import `src/assets/css/main.css`.

### Phase 2: Migration (The "Big Replace")

We will use global regex searches to identify and replace hardcoded values.

#### Target Patterns

- **Hex Codes**: `#[0-9a-fA-F]{3,6}`
- **RGB/RGBA**: `rgba?\([^)]+\)`
- **Bootstrap Classes**: `text-primary`, `bg-success`, etc. (if found)

### Phase 3: Theme Switching Logic

1. Update `src/stores/ui.ts` to apply a `.theme-light` or `.theme-dark` class to the `document.documentElement`.
2. Ensure `v-popper` and other third-party components respect the theme variables.

## 4. Audit and Cleanup

- Run a final search for any remaining `#` or `rgb` strings in `.vue` and `.css` files.
- Ensure all inline `:style` bindings in Vue components are converted to use CSS variables where possible.
- Verify color contrast ratios for both light and dark modes.

## 5. Key Exceptions (Signals)

Certain biological signals and macro-nutrients will maintain their specific colors for rapid recognition:

- **Protein**: Emerald
- **Carbs**: Sky
- **Fat**: Amber
- **Arousal**: Gradient (Blue -> Green -> Orange)
