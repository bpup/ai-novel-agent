# Learnings — OutlineView Enhancement

## Patterns
- DnD pattern (dragIndex/dropIndex state, handleDragStart/DragOver/Drop/DragEnd) from ProjectOutline.tsx is reusable verbatim for li items
- `fireEvent.dragStart/Over/Drop/End` with `{ dataTransfer: {...} }` mock works correctly in @testing-library/react + jsdom for HTML5 DnD tests
- `border-l-2` with conditional color classes is the established visual indicator pattern for drag/drop states in this project

## Key decisions
- Used smarter key `key={`${i}-${heading.level}-${heading.text.slice(0, 10)}`}` instead of plain index to avoid React key warnings with reorder
- Made `onReorder` prop optional (typed as `onReorder?:`) since existing callers don't need it
- Increased indent step from 16px (original) to 20px (per task spec) for better visual hierarchy
- Used `role="listitem"` to match ProjectOutline pattern and make tests consistent
