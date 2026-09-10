# Clinic_stock

Clinic_stock is a responsive stock management interface for browsing products, viewing product details, and updating stock quantities.

## Preferred stack

- **React** for component-driven UI
- **TypeScript** for type-safe domain/state modeling
- **Tailwind CSS** for fast, consistent UI styling

Users can search, filter, sort, paginate, open item details, and update stock with URL-driven navigation, cached API data, responsive layouts, accessibility support, and clear loading/error states.

## Components and screen structure

The app has three main routes and one shared application shell.

### Sign In — `/login`

- `LoginForm` (username/password submission)
- `AuthGuard` redirect behavior for protected routes
- `ReturnToRoute` logic so users continue where they left off after sign-in

### Stock List — `/items`

- `StockToolbar` (search, category filter, sort selector)
- `StockTable` on larger screens
- `StockCardList` on smaller tablet screens
- `PaginationControls` (10 items per page)
- `StockRow` / `StockCard` with key fields: image, name, SKU, category, stock, availability

Price is treated as secondary catalogue information and is not a primary list column.

### Item Details — `/items/:id`

- `ItemHeader` (name, SKU, category)
- `ItemGallery` (images)
- `StockStatus` (current stock and availability)
- `CatalogueMeta` (brand, description, tags)
- `StockCorrectionForm` with save, pending, error, and retry states

Each item detail route is shareable and directly navigable.

### Shared application components

- `AppLayout` (header, main content, route outlet)
- `ConnectivityBanner` (online/offline + sync messaging)
- `LoadingState`, `ErrorState`, `EmptyState`

## State ownership and why

Server data, URL state, and local UI state are kept separate because they have different responsibilities.

### URL state = where the user is

- Lives in route params and query params
- Includes: item id, search term, category filter, sort option, page number
- Why: shared links must recreate the same view state

### TanStack Query state = data from the server

- Includes: items, categories, clinic metadata, and server-confirmed stock values
- Why: server data is async, shared, and needs caching/staleness controls

### Local UI state = temporary interaction/input state

- Lives in component state or local store scoped to the page
- Includes: panel toggles, form drafts, inline validation, transient banners
- Why: this state is short-lived and should not be encoded in cache or URL

### sessionStorage = authentication tokens

- Stores auth/session tokens per tab session
- Why: tokens should survive refresh but clear when the tab closes

## Fetch, cache, and invalidation

### Fetch

- Fetch stock by clinic with keys such as `['stock', clinicId, filters, page]`
- Load from cache first when available, then revalidate in the background

### Cache

- Cache list/detail responses for quick route transitions on weak wifi
- Keep clinic/category metadata cached longer than stock values
- Show cached data immediately where possible while checking for fresh data

### Invalidate

On stock correction:

1. Disable **Save** while request is in progress
2. Send mutation to server
3. On success, invalidate related list/detail queries so UI reflects server-confirmed data
4. On failure, keep previous server value, show error, and offer retry

For offline periods:

- Queue correction requests locally
- Resend queued updates when connectivity returns
- Invalidate impacted queries after replay to resync local and server state

## Layout, spacing, colour, and typography

1. **Layout:** route-based pages (`/items` list and `/items/:id` detail) with responsive table-to-card behavior on smaller tablets.
2. **Spacing:** consistent Tailwind spacing scale (2/4/6/8 rhythm).
3. **Colour:** semantic status colors (normal, warning, critical-low-stock) with accessible contrast ratios.
4. **Typography:** Tailwind default sans stack with clear hierarchy (`text-sm`, `text-base`, `text-lg`).
5. **Theme/tokens:** begin with Tailwind defaults, then extend theme with clinic-specific design tokens for brand/status/spacing consistency.

## Accessibility approach

- Keyboard accessible controls, predictable tab order, and a skip link to main content
- Native form controls for search/filter/pagination/actions with explicit labels
- `aria-live` announcements for save progress, sync status, and errors
- Clear loading, empty, and error states that are screen-reader friendly
- WCAG-compliant contrast, visible focus states, and no color-only status communication
- Touch-friendly targets for ward tablet interaction

## Decision log

1. **Decision:** Use separate list and detail routes (`/items` and `/items/:id`).
   - **Alternative rejected:** Split-pane list/detail on one route.
   - **Why rejected:** Route-per-item makes deep links, history navigation, and direct sharing simpler.

2. **Decision:** Keep URL state, server state, and local UI state separate.
   - **Alternative rejected:** Single global store for all state categories.
   - **Why rejected:** Mixed ownership increases coupling and makes cache/navigation behavior harder to reason about.

3. **Decision:** Use Tailwind defaults first, then extend tokens incrementally.
   - **Alternative rejected:** Build a full custom design token system from day one.
   - **Why rejected:** Default-first delivery is faster and still gives a clean path to clinic-specific theming.

## Run locally

Serve with a simple static server:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.
