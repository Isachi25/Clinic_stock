# Clinic stock
Clinic stock is a responsive stock UI for browsing DummyJSON products, opening a shareable item page, and correcting stock counts.
Users can sign in, then search, filter, sort, and paginate stock, open a shareable item page, and correct a stock count.

## Live demo

[Clinic Stock](https://isachi25.github.io/Clinic_stock/)

This implementation follows the assessment brief and the original product notes below.
The stack is:
1. React.
2. TypeScript.
3. Vite.
4. Tailwind CSS.
5. TanStack Query.
6. React Router.

## Components and screen structure
The app has three main routes, all using the same application layout.

## Sign In — `/login`
Users can sign in with their username and password.
If someone tries to access a protected page while signed out, they are redirected to the login page.
After signing in, they can return to the page they originally requested.

## Stock List — `/items`
The main stock screen provides:
1. Search, category, and sorting filters.
2. A responsive list displayed as a table on larger screens and stacked cards on smaller tablet screens.
3. Key stock information such as: Item image, Name, SKU, Category, Stock count, Availability, etc.
4. Pagination with 10 items per page.
5. Clickable items that open their detail page.

Price is treated as secondary catalogue information and is therefore not a main column in the stock list.

Search waits briefly after the user stops typing before fetching results. This reduces unnecessary requests. Older requests cannot replace results for a newer search.
Changing the category or sort resets the page to 1. If a URL points to a page with no results, the app adjusts to the last available page.
Test slow requests under **Assessment test tools → Slow requests**, or add `?delay=2000`.

## Item Details — `/items/:id`
Each item has its own shareable detail page.
The page shows:
1. Item name, SKU, category, and images
2. Current stock count and availability
3. Catalogue information such as brand, description, and tags
4. A stock correction field for updating the quantity

When saving a stock correction, the Save button is disabled while the request is being processed.
If the update fails, the user is shown an error with an option to retry.

## Responsive & Accessible Design
The interface is designed primarily for tablet use, including narrower ward tablet screens. We avoid horizontal scrolling tables on small screens by switching to stacked cards. 
The app also includes accessible status messages so important events such as saving, session refreshes, and errors can be announced to screen-reader users.

## Navigation
The app uses separate list and detail routes rather than a split-pane layout. This makes individual item pages easy to open, share, and navigate to directly.

## State ownership and why
Server data, URL state, and local UI state are kept separate because they have different responsibilities.

### URL = where the user is
Lives in URL query params and route params.
Includes: selected item id, search term, category filter, sort selection, page.
Why: users share links in chat, so view state must be reproducible from URL alone.

### TanStack Query = data from the server
Includes: stock items, categories, and server-confirmed quantities.
Why: this data is shared, asynchronous, and needs stale/fresh tracking and refetch controls.

### Local state = temporary UI/input state
Lives in the component state scoped to the page.
Includes: search box text before debounce, form draft input, inline validation.
Why: this state is transient, view-specific, and should not pollute server cache or URL.

### sessionStorage = authentication tokens
Authentication tokens are kept separately in sessionStorage.
Why: they need to survive a page refresh but should disappear when the browser tab is closed.

## Fetch, cache, and invalidation
On stock correction:
* Send the correction to the server.
* Disable the Save button while the request is in progress.
* Wait for a successful response before treating the correction as saved.
* On success, update the product in the cache because DummyJSON does not persist PUT updates.
* On failure, keep the original value and show an error with a Retry action.
  
## Layout, spacing, colour, and typography
1. Layout: responsive layouts for each route. The list uses a table on larger screens and stacked cards on smaller screens.
2. Spacing: Tailwind spacing scale (2/4/6/8 rhythm).
3. Colour: semantic stock colours (in stock, low, out of stock) with a text label so status is not colour-only.
4. Typography: Tailwind sans stack, `text-sm` metadata, `text-base` body, `text-lg` headings.

## Accessibility approach
* Keyboard accessible: tab order follows the visual order; a skip link moves directly to the main content.
  Search, selects, pagination, and actions use native `<input>`, `<select>`, `<button>`, and `<a>` elements.
* Visible focus: interactive elements have a clear focus ring; `outline: none` is not used without a replacement.
* Labels: every form control has a visible label rather than relying on placeholder text.
* Stock list: the table uses proper headers. At 360px, cards still show the item name and stock count as text.
  Low-stock status is shown as text alongside the stock number.
* Stock form: the stock field has an associated `<label>`. Validation uses `aria-invalid` and `aria-describedby`.
* Navigation and errors: document titles update when routes change.
  When a page-level error occurs, focus moves to the error heading.
* Touch-friendly: primary controls target roughly 44px (`min-h-11`) where practical.
* Small screens: usable at 360px with a stacked toolbar, no wide table, cards instead.

## Tooling
* Prettier (`npm run format`, `npm run format:check`)
* ESLint with TypeScript strict type-checked rules, `eqeqeq`, `curly`, `no-console`, and `consistent-type-imports`
* commitlint + husky `commit-msg` hook (Conventional Commits, e.g. `feat: add stock list pagination`)
* `.editorconfig`
* GitHub Actions: `.github/workflows/ci.yml` fails on format, lint, test or build errors. Pull requests also run commitlint on the PR range.
* GitHub Pages deploy: `.github/workflows/pages.yml` (enable Pages: Settings → Pages → GitHub Actions).

## DummyJSON limitations
DummyJSON simulates `PUT` updates but does not persist them. The PUT response contains the updated product, but a later GET returns the original catalogue value.
After a successful correction, the app writes the PUT response into the TanStack Query cache instead of immediately invalidating and refetching.
This keeps the corrected value visible during the current session.
A full reload can return the original catalogue value again because the mock API does not persist writes.

## Out of scope
The following are intentionally not implemented in this version:
* Offline mutation queue.
* Bulk stock correction.
* Virtualisation of the full catalogue.
* Multi-clinic stock management.
These were excluded because DummyJSON does not provide the required persistent or clinic-specific data, and the assessment focuses on the required stock workflow.

## Decision log
1. Decision: Separate list and detail routes (/items, /items/:id).
   Rejected: Split-pane list/detail on one route.
   Why: Item URLs must be pasteable in chat. Split-pane makes deep links, history, and 360px layout harder.

2. Decision: URL state, TanStack Query, and local UI state stay separate.
   Rejected: One global store for filters, tokens, and server rows.
   Why: Shared links and reload are URL problems. Cache/staleness is a server-data problem. Mixing them makes “why did refresh lose my search?” hard to answer.

3. Decision: After a successful stock PUT, update the cache from the PUT body; do not invalidate GET.
   Rejected: Standard “mutate then invalidateQueries”.
   Why: DummyJSON does not persist writes. Invalidate would refetch the old count and look like a product bug. A real clinic API would invalidate.

4. Decision: Expired session → refresh, then /login with ReturnToRoute; never an empty shell.
   Rejected: if (!token) return null, or /login that drops the list query / item id.
   Why: The brief requires preserving the user's place and avoiding a blank screen when the 1-minute token expires.

5. Decision: No clinicId and no offline write queue in v1.
   Rejected: Modelling “stock by clinic” or queuing corrections while offline.
   Why: The API is a single fake catalogue. Multi-clinic and durable writes are not in the data. Optional extras must not crowd out search races, URL restore, and error recovery.
