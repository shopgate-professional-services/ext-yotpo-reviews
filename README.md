# Shopgate Connect – Yotpo Reviews (`@shopgate-project/yotpo-reviews`)

Shows [Yotpo](https://www.yotpo.com/) product reviews in the Shopgate app, using the
app's Reviews V2 UI (no Yotpo widgets).

> **Version 2.x requires a PWA with Reviews V2** (theme-ios11). Shops on an older PWA
> stay on 1.1.x, which embeds Yotpo's widgets.

## Quick setup (for Support)

1. Add the extension to the deployment.
2. Enter the shop's **Yotpo App Key** (`yotpoAppKey`) in the Connect admin. Without a
   key the extension behaves as if it were not installed and the shop keeps its default
   reviews.
3. App configuration: `hasReviews` on, `showWriteReview` **off** (see limits).

The Yotpo product id must equal the Shopgate base product id (for Shopify shops: the
Shopify product id). No secret key is needed; the app key is public.

## What the app shows

- Rating summary with average, number of reviews and star distribution on the product
  page and the reviews page.
- Review list with load more, sorting (relevance = Yotpo's "Most relevant", newest,
  oldest, best and worst rating, most helpful) and the filters "stars" and "with media".
- The same reviews as Yotpo's widgets on the web shop, including reviews without title
  from Shopify's Shop app.
- Verified buyer badge, merchant reply, review images, custom fields and helpfulness
  votes (thumbs up / down).

## Limits

- **No writing reviews in the app.** Yotpo's widget contained its own write form; 2.x
  does not. Keep `showWriteReview` off.
- No "verified only" filter: Yotpo cannot filter by it server-side.
- No videos.
- Custom fields are mapped but not verified with live data.
- The merchant reply shows no author name (Yotpo sends none).
- A vote first shows immediately on the device and can drop back to the old count on a
  later reload, until Yotpo counts it.
- Yotpo has no protection against repeated votes; the app allows one vote per review and
  device.
- Thumbnails load the original image.
- Rating stars on product lists and sliders are not from Yotpo; they show the shop's own
  rating.

## For developers

The constraints to know before changing the code are in [`AGENTS.md`](./AGENTS.md).

- `pipelines/`: overrides of `shopgate.catalog.getProductReviews.v1` and
  `shopgate.catalog.getProductReviewSettings.v1`, and
  `shopgate.catalog.addProductReviewVote.v1`.
- `extension/lib/`: Yotpo client and the pipeline steps; tests in `extension/test/`.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md).

## License

This extension is available under the Apache License, Version 2.0. See [LICENSE](./LICENSE).
