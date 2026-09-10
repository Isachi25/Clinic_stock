# Clinic_stock

Stock management UI for browsing items, viewing details, and updating stock.

## README draft

### Screens and layout split
- **Stock list screen**: primary two-column layout on desktop:
  - Left: list + filters (search, category, sort).
  - Right: selected item detail panel (stock, price, metadata, save action).
- **Mobile (360px+)**: single-column flow:
  - List and filters first.
  - Detail opens as a full screen route or sheet (`itemId` in URL still controls selection).
- **Pagination**: list footer with page controls and current page summary.

### State model
- **URL state**: `search`, `category`, `sort`, `page`, `itemId`.
  - Shareable, bookmarkable, and used for back/forward navigation.
- **Server state**: product list, item details, stock values, category options.
  - Fetched from API and cached.
- **Local UI state**: modal open/close, inline edit mode, form dirty/touched state, transient toasts.

### Fetch, cache, and invalidation
- Query key pattern:
  - List: `[products, {search, category, sort, page}]`
  - Detail: `[product, itemId]`
- **After stock save (PUT)**:
  - Wait for success.
  - Invalidate detail query for `itemId`.
  - Invalidate current list query so list stock values refresh.
- **After search on slow network**:
  - Debounce input before URL update.
  - Keep previous list data visible while new query loads.
  - Show non-blocking loading indicator in list area.

### Layout, spacing, colour, and type
- Use **design tokens/theme** for spacing, colors, typography, radius, and shadows.
- Keep component library defaults only where they match tokens.
- Minimum baseline:
  - Spacing scale (e.g., 4/8px rhythm),
  - Semantic colors (surface, text, success, warning, error),
  - Type scale with readable body size at 360px.

### Accessibility
- Full keyboard support:
  - Tab through filters/list/detail actions.
  - Enter/Space to activate item/select/save controls.
  - Visible focus states from theme tokens.
- Responsive at **360px** without horizontal scroll for core flows.
- Explicit UI states:
  - Loading: skeleton/spinner + accessible status text.
  - Empty: “no results” guidance with clear reset action.
  - Error: retry action and readable error message.

### Decision log
1. **Decision**: Keep `search` in URL (not only local state).
   - **Rejected alternative**: local-only search input state.
   - **Why**: URL state enables deep links, browser navigation, and reproducible QA scenarios.
2. **Decision**: Wait for PUT success before confirming stock update in UI.
   - **Rejected alternative**: optimistic update immediately.
   - **Why**: stock is high-integrity data; avoiding false success is preferable to faster perceived updates.
3. **Decision**: If a filter/search reduces total pages and current page becomes empty, reset to last valid page (or page 1).
   - **Rejected alternative**: keep invalid page and show empty list.
   - **Why**: prevents confusing “empty page” states that are pagination artifacts, not true no-results.
4. **Decision**: Treat DummyJSON writes as non-persistent in UX messaging.
   - **Rejected alternative**: imply durable backend persistence.
   - **Why**: aligns expectations during demos/testing and avoids misleading users about saved state longevity.
5. **Decision**: Handle token expiry with a centralized auth refresh/logout path.
   - **Rejected alternative**: per-request ad hoc expiry handling.
   - **Why**: prevents inconsistent failure behavior across list/detail/save flows.
