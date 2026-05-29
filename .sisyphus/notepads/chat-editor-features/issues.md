## 2026-05-28

### Delegation timeouts
Multiple `task()` delegations timed out at 1800000ms (30 min) regardless of task complexity. Pattern: simple one-line changes still timeout. Workaround: direct edits when delegation is impractical. Root cause unknown.

### `@chapter {query}` filtering unreachable
`detectMention` bails out when space follows `@`, but `buildMentionOptions` expects `@chapter {query}` format for filtering. These two functions are inconsistent. Chapter sub-filtering doesn't work.
