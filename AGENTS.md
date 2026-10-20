This file gives AI coding assistants and new developers a fast on-ramp. Keep it short
and update it in the same PR when behavior drifts from the code.

## Ground Rules

1. Ask, don't assume. If intent, architecture or requirements are unclear, ask before writing code.
2. Implement the simplest thing that works. No abstractions that weren't requested.
3. Don't touch code that isn't part of the task.
4. Say so when you are not confident about an approach or a technical detail.

## What this is

Shopgate Connect extension `@shopgate-project/yotpo-reviews`: a review provider for the
PWA's Reviews V2 UI (requires a PWA with Reviews V2 since 2.0.0). Backend only:
pipelines in `pipelines/`, steps in `extension/lib/`. No frontend component.

`extension/` is CommonJS in `standard` style (no semicolons), without a lint setup.

## Commands

- `extension/`: `npm test` (Jest, fakes `context.tracedRequest`, never calls Yotpo).

## Invariants

- Without `yotpoAppKey` the extension must behave as if not installed: the list
  pipeline's disabled branch copies the `@shopgate/reviews` + `@shopgate/bigapi` chain,
  and the settings step returns the default of `@shopgate/catalog` / `@shopgate/reviews`.
  Keep both in sync with upstream. `getProduct.v1` stays in the list pipeline because
  `checkIfCalledOnChild` needs `baseProductId`; when it fails, the Yotpo list fails too.
- Pipeline overrides: declare every new input and output on the pipeline and on the
  step. Which same-named definition wins next to Catalog is not guaranteed (locally the
  last upload wins).
- Reviews come from Yotpo's V3 storefront API
  (`/v3/storefront/store/{appKey}/product/{productId}/reviews`), the source of Yotpo's own
  widgets. Don't go back to V1 (`reviews.json`, `filter.json`): it leaves out reviews
  without title (Shopify Shop app, `isShop: true`), 25 of 337 on one product. Unfiltered
  lists use GET and carry the bottomline; filtered lists POST `{ scores, pictured }` to the
  same URL like Yotpo's widget, count correctly and have no bottomline, so only
  unfiltered responses carry `ratingSummary`.
- With an app key pagination is `cursor`: `cursors.after` is Yotpo's row position after
  the delivered page, and the next request continues there. Don't go back to `offset`:
  the PWA would send its de-duplicated store length, which falls behind Yotpo's position
  whenever the list changes between two requests (or the step drops a row; the `deleted`
  guard is defensive, V3 has no such field), and load more then never ends. No cursor means
  the last page. A position that is no multiple of `limit` reads two Yotpo pages and
  slices; if the CDN serves a short page, a review can be skipped.
- `addProductReviewVote.v1` is public and puts the review id into the request path:
  only numeric ids are forwarded. It returns no counts; the PWA raises its count by one.
  Yotpo checks neither the account nor repeats, so the pipeline is an anonymous vote proxy
  for any Yotpo review, from the shop's backend IP (as open as calling Yotpo directly).
- Product ids outside `^[A-Za-z0-9_-]+$` (Yotpo's rule) get an empty list without a request.
  The Yotpo product id must equal the Shopgate base product id (Shopify: product id).
- A failed Yotpo request, including a 200 without a `reviews` array, throws, so the PWA
  shows its error state with retry instead of "no reviews".

## Yotpo API facts (checked live on 2026-10-15 and 2026-10-20)

- The V3 storefront endpoint and the V1 vote endpoint accept server-side calls with the
  public app key (the vote endpoint even without it); no token, no bot challenge,
  although the V3 reference declares `X-Yotpo-Token`.
- V3 `sort`: `smart` (relevance), `date`, `rating`, `images`, `badge`, and `votes_up`,
  which is undocumented but works; `direction=asc` reverses. No sort means images first.
- V3 answers with `cache-control: no-cache, no-store`; how fast new reviews and votes
  appear is not verified (V1 documented up to 3 hours). Two pages can still come from
  different states when reviews or votes change between the requests.
- 29,900 requests per minute per IP, shared by all shops behind the cloud's egress IPs.
  `perPage` above 150 is silently capped.
- No server-side filter for verified buyers (`verifiedBuyer`/`verified` in the body are
  ignored). `videosData` has no playable URL, so videos are not mapped. `customFields` is
  mapped but was never filled in the test account. `productVariants` is not mapped.
- `createdAt` of reviews and replies comes without a time zone; it is treated as UTC.
- No duplicate-vote protection. Whether Yotpo drops repeated votes from one IP is not
  verified.
- An unknown product answers 200 with a count of 0; a wrong app key answers 404.

## Knowledge Base

Cross-service context: https://gitlab.localdev.cc/internal/knowledge-base. Don't copy
its content here.
