# UX Principles

> Status: Draft | Owner: Design | Last Updated: 2026-08-14

## Core Principles

### 1. Progressive Disclosure

Complexity appears as needed. Start simple, reveal advanced options when the user is ready.

**Good:** Canvas shows basic properties by default. Advanced config appears when user clicks "Advanced."
**Bad:** Every property visible at once, overwhelming new users.

### 2. Explain Consequences

Before important actions, show what will happen. Users should never be surprised by outcomes.

**Good:** Provision preview shows exactly what resources will be created/changed/destroyed.
**Bad:** "Provision" button directly executes without preview.

### 3. Safe Defaults

Default configurations are secure and reasonable. Users can override, but the default is safe.

**Good:** New VPC defaults to private subnets. User explicitly enables public access.
**Bad:** New VPC defaults to public subnets. User must remember to restrict.

### 4. Escape Hatches

Advanced users maintain control. Always provide a way to drop to code, override defaults, or customize.

**Good:** Visual canvas generates Terraform. User can view and edit the generated code.
**Bad:** Visual canvas generates code that can't be modified.

### 5. Visible State

Never hide what's happening. Show progress, status, and results clearly.

**Good:** Provision shows: "Initializing... Planning... Applying... 3/4 resources created..."
**Bad:** Spinner that says "Provisioning..." with no detail.

### 6. Reversible When Possible

Prioritize reversible actions. When actions are destructive, make it very clear.

**Good:** "This will create 4 resources. You can destroy them later."
**Bad:** "This will create 4 resources." (no mention of reversibility)

### 7. Fast Path

Common cases are extremely simple. The default path should be the most common use case.

**Good:** "Drag → Connect → Generate → Provision" is the default 4-step path.
**Bad:** "Configure → Validate → Generate → Review → Approve → Provision" (6 steps for basic use)

## Visual Principles

### Brand Consistency

- Navy (#0a1128) for primary actions and text
- Lime (#ccff00) for accents and success states
- Ice Blue (#E3E2FD) for backgrounds and subtle elements
- White for cards and surfaces

### Typography

- Font: Inter (system font stack)
- Headings: Bold, brand-navy
- Body: Regular, slate-600
- Code: Monospace, slate-700

### Spacing

- Consistent 4px grid
- Generous whitespace
- Clear visual hierarchy

### Icons

- Use lucide-react exclusively
- Consistent 16px/20px/24px sizes
- Brand-navy for primary icons
- Slate-400 for secondary icons

## Interaction Principles

### Drag and Drop

- Clear visual feedback on drag (shadow, opacity change)
- Snap to grid for precision
- Drop zone highlighting

### Selection

- Click to select single item
- Shift+click for multi-select
- Drag to select area
- Clear selection state

### Keyboard

- Consistent shortcuts across the app
- Undo/redo with Cmd+Z/Cmd+Shift+Z
- Delete with Backspace/Delete
- Copy/paste with Cmd+C/Cmd+V

### Error Handling

- Inline validation (red border + message)
- Toast notifications for actions
- Error states with recovery suggestions
- Never blank error screens

## Accessibility

### Keyboard Navigation

- All interactive elements focusable
- Logical tab order
- Visible focus indicators
- Skip links for main content

### Screen Readers

- Semantic HTML
- ARIA labels where needed
- Alt text for images
- Meaningful link text

### Color

- Never rely solely on color to convey information
- Sufficient contrast ratios (WCAG AA)
- Color-blind friendly palettes

### Motion

- Respect prefers-reduced-motion
- Smooth transitions (not jarring)
- Loading states for async operations

## Responsive

### Breakpoints

- Mobile: < 768px (limited functionality)
- Tablet: 768px–1024px (reduced canvas)
- Desktop: > 1024px (full experience)

### Mobile

- Canvas is desktop-primary
- Mobile shows read-only views
- Critical actions require desktop

## Documentation

- Every component has a description
- Every action has a tooltip
- Every error has a suggestion
- Every feature has a guide
