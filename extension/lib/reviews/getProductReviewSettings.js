'use strict'

const resolveReviewsConfig = require('./resolveReviewsConfig')

const FEATURES = ['filterRate', 'filterMedia', 'ratingSummary', 'reviewVotes']
const SORT_OPTIONS = ['relevance', 'dateDesc', 'dateAsc', 'rateDesc', 'rateAsc', 'helpfulDesc']

/**
 * Implementation of shopgate.catalog.getProductReviewSettings.v1.
 * Reports the Yotpo capabilities only while the review list is served from Yotpo; otherwise
 * the default of `@shopgate/catalog` / `@shopgate/reviews`.
 * @param {Object} context The pipeline context.
 * @returns {Promise<Object>}
 */
module.exports = async (context) => {
  const { enableReviews } = await resolveReviewsConfig(context)

  return {
    features: enableReviews ? FEATURES : [],
    paginationType: enableReviews ? 'cursor' : 'offset',
    customFields: [],
    sortOptions: enableReviews ? SORT_OPTIONS : []
  }
}
