# Clinic stock

Clinic stock is a responsive stock UI for browsing DummyJSON products, opening a shareable item page, and correcting stock counts.

Authorized users will be able to sign in, then search, filter, sort, and paginate stock, open a shareable item page, and correct a stock count.

## Live demo

[Clinic Stock]([https://isachi25.github.io/Clinic_stock/](https://isachi25.github.io/Clinic_stock/))

This implementation follows the assessment brief and the original product notes below. 

The stack is **React + TypeScript + Vite + Tailwind + TanStack Query + React Router**.

## Components and screen structure

The app has three main routes, all using the same application layout.

## Sign In — `/login`

Users can sign in with their username and password.

If someone tries to access a protected page while signed out, they are redirected to the login page. After signing in, they can return to the page they originally requested.

## Stock List — `/items`

The main stock screen provides:

1. Search, category, and sorting filters
2. A responsive list that displays as: A table on larger screens and stacked cards on smaller tablet screens
3. Key stock information such as: Item image, Name, SKU, Category, Stock count, Availability, etc.
4. Pagination with 10 items per page
5. Clickable items that open their detail page

*/Price is treated as secondary catalogue information and is therefore not a main column in the stock list./*

Search is debounced, then written to the URL. Results are shown only when the box matches a completed request for that query. Older in-flight responses cannot replace a newer query. Verify with **Assessment test tools → Slow requests**, or add `?delay=2000`.

Changing category or sort resets to page 1. If a copied URL still points at a page past the last result, the page is clamped so the user is not left on an empty page.

The app prevents stale responses from replacing results for a newer search query. This is important on slow connections where an older request may finish after the user has already entered a different query.

## Item Details — `/items/:id`

Each item has its own shareable detail page.

The page shows:

1. Item name, SKU, category, and images
2. Current stock count and availability
3. Catalogue information such as brand, description, and tags
4. A stock correction field for updating the quantity

*/When saving a stock correction, the Save button is disabled while the request is being processed. If the update fails, the user is shown an error with an option to retry./*

## Responsive & Accessible Design

The interface is designed primarily for tablet use, including narrower ward tablet screens. We avoid horizontal scrolling tables on small screens by switching to stacked cards. The app also includes accessible status messages so important events such as saving, session refreshes, and errors can be announced to screen-reader users.

## Navigation

The app uses separate list and detail routes rather than a split-pane layout. This makes individual item pages easy to open, share, and navigate to directly.

## State ownership and why

Server data, URL state, and local UI state are kept separate because they have different responsibilities.

### URL = where the user is

Lives in URL query params and route params.
Includes: selected item id, search term, category filter, sort selection, page.
*/Why: users share links in chat, so view state must be reproducible from URL alone/*

### TanStack Query = data from the server

Includes: stock items, categories, and server-confirmed quantities.
*/Why: this data is shared, asynchronous, and needs stale/fresh tracking and refetch controls/*

### Local state = temporary UI/input state

Lives in the component state scoped to the page.
Includes: search box text before debounce, form draft input, inline validation.
*/Why: this state is transient, view-specific, and should not pollute server cache or URL/*

### sessionStorage = authentication tokens

Authentication tokens are kept separately in sessionStorage.
*/Why: They need to survive a page refresh but should disappear when the browser tab is closed./*

## Fetch, cache, and invalidation

On stock correction:

- Send the correction to the server.
- Disable the Save button while the request is in progress.
- Wait for a successful response before treating the correction as saved.
- On success, apply the API response to the product cache (DummyJSON will not persist it).
- On failure, retain the original server value and show an error with a Retry action.



## Layout, spacing, colour, and typography

1. Layout: responsive layouts for each route. The list uses a table on larger screens and stacked cards on smaller screens.
2. Spacing: Tailwind spacing scale (2/4/6/8 rhythm)
3. Colour: semantic stock colours (in stock, low, out of stock) with a text label so status is not colour-only
4. Typography: Tailwind sans stack, `text-sm` metadata, `text-base` body, `text-lg` headings



## Accessibility approach(AI)

- Keyboard accessible: tab order follows the visual order; a skip link moves directly to the main content.
Search, selects, pagination, and actions use native `<input>`, `<select>`, `<button>`, and `<a>` elements.
- Visible focus: interactive elements have a clear focus ring; `outline: none` is not used without a replacement.
- Labels: every form control has a visible label rather than relying on placeholder text.
- Stock list: the table uses proper headers. At 360px, cards still show the item name and stock count as text.
Low-stock status is shown as text alongside the stock number.
- Stock form: the stock field has an associated `<label>`. Validation uses `aria-invalid` and `aria-describedby`.
- Navigation and errors: document titles update when routes change.
When a page-level error occurs, focus moves to the error heading.
- Touch-friendly: primary controls target roughly 44px (`min-h-11`) where practical.
- Small screens: usable at 360px with a stacked toolbar, no wide table, cards instead.



## Tooling (AI)

- Prettier (`npm run format`, `npm run format:check`)
- ESLint with TypeScript strict type-checked rules, `eqeqeq`, `curly`, `no-console`, and `consistent-type-imports`
- commitlint + husky `commit-msg` hook (Conventional Commits, e.g. `feat: add stock list pagination`)
- `.editorconfig`
- GitHub Actions: `.github/workflows/ci.yml` fails on format, lint, test or build errors. Pull requests also run commitlint on the PR range.
- GitHub Pages deploy: `.github/workflows/pages.yml` (enable Pages: Settings → Pages → GitHub Actions)



## DummyJSON limitations

DummyJSON simulates `PUT` updates but does not persist them. The PUT response contains the updated product, but a later GET returns the original catalogue value.

After a successful correction, the app writes the PUT response into the TanStack Query cache instead of immediately invalidating and refetching. This keeps the corrected value visible during the current session.

A full reload can return the original catalogue value again because the mock API does not persist writes.

## Out of scope(AI)

The following are intentionally not implemented in this version:

- Offline mutation queue
- Bulk stock correction
- Virtualisation of the full catalogue
- Multi-clinic stock management

These were excluded because DummyJSON does not provide the required persistent or clinic-specific data, and the assessment focuses on the required stock workflow.

## Decision log

1. Decision: Keep filters and selected item in URL state.
  Alternative rejected: Keep all selection/filter state only in local component state.  Why rejected: Users share item links over chat; local-only state breaks reproducibility.
2. Decision: Use TanStack Query for stock data.
  Alternative rejected: Fetch directly in each component with ad-hoc `useEffect` and local state.  
   Why rejected: Ad-hoc fetches duplicate logic and make invalidation/error handling inconsistent.
3. Decision: Hide list results until the search box matches a completed request. Rejected: `placeholderData` / keep-previous-data while the next search loads.hy rejected: On a slow connection that would flash results for a query the user has already replaced.

1. Decision: Preserve the current URL when an expired session requires sign-in.Alternative rejected: Redirect to `/login` without the original route.Why rejected: Users should return to the item or filtered list they were viewing instead of losing their place.
2. **Decision:** Separate list and detail routes (`/items`, `/items/:id`).
  - **Rejected:** Split-pane list/detail on one route.
  - **Why:** Item URLs must be pasteable in chat. Split-pane makes deep links, history, and 360px layout harder.
3. 

