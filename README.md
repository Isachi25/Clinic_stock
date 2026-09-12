# Clinic stock

Clinic stock is a responsive stock console for browsing DummyJSON products, opening a shareable item page, and correcting stock counts.

This implementation follows the assessment brief and the original product notes below. The stack is **React + TypeScript + Vite + Tailwind + TanStack Query + React Router**. React is the right fit here: the brief allows any modern framework, TypeScript is encouraged, and this README already specified React for typed domain modelling and shared UI conventions.

## Sign in — `/login`

Users sign in with username and password. Login requests `expiresInMins: 1` so the access token expires while you test.

Protected routes redirect to `/login` and then return to the page the user originally asked for, including query params.

When the access token is close to expiry, the app refreshes it in the background. The current screen stays mounted (no blank page). If refresh fails, the user is sent to sign in with a message, and after login they land back on the same URL.

## Stock list — `/items`

1. Search, category, and sort live in the URL (`q`, `category`, `sort`, `page`).
2. Table on `md` screens and up; stacked cards below that, including 360px.
3. Each row shows image, name, SKU, category, stock count and availability text.
4. Pagination is 10 items per page.
5. Items open `/items/:id`.

Price is secondary catalogue data, so it is not a list column.

Search is debounced, then written to the URL. Results are shown only when the box matches a completed request for that query. Older in-flight responses cannot replace a newer query. Verify with **Assessment test tools → Slow requests**, or add `?delay=2000`.

Changing category or sort resets to page 1. If a copied URL still points at a page past the last result, the page is clamped so the user is not left on an empty page.

## Item details — `/items/:id`

Shareable route. Shows name, SKU, category, images, stock, brand, description and tags, plus a stock correction form.

While a save is in progress, Save is disabled. On failure the previous server value stays on screen and Retry is offered.

## Assessment test tools

In the footer:

- **Slow requests** adds DummyJSON `delay=2000`.
- **Force error** sends list/detail/category/update requests to `GET /http/500` so you can exercise loading, error and retry.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run test
npm run lint
npm run format:check
npm run build
```

Test credentials (any user from [dummyjson.com/users](https://dummyjson.com/users)): `emilys` / `emilyspass`.

## Tooling

- Prettier (`npm run format`, `npm run format:check`)
- ESLint with TypeScript strict type-checked rules, `eqeqeq`, `curly`, `no-console`, and `consistent-type-imports`
- commitlint + husky `commit-msg` hook (Conventional Commits, e.g. `feat: add stock list pagination`)
- `.editorconfig`
- GitHub Actions: `.github/workflows/ci.yml` fails on format, lint, test or build errors. Pull requests also run commitlint on the PR range.
- GitHub Pages deploy: `.github/workflows/pages.yml` (enable Pages: Settings → Pages → GitHub Actions)

## DummyJSON limitations

1. **Search cannot be combined with category on the server.** If both are set, the app calls `/products/search` with `limit=0`, filters by category in the client, then paginates. Search-only and category-only still use server `limit`/`skip`.
2. **PUT `/products/{id}` does not persist.** DummyJSON echoes the update. After a successful save we write that response into the TanStack Query cache so this session shows the new count. A full reload fetches the original catalogue value again.
3. **Product routes are public.** Auth is enforced in the app (`/auth/login`, `/auth/me`, `/auth/refresh`) before stock screens render. Tokens live in `sessionStorage` so they survive refresh and disappear when the tab closes.
4. **There is no clinic concept in DummyJSON.** The earlier clinic-filter notes are not implemented against this mock. Category is the catalogue grouping the API actually has.
5. **Offline correction queue** from the original notes is not implemented: the mock API is online-only and does not keep writes. Failed saves stay on the form with Retry.

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

_/Price is treated as secondary catalogue information and is therefore not a main column in the stock list./_

## Item Details — `/items/:id`

Each item has its own shareable detail page.

The page shows:

1. Item name, SKU, category, and images
2. Current stock count and availability
3. Catalogue information such as brand, description, and tags
4. A stock correction field for updating the quantity

_/When saving a stock correction, the Save button is disabled while the request is being processed. If the update fails, the user is shown an error with an option to retry./_

## Responsive & Accessible Design

The interface is designed primarily for tablet use, including narrower ward/tablet screens.
We avoid horizontal scrolling tables on small screens by switching to stacked cards.
The app also includes accessible status messages so important events such as saving, session refreshes, and errors can be announced to screen-reader users.

## Navigation

The app uses separate list and detail routes rather than a split-pane layout. This makes individual item pages easy to open, share, and navigate to directly.

## State ownership and why

Server data, URL state, and local UI state are kept separate because they have different responsibilities.

### URL = where the user is

Lives in URL query params and route params.
Includes: selected item id, search term, category filter, sort selection, page.
_/Why: users share links in chat, so view state must be reproducible from URL alone/_

### TanStack Query = data from the server

Includes: stock items, categories, and server-confirmed quantities.
_/Why: this data is shared, asynchronous, and needs stale/fresh tracking and refetch controls/_

### Local state = temporary UI/input state

Lives in the component state scoped to the page.
Includes: search box text before debounce, form draft input, inline validation.
_/Why: this state is transient, view-specific, and should not pollute server cache or URL/_

### sessionStorage = authentication tokens

Authentication tokens are kept separately in sessionStorage.
_/Why: They need to survive a page refresh but should disappear when the browser tab is closed./_

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

## Accessibility approach

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

## Decision log

1. Decision: Keep filters and selected item in URL state.
   Alternative rejected: Keep all selection/filter state only in local component state.
   Why rejected: Users share item links over chat; local-only state breaks reproducibility.

2. Decision: Use TanStack Query for stock data.
   Alternative rejected: Fetch directly in each component with ad-hoc `useEffect` and local state.
   Why rejected: Ad-hoc fetches duplicate logic and make invalidation/error handling inconsistent.

3. Decision: Use React + TypeScript + Tailwind.
   Alternative rejected: Continue plain static JavaScript/CSS only.
   Why rejected: Static-only setup is quick for prototype work but scales poorly for typed domain modelling and shared UI conventions.

4. Decision: Hide list results until the search box matches a completed request.
   Alternative rejected: `placeholderData` / keep-previous-data while the next search loads.
   Why rejected: On a slow connection that would flash results for a query the user has already replaced.
