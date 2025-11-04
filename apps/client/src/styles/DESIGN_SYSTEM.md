
# ERP Soul Design System

## Overview

This document outlines the design system for the ERP Soul application. The design system provides a consistent, scalable, and maintainable approach to UI components, patterns, and styles across the application.

## Design Principles

1. **Consistency**: Maintain visual and functional consistency across all components and screens.
2. **Clarity**: Design interfaces that are easy to understand and navigate.
3. **Efficiency**: Help users complete tasks with minimal effort.
4. **Accessibility**: Ensure the application is usable by people with diverse abilities.
5. **Scalability**: Create components that can grow with the application's needs.

## Color Palette

### Primary Colors
- **Primary Blue**: Used for primary actions, links, and highlights.
  - `#3b82f6` (500) - Main primary color
  - `#2563eb` (600) - Darker shade for hover states
  - `#60a5fa` (400) - Lighter shade for subtle highlights

### Secondary Colors
- **Neutral Gray**: Used for backgrounds, borders, and text.
  - `#64748b` (500) - Medium gray for secondary text
  - `#f1f5f9` (100) - Light gray for backgrounds
  - `#e2e8f0` (200) - Border color

### Status Colors
- **Success**: `#22c55e` - Used for success states, positive actions
- **Warning**: `#f59e0b` - Used for warnings, attention needed
- **Error**: `#ef4444` - Used for errors, destructive actions
- **Info**: `#0ea5e9` - Used for informational messages

## Typography

### Font Family
- **Primary**: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
- **Monospace**: SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New

### Font Scale
- **XS**: 0.75rem (12px) - Captions, labels
- **SM**: 0.875rem (14px) - Small text, secondary information
- **Base**: 1rem (16px) - Body text, standard content
- **LG**: 1.125rem (18px) - Subheadings
- **XL**: 1.25rem (20px) - Small headings
- **2XL**: 1.5rem (24px) - Section headings
- **3XL**: 1.875rem (30px) - Page titles
- **4XL**: 2.25rem (36px) - Main titles
- **5XL**: 3rem (48px) - Large display text

### Font Weights
- **Light**: 300 - Large headings
- **Normal**: 400 - Body text
- **Medium**: 500 - Emphasized text, button labels
- **Semibold**: 600 - Headings, important labels
- **Bold**: 700 - Strong emphasis
- **Extrabold**: 800 - Very strong emphasis

## Spacing

### Scale
The spacing scale is based on rem units to ensure consistent sizing across the application.

- **0**: 0 - No spacing
- **1**: 0.25rem (4px) - Tight spacing
- **2**: 0.5rem (8px) - Small spacing
- **3**: 0.75rem (12px) - Medium spacing
- **4**: 1rem (16px) - Standard spacing
- **5**: 1.25rem (20px) - Comfortable spacing
- **6**: 1.5rem (24px) - Section spacing
- **8**: 2rem (32px) - Large spacing
- **10**: 2.5rem (40px) - Extra large spacing
- **12**: 3rem (48px) - Component spacing
- **16**: 4rem (64px) - Page sections
- **20**: 5rem (80px) - Major page divisions

## Border Radius

- **None**: 0 - For square elements
- **SM**: 0.125rem (2px) - Subtle rounding
- **DEFAULT**: 0.25rem (4px) - Standard rounding
- **MD**: 0.375rem (6px) - Moderate rounding
- **LG**: 0.5rem (8px) - Rounded elements
- **XL**: 0.75rem (12px) - More rounded elements
- **2XL**: 1rem (16px) - Highly rounded elements
- **Full**: 9999px - For circular elements

## Shadows

- **SM**: 0 1px 2px 0 rgba(0, 0, 0, 0.05) - Subtle elevation
- **DEFAULT**: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) - Standard elevation
- **MD**: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) - Medium elevation
- **LG**: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) - High elevation
- **XL**: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) - Very high elevation
- **2XL**: 0 25px 50px -12px rgba(0, 0, 0, 0.25) - Highest elevation
- **Inner**: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06) - Inset shadow

## Breakpoints

- **SM**: 640px - Mobile devices
- **MD**: 768px - Tablets
- **LG**: 1024px - Small desktops
- **XL**: 1280px - Desktops
- **2XL**: 1536px - Large desktops

## Component Guidelines

### Buttons

