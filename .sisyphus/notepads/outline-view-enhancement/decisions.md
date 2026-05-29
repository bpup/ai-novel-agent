# Decisions — OutlineView Enhancement

## 1. Optional `onReorder` prop
- `onReorder` is optional (`onReorder?: (headings: HeadingItem[]) => void`)
- Rationale: OutlineView is used in context where reorder may not be needed (e.g., read-only preview)
- DnD is always enabled (draggable attribute) but drop only fires callback if `onReorder` is provided

## 2. Indent step: 20px
- Changed from original 16px to 20px as specified in task requirements
- Formula: `paddingLeft: 12 + (level - 1) * 20` px

## 3. Test DataTransfer mock
- Created reusable `createDataTransfer(getDataReturn)` helper following existing ProjectOutline test pattern
- Each drag event sequence needs separate DataTransfer mock instance because `fireEvent` mutates the object
