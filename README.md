# Clinic_stock

Clinic stock is a responsive stock management interface for browsing products, viewing product details, and updating stock quantities.
Users should be able to search, filter, sort, paginate, view, and update product stock, with URL-driven navigation, cached API data, responsive layouts, accessibility support, and efficient loading/error states.

## Components and Screen Structure

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

## Item Details — `/items/:id`

Each item has its own shareable detail page.

The page shows:

1. Item name, SKU, category, and images
2. Current stock count and availability
3. Catalogue information such as brand, description, and tags
4. A stock correction field for updating the quantity

*/When saving a stock correction, the Save button is disabled while the request is being processed. If the update fails, the user is shown an error with an option to retry./*

## Responsive & Accessible Design

The interface is designed primarily for tablet use, including narrower ward/tablet screens.
We avoid horizontal scrolling tables on small screens by switching to stacked cards.
The app also includes accessible status messages so important events such as saving, session refreshes, and errors can be announced to screen-reader users.

## Navigation

The app uses separate list and detail routes rather than a split-pane layout. This makes individual item pages easy to open, share, and navigate to directly.


## State ownership and why

Server data, URL state, and local UI state are kept separate because they have different responsibilities

### URL = where the user is
Lives in URL query params and route params
Includes: selected item id, search term, category filter, clinic filter, sort selection
*/Why: users share links in chat, so view state must be reproducible from URL alone*/

### TanStack Query = data from the server
Includes: stock items, categories, clinic metadata, and server-confirmed quantities
*/Why: this data is shared, asynchronous, and needs stale/fresh tracking and refetch controls*/
  
### Local state = temporary UI/input state
Lives in the component state or local store scoped to the page
Includes: open/closed panels, form draft input, inline validation, etc.
*/Why: this state is transient, view-specific, and should not pollute server cache or URL*/

### sessionStorage = authentication tokens
Authentication tokens are kept separately in sessionStorage. 
*/Why: They need to survive a page refresh but should disappear when the browser tab is closed.*/


## Fetch, cache, and invalidation

Fetch → Get the latest data from the server.
Cache → Keep data locally so it can be displayed quickly.
Invalidate → Mark cached data as potentially outdated and fetch it again when needed.

### Fetch
Fetch stock data per clinic using cache keys like `['stock', clinicId]`
When the user opens the stock list, the app first checks whether the data is already available in the cache. If not, it fetches the data from the server.

### Cache
Fetched data will be stored temporarily in the cache. */This prevents the app from requesting the same data every time the user changes screens.*/
This will particularly be useful on a weak or slow connection.
Cached data can be displayed immediately while the app checks the server for a newer version.
*/Data that changes rarely, such as clinics and categories, can stay cached for longer. Stock counts change more frequently, so they are refreshed more often.*/

On stock correction:
* Update the corrected item in cache for instant feedback
* The change is then sent to the server
* On success, the affected cached stock data is marked as outdated. TanStack Query can then fetch the latest server data to make sure the cache matches the server.
* On failure, remove the temporary change and restore the original value. Return error and Retry option.
  - 
For offline periods:
* Queue correction requests locally
* Resent the queued updates to the server once the connectivity returns
* Invalidate related stock queries. */Helps the app refresh its data and stay up to date with the server.*/

## Layout, spacing, colour, and typography
1. Layout: responsive split view (list + detail), stacking on narrow screens
2. Spacing: consistent spacing scale (Tailwind spacing tokens, e.g. 2/4/6/8 rhythm)
3. Colour: semantic colors for status (normal, warning, critical-low-stock) with accessible contrast
4. Typography: use Tailwind default sans stack initially, with clear hierarchy (`text-sm` metadata, `text-base` body, `text-lg` headings)
5. Theme/tokens: start with Tailwind defaults, then introduce clinic design tokens (brand, status, spacing aliases) in theme extension for multi-clinic rollout consistency
*/Faster to implement than a custom token system.*/
*/Less code and configuration — good when you're short on time.*/
*/Consistent styling*/

## Accessibility approach
5. Accessibility
Keyboard accessible: tab order follows the visual order; a skip link moves directly to the main content.
Search, selects, pagination, and actions use native <input>, <select>, <button>, and <a> elements.
Visible focus: interactive elements have a clear focus ring; outline: none is not used without a suitable replacement.
Labels: every form control has a visible label rather than relying on placeholder text.
Stock list: the table uses proper headers. At 360px, cards still show the item name and stock count as text, so information is never conveyed by colour alone.
Low-stock status is shown as text alongside the stock number.
Stock form: the stock field has an associated <label>. Validation uses aria-invalid and connects the error message with aria-describedby.
Save is a real button rather than a clickable <div>.
Navigation and errors: document titles update when routes change (for example, Item — Clinic stock). When a page-level error occurs, focus moves to the error heading so keyboard and screen-reader users are not left wondering what happened.
Touch-friendly: primary controls target roughly 44px touch areas where practical.
Small screens: the interface remains usable at 360px with a stacked toolbar, no horizontal page scrolling, and cards replacing the wider table layout.g

## Decision log

1. Decision: Keep filters and selected item in URL state.
   Alternative rejected: Keep all selection/filter state only in local component state.
   Why rejected: Users share item links over chat; local-only state breaks reproducibility.

2. Decision: Use cached server-state tooling (React Query pattern) for stock data.
   Alternative rejected: Fetch directly in each component with ad-hoc `useEffect` and local state.
   Why rejected: Ad-hoc fetches duplicate logic, weaken offline behavior, and make invalidation/error handling inconsistent.

3. Decision: Use React + TypeScript + Tailwind for rollout implementation.
   Alternative rejected: Continue plain static JavaScript/CSS only.
   Why rejected: Static-only setup is quick for prototype work but scales poorly for multi-clinic maintainability, typed domain modeling, and shared UI conventions.

## Run locally

Serve with a simple static server:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.
