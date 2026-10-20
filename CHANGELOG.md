# Changelog
 All notable changes to this project will be documented in this file.
 The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## [2.0.0] - Unreleased
Requires a PWA with Reviews V2 (theme-ios11). Shops on an older PWA stay on 1.1.x.

### Added
- Added Yotpo as review provider for the Reviews V2 UI through overrides of `shopgate.catalog.getProductReviews.v1` and `shopgate.catalog.getProductReviewSettings.v1`.
- Added the rating summary with star distribution, sorting (relevance, date, rating, most helpful) and the filters "stars" and "with media".
- Added verified buyer badges, merchant replies, review images, custom fields and vote counts.
- Added helpfulness voting through `shopgate.catalog.addProductReviewVote.v1`.

### Changed
- The Yotpo App Key is now a backend setting. Without a key the shop's default reviews are used.

### Removed
- Removed the Yotpo widgets (reviews widget, bottom line and Yotpo's write form) and the `product.reviews` and `product.info.after` portals.

## [1.1.3] - 2020-05-28
- Fixed: font sizing for avg-score class

## [1.1.2] - 2020-05-28
- Fixed: removed toustart listener to prevent unwanted scrolling

## [1.1.1] - 2020-05-28
- Fixed: always show reviews of parent product

## [1.1.0] - 2019-04-30
- Added style rule to hide yotpo product slider
- Added aggregated star review in product header with scroll to functionality
- Updated potential bug to refresh widgets on unmounting.

## [1.0.3] - 2019-03-21
Fixed a typo.

## [1.0.2] - 2019-03-21
Additional styling.

## [1.0.1] - 2019-03-21
Correction for dev center.

## [1.0.0] - 2019-03-21
First version of the extension.
### Added
- Added support for Yotpo reviews on the connect platform.
- You can configure a Yotpo app key for specific merchant.
- Connect to write a Review is not included in this integration.

[1.1.1]: https://github.com/shopgate-professional-services/ext-yotpo-reviews/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/shopgate-professional-services/ext-yotpo-reviews/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/shopgate-professional-services/ext-yotpo-reviews/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/shopgate-professional-services/ext-yotpo-reviews/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/shopgate-professional-services/ext-yotpo-reviews/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/shopgate-professional-services/ext-yotpo-reviews/compare/v0.0.1...v1.0.0
