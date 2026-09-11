# Clinic_stock — Section 1 design

Clinic_stock is an internal clinic supplies console. DummyJSON’s product catalogue is the stock catalogue. We do not invent clinic IDs, wards, or clinical fields the API does not return.

Users sign in, then search, filter, sort, and paginate stock, open a shareable item page, and correct a stock count. The UI must stay usable on ward tablets (~360px), on a keyboard only, and on patchy wifi (slow responses, failures, refresh).

## Preferred stack

React — component-driven UI
TypeScript — typed routes, API payloads, and form state
Vite — local dev server and production build (not python -m http.server)
React Router — /login, /items, /items/:id
TanStack Query — server cache, mutations, retries
Tailwind CSS — start from Tailwind defaults, then extend a small clinic theme (status colour, spacing). We are not building a separate token system on day one.

## Screens and components

Three routes, one shell.

Shell — AppLayout
Header: app name (Clinic_stock), signed-in user, sign out
Main landmark + skip link
Route outlet
aria-live region for save / session / error announcements (not toast-only)
LoadingState, ErrorState, and EmptyState are used on every data screen. Error always includes a way to recover (Retry).

Sign in — /login
LoginForm (username, password)
AuthGuard on /items and /items/:id
ReturnToRoute: protected URLs are remembered; after sign-in the user continues there (same item, same list query)
Login requests expiresInMins: 1 so expiry can be tested in a real session.
If the access token dies mid-session: try POST /auth/refresh once (also expiresInMins: 1). If refresh fails, go to /login with the current path + query as the return URL. Do not render an empty shell (if (!user) return null). While session is being restored, show LoadingState.

Stock list — /items
StockToolbar: search, category, sort (sort + order)
StockTable from ~768px up
StockCardList on small / tablet widths (no sideways-scrolling table at 360px)
PaginationControls: 10 items per page
StockRow / StockCard: thumbnail, name (title), SKU, category, stock, availability
Price is catalogue leftover. It is not a primary list column; it can appear on detail.

Item detail — /items/:id
Shareable. A colleague can paste the URL and open the same item.
ItemHeader: name, SKU, category
ItemGallery: images from the API
StockStatus: current stock + availabilityStatus
CatalogueMeta: brand, description, tags (labelled as catalogue fields)
StockCorrectionForm: number input, Save, pending, error, Retry
Unknown id → ErrorState with a link back to /items, not a blank page.

State ownership
Server data, URL state, and local UI state are kept separate.
URL = where the user is
Location
Meaning
/items/:id
which item
q
search text
category
DummyJSON category slug, or empty = all
sort
field, e.g. title or stock
order
asc or desc
page

1-based page
Why here: reload, copied links, and opening the URL on another machine must restore the same list or item. This state does not belong in TanStack Query or a global store.
The search input may hold a draft string locally; we debounce before writing q to the URL so we do not create a history entry per keystroke.

TanStack Query = data from DummyJSON
Current user (GET /auth/me)
Categories (GET /products/categories)
List pages, keyed by { q, category, sort, order, page }
One product, keyed by id
Why here: async, shared across routes, needs cache and staleness. There is no clinicId in the API, so it is not part of the query key.
Local UI = short-lived interaction
Search draft before debounce
Stock field draft and inline validation
Form submitting / Retry focus
Transient banners
Why here: it should not be encoded in the URL or treated as server truth.
sessionStorage = tokens
accessToken and refreshToken per tab
Why: survive refresh in this tab; clear when the tab closes (shared ward tablet)

## Fetch, cache, and invalidation

### Fetch
DummyJSON is one catalogue. Typical calls:
List: GET /products?limit=&skip=&sortBy=&order=&select=
Search: GET /products/search?q=
Category: GET /products/category/{slug}
Detail: GET /products/{id}
Correct: PUT /products/{id} with { stock }
skip = (page - 1) * 10. List select keeps payloads small on weak wifi (id,title,sku,category,stock,availabilityStatus,thumbnail).
DummyJSON cannot search and filter by category on the server. If both q and category are set: use search, then keep rows whose category matches. Limitation belongs in the README, not a fake clinicId API.
Stale search: debounce URL updates (~300ms). Ignore (or abort) list responses that do not match the current URL. Verify with DummyJSON ?delay=2000.
No empty stranded page: changing q, category, sort, or order resets page to 1. If a response still has skip >= total and total > 0, clamp to the last page that has rows (covers hand-typed ?page=99).
Error testing: exercise ErrorState against DummyJSON GET /http/500 (dev flag or test adapter), not a fake clinic error channel.

