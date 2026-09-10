# Clinic_stock

Internal clinic stock console for supplies teams working on shared ward tablets and patchy wifi.

## Preferred stack

- **React** for component-driven UI
- **TypeScript** for type-safe domain/state modeling
- **Tailwind CSS** for fast, consistent UI styling

This stack is preferred for the production rollout across multiple clinics. Tailwind defaults are acceptable initially, with project-specific tokens added in `tailwind.config` as rollout needs grow.

## Components identified and screen split

The screen is split into two main regions on tablet and desktop, and stacked on small screens:

1. **Left/main region: inventory browser**
   - `StockToolbar` (search, category filter, clinic filter, sort control)
   - `StockList` (virtualized/paginated list of stock items)
   - `StockListItem` (name, category, stock, location summary)
2. **Right/secondary region: selected item detail**
   - `StockDetailPanel` (full metadata, current quantity, audit info)
   - `StockCorrectionForm` (physical count correction action)
   - `ShareLinkAction` (copy direct item link)
3. **Cross-cutting components**
   - `ConnectivityBanner` (online/offline/refresh state)
   - `LoadingState`, `ErrorState`, `EmptyState`

## State ownership and why

Server data, URL state, and local UI state are intentionally separate.

### 1) Server data state (remote, cacheable)

- Lives in a server-state cache (for example React Query/TanStack Query)
- Includes: stock items, categories, clinic metadata, and server-confirmed quantities
- Why: this data is shared, asynchronous, and needs stale/fresh tracking and refetch controls

### 2) URL state (shareable/navigation state)

- Lives in URL query params and route params
- Includes: selected item id, search term, category filter, clinic filter, sort selection
- Why: users share links in chat, so view state must be reproducible from URL alone

### 3) Local UI state (ephemeral interaction state)

- Lives in component state or local store scoped to the page
- Includes: open/closed panels, form draft input, inline validation, optimistic-save status
- Why: this state is transient, view-specific, and should not pollute server cache or URL

## Fetch, cache, and invalidation approach

- Fetch stock data per clinic using cache keys like `['stock', clinicId]`
- Use stale-while-revalidate behavior so cached data renders immediately on weak networks
- Cache critical reference data (categories/clinics) longer than rapidly changing stock counts
- On stock correction:
  - Optimistically update the corrected item in cache for instant feedback
  - Send mutation to server
  - Invalidate affected stock queries (clinic + item detail keys) on success
  - Roll back optimistic value and surface retry UI on failure
- For offline periods:
  - Queue correction requests locally
  - Replay when connectivity returns
  - Invalidate relevant queries after replay to align with server truth

## Layout, spacing, colour, and typography

- **Layout:** responsive split view (list + detail), stacking on narrow screens
- **Spacing:** consistent spacing scale (Tailwind spacing tokens, e.g. 2/4/6/8 rhythm)
- **Colour:** semantic colors for status (normal, warning, critical-low-stock) with accessible contrast
- **Typography:** use Tailwind default sans stack initially, with clear hierarchy (`text-sm` metadata, `text-base` body, `text-lg` headings)
- **Theme/tokens:** start with Tailwind defaults, then introduce clinic design tokens (brand, status, spacing aliases) in theme extension for multi-clinic rollout consistency

## Accessibility approach

- Use semantic landmarks (`header`, `main`, `section`, `aside`) and heading hierarchy
- Ensure full keyboard support for list navigation, detail actions, and stock correction form
- Associate all inputs with visible labels and clear validation text
- Use `aria-live` regions for save status/offline-sync feedback
- Maintain WCAG-compliant contrast for text and status badges
- Keep touch targets large enough for tablet use
- Preserve visible focus indicators and never rely on color alone for meaning

## Decision log

1. **Decision:** Keep filters and selected item in URL state.
   - **Alternative rejected:** Keep all selection/filter state only in local component state.
   - **Why rejected:** Users share item links over chat; local-only state breaks reproducibility.

2. **Decision:** Use cached server-state tooling (React Query pattern) for stock data.
   - **Alternative rejected:** Fetch directly in each component with ad-hoc `useEffect` and local state.
   - **Why rejected:** Ad-hoc fetches duplicate logic, weaken offline behavior, and make invalidation/error handling inconsistent.

3. **Decision:** Use React + TypeScript + Tailwind for rollout implementation.
   - **Alternative rejected:** Continue plain static JavaScript/CSS only.
   - **Why rejected:** Static-only setup is quick for prototype work but scales poorly for multi-clinic maintainability, typed domain modeling, and shared UI conventions.

## Run locally

Serve with a simple static server:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.