#### Primary Button
- **Background**: Primary blue (#3b82f6)
- **Text**: White
- **Border Radius**: MD (0.375rem)
- **Padding**: 0.75rem 1rem (12px 16px)
- **Font Weight**: Medium (500)
- **Hover**: Darker primary blue (#2563eb)

#### Secondary Button
- **Background**: Light gray (#f1f5f9)
- **Text**: Gray (#64748b)
- **Border Radius**: MD (0.375rem)
- **Padding**: 0.75rem 1rem (12px 16px)
- **Font Weight**: Medium (500)
- **Hover**: Medium gray (#e2e8f0)

#### Danger Button
- **Background**: Error red (#ef4444)
- **Text**: White
- **Border Radius**: MD (0.375rem)
- **Padding**: 0.75rem 1rem (12px 16px)
- **Font Weight**: Medium (500)
- **Hover**: Darker error red (#dc2626)

### Inputs

#### Text Input
- **Border Radius**: MD (0.375rem)
- **Border**: 1px solid light gray (#e2e8f0)
- **Padding**: 0.75rem 1rem (12px 16px)
- **Font Size**: Base (1rem)
- **Focus**: Primary blue border with subtle shadow

#### Select
- **Border Radius**: MD (0.375rem)
- **Border**: 1px solid light gray (#e2e8f0)
- **Padding**: 0.75rem 1rem (12px 16px)
- **Font Size**: Base (1rem)
- **Focus**: Primary blue border with subtle shadow

### Cards

- **Border Radius**: LG (0.5rem)
- **Background**: Light gray (#f9fafb)
- **Border**: 1px solid light gray (#e5e7eb)
- **Shadow**: SM
- **Padding**: 1.5rem (24px)
- **Margin Bottom**: 1.5rem (24px)

### Tables

- **Border Radius**: MD (0.375rem)
- **Border**: 1px solid light gray (#e2e8f0)
- **Header Background**: Light gray (#f3f4f6)
- **Header Text**: Medium gray (#4b5563)
- **Header Font Weight**: Semibold (600)
- **Row Hover**: Very light gray (#f9fafb)
- **Cell Padding**: 0.75rem (12px)

### Modals

- **Border Radius**: LG (0.5rem)
- **Shadow**: XL
- **Header Border Bottom**: 1px solid light gray (#e2e8f0)
- **Footer Border Top**: 1px solid light gray (#e2e8f0)
- **Padding**: 1.5rem (24px)

### Forms

- **Item Margin Bottom**: 1rem (16px)
- **Label Font Weight**: Medium (500)
- **Label Color**: Medium gray (#4b5563)
- **Input Border Radius**: MD (0.375rem)

### Tags

- **Border Radius**: MD (0.375rem)
- **Padding**: 0.25rem 0.75rem (4px 12px)
- **Font Weight**: Medium (500)

## Responsive Design

The design system follows a mobile-first approach, ensuring that the application works well on all device sizes.

### Mobile (up to 640px)
- Simplified navigation
- Stacked layouts
- Reduced padding and margins
- Optimized form inputs for touch

### Tablet (640px to 1024px)
- More complex layouts
- Side-by-side components
- Standard padding and margins

### Desktop (1024px and above)
- Full feature set
- Complex multi-column layouts
- Maximum padding and margins

## Accessibility Guidelines

### Color Contrast
- Ensure all text meets WCAG AA contrast ratio of at least 4.5:1
- Large text (18px or 14px bold) should meet WCAG AA contrast ratio of at least 3:1

### Keyboard Navigation
- All interactive elements should be keyboard accessible
- Visible focus indicators for keyboard navigation
- Logical tab order

### Screen Reader Support
- Proper ARIA labels and roles
- Semantic HTML structure
- Descriptive alt text for images

### Form Accessibility
- Clear labels for all form inputs
- Error messages that are associated with form fields
- Instructions for complex inputs

## Implementation

The design system is implemented using:
- React components with TypeScript
- Ant Design as the base UI library
- Custom CSS variables for theming
- Responsive design with CSS media queries

## Usage

To use the design system in your components:

```tsx
import { DesignSystem, colors, spacing, borderRadius } from '../styles/DesignSystem';

function MyComponent() {
  return (
    <DesignSystem>
      <div style={{
        backgroundColor: colors.gray[50],
        padding: spacing[4],
        borderRadius: borderRadius.md,
      }}>
        {/* Component content */}
      </div>
    </DesignSystem>
  );
}
```

## Maintenance

The design system will be reviewed and updated quarterly to:
- Add new components as needed
- Refine existing components based on user feedback
- Ensure compatibility with new browser versions
- Improve accessibility features