### Cache
List/detail: short staleTime so returning to the list can refresh — except we must not refetch in a way that destroys a successful mock PUT (below)
Categories: longer staleTime (they barely change)
Show cached list/detail on revisit when it is still valid so route changes feel cheap on weak wifi
Stock correction (important API limit)
DummyJSON simulates PUT. It returns the updated product; it does not save it. A later GET returns the old stock.

On Save:
Disable Save; announce “Saving…”
PUT /products/{id}
On success: write the PUT response into the Query cache for that item (and patch that id in any cached list pages). Do not invalidate/refetch GET — refetch would snap the count back and look like our bug. Show a short note: correction is session-only against this mock.
On failure: keep the draft, restore the last cached server value on screen, show ErrorState / inline error, offer Retry
Out of scope for v1 (optional later)
Offline mutation queue, bulk correction, virtualising all 194 rows. An online/offline banner is optional only after required behaviour is solid. Queuing PUTs is not in v1: the mock does not persist, and the brief says not to spend required-path budget on extras.

## Layout, spacing, colour, typography
Layout: /items and /items/:id. Table on larger screens, cards on small tablets. Max width ~1100px list, narrower detail/login. Sticky header. Pagination after the list in tab order.
Spacing: Tailwind scale, 2/4/6/8 rhythm.
Colour: Tailwind defaults plus a small theme extension: accent, warning, critical/low-stock, error. Status is never colour-only (always text: stock number + availabilityStatus). Contrast at least WCAG AA.
Typography: Tailwind sans stack. Body text-base (16px); meta text-sm; titles text-lg. No 12px table text on a tablet.
Tokens: default-first, then theme.extend for brand/status. Not a custom token package on day one.
Motion: short or none. Skeletons must not hide a failed request.

## Accessibility
Keyboard: real <input>, <select>, <button>, <a>; skip link to main; visible focus (no outline-none without a replacement)
Labels on every control (not placeholder-only)
aria-live for saving, session, and errors
After a page-level error, focus the error heading
Document title updates per route
~44px targets for tablet
Readable at 360px: stacked toolbar, no page-level horizontal scroll

## Decision log
Decision: Separate list and detail routes (/items, /items/:id).
Rejected: Split-pane list/detail on one route.
Why: Item URLs must be pasteable in chat. Split-pane makes deep links, history, and 360px layout harder.

Decision: URL state, TanStack Query, and local UI state stay separate.
Rejected: One global store for filters, tokens, and server rows.
Why: Shared links and reload are URL problems. Cache/staleness is a server-data problem. Mixing them makes “why did refresh lose my search?” hard to answer.

Decision: Tailwind defaults first, then extend tokens.
Rejected: A full custom token system before any screen exists.
Why: Faster to a usable console; still a clean path to clinic colours/status. We will say in the README which parts are defaults vs theme.extend.

Decision: After a successful stock PUT, update the cache from the PUT body; do not invalidate GET.
Rejected: Standard “mutate then invalidateQueries”.
Why: DummyJSON does not persist writes. Invalidate would refetch the old count and look like a product bug. A real clinic API would invalidate.

Decision: Expired session → refresh, then /login with ReturnToRoute; never an empty shell.
Rejected: if (!token) return null, or /login that drops the list query / item id.
Why: The brief forbids losing place and forbids a blank screen when the 1-minute token dies.

Decision: No clinicId and no offline write queue in v1.
Rejected: Modelling “stock by clinic” or queuing corrections while offline.
Why: The API is a single fake catalogue. Multi-clinic and durable writes are not in the data. Optional extras must not crowd out search races, URL restore, and error recovery.


DummyJSON limits to record in the README (when we build)
Product routes are public; the app still gates on login

PUT/POST do not persist
No combined search + category endpoint
expiresInMins: 1 is for testing expiry, not a production session length
Local run

Documented after scaffolding. Expected: npm install then npm run dev (Vite). python -m http.server is the wrong runner for this stack.
