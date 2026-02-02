# Inventory Management System - Design System

## Overview
B2B Inventory Management System for Malaysian SMEs (Auto Parts, Hardware, Spare Parts Wholesalers)

**Style**: Professional Minimalist with subtle depth
**Mood**: Trust, efficiency, clarity, productivity

---

## Color Palette

### Primary Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#1677ff` | Buttons, links, active states |
| Primary Hover | `#4096ff` | Button hover states |
| Primary Active | `#0958d9` | Button pressed states |
| Primary Bg | `#e6f4ff` | Light backgrounds, badges |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Success | `#52c41a` | Positive states, profits, active |
| Success Bg | `#f6ffed` | Success alerts background |
| Warning | `#faad14` | Warnings, low stock alerts |
| Warning Bg | `#fffbe6` | Warning alerts background |
| Error | `#ff4d4f` | Errors, negative values, danger |
| Error Bg | `#fff2f0` | Error alerts background |
| Info | `#1677ff` | Information, pending states |

### Neutral Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Title | `#141414` | Page titles, headers |
| Text | `#262626` | Primary body text |
| Text Secondary | `#595959` | Secondary text, descriptions |
| Text Tertiary | `#8c8c8c` | Disabled text, placeholders |
| Border | `#d9d9d9` | Default borders |
| Border Light | `#f0f0f0` | Light borders, dividers |
| Background | `#f5f5f5` | Page backgrounds |
| Background Light | `#fafafa` | Card backgrounds |
| White | `#ffffff` | Cards, modals |

---

## Typography

### Font Family
- **Primary**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **Monospace**: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace` (for codes, SKUs)

### Font Sizes
| Name | Size | Line Height | Usage |
|------|------|-------------|-------|
| H1 | 30px | 38px | Page titles |
| H2 | 24px | 32px | Section titles |
| H3 | 20px | 28px | Card titles |
| H4 | 16px | 24px | Subsection titles |
| Body | 14px | 22px | Default text |
| Small | 12px | 20px | Captions, metadata |

### Font Weights
- Regular: 400
- Medium: 500 (labels, emphasis)
- Semibold: 600 (headings, important values)
- Bold: 700 (page titles)

---

## Spacing

### Base Unit: 4px
| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Between related items |
| md | 16px | Default component padding |
| lg | 24px | Section spacing |
| xl | 32px | Major sections |
| xxl | 48px | Page-level spacing |

---

## Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| xs | 2px | Tags, badges |
| sm | 4px | Inputs, small buttons |
| md | 6px | Cards, buttons |
| lg | 8px | Modals, large cards |
| xl | 12px | Feature cards |
| full | 9999px | Pills, avatars |

---

## Shadows
| Token | Value | Usage |
|-------|-------|-------|
| None | none | Flat elements |
| Sm | `0 1px 2px rgba(0,0,0,0.05)` | Subtle depth |
| Default | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Cards |
| Md | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)` | Dropdowns |
| Lg | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | Modals |
| Hover | `0 4px 12px rgba(0,0,0,0.12)` | Card hover states |

---

## Component Guidelines

### Stat Cards (Dashboard)
- Background: White
- Border: 1px solid `#f0f0f0`
- Border-radius: 8px
- Padding: 24px
- Shadow: Default, Hover: Lg
- Transition: all 200ms ease
- Cursor: pointer (if clickable)
- Hover: lift with shadow, subtle background tint

### Data Tables
- Header: Background `#fafafa`, text `#262626`, font-weight 600
- Row hover: Background `#f5f5f5`
- Border: Bottom only, `#f0f0f0`
- Cell padding: 12px 16px
- Action buttons: Ghost style, visible on hover or always

### Form Inputs
- Height: 40px (default), 32px (compact)
- Border: 1px solid `#d9d9d9`
- Border-radius: 6px
- Focus: Border `#1677ff`, shadow `0 0 0 2px rgba(22,119,255,0.2)`
- Error: Border `#ff4d4f`, shadow `0 0 0 2px rgba(255,77,79,0.2)`

### Buttons
- Primary: Solid fill, white text
- Default: Ghost/outline style
- Danger: Red variants
- Height: 40px (default), 32px (small)
- Border-radius: 6px
- Transition: all 150ms ease
- Disabled: 0.6 opacity, no cursor

### Sidebar Navigation
- Width: 256px (expanded), 80px (collapsed)
- Background: White
- Border-right: 1px solid `#f0f0f0`
- Active item: Background `#e6f4ff`, text `#1677ff`
- Hover: Background `#f5f5f5`
- Icon size: 16px
- Transition: width 200ms ease

### Page Headers
- Title: H4 (16px), semibold
- Actions: Right-aligned
- Margin-bottom: 24px

---

## Interaction States

### Hover
- Duration: 150-200ms
- Easing: ease or ease-out
- Cards: Lift with shadow
- Buttons: Darker shade
- Links: Underline or color change

### Focus
- Always visible ring for accessibility
- Color: Primary with 20% opacity spread
- 2px spread

### Active/Pressed
- Slightly darker than hover
- Optional scale(0.98) for buttons

### Disabled
- Opacity: 0.5-0.6
- Cursor: not-allowed
- No hover effects

---

## Loading States

### Skeleton Screens
- Use animated gradients
- Match layout structure
- Subtle pulse animation

### Spinners
- Primary color
- Centered in container
- With optional text

---

## Responsive Breakpoints
| Name | Min Width | Usage |
|------|-----------|-------|
| xs | 0 | Mobile |
| sm | 576px | Large mobile |
| md | 768px | Tablet |
| lg | 992px | Small desktop |
| xl | 1200px | Desktop |
| xxl | 1600px | Large desktop |

---

## Accessibility Requirements

1. **Color Contrast**: 4.5:1 minimum for text
2. **Focus States**: Visible ring on all interactive elements
3. **Touch Targets**: Minimum 44x44px on mobile
4. **Alt Text**: All meaningful images
5. **ARIA Labels**: Icon-only buttons
6. **Keyboard Navigation**: Tab order matches visual order
7. **Reduced Motion**: Respect `prefers-reduced-motion`

---

## Anti-Patterns (Avoid)

1. ❌ Using emojis as icons (use SVG icons)
2. ❌ Scale transforms on hover that shift layout
3. ❌ Missing cursor-pointer on clickable elements
4. ❌ Instant state changes (always use transitions)
5. ❌ Low contrast text (gray-400 or lighter for body)
6. ❌ Missing loading/skeleton states
7. ❌ Inconsistent spacing
8. ❌ Too many primary colors competing
