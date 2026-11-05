'use strict'

const YotpoClient = require('../yotpo/YotpoClient')
const resolveReviewsConfig = require('./resolveReviewsConfig')

/**
 * @param {string} message The error message.
 * @returns {Error} An error with the code `EVALIDATION`.
 */
function validationError (message) {
  const error = new Error(message)
  error.code = 'EVALIDATION'
  return error
}

/**
 * Implementation of shopgate.catalog.addProductReviewVote.v1. Returns no counts, because Yotpo
 * answers without them; the PWA then raises the count it shows by one.
 * @param {Object} context The pipeline context.
 * @param {Object} input The pipeline input.
 * @param {string|number} input.reviewId The Yotpo review id.
 * @param {string} input.vote Either "up" or "down".
 * @returns {Promise<Object>}
 */
module.exports = async (context, input) => {
  const { reviewId, vote } = input || {}
  const id = reviewId === undefined || reviewId === null ? '' : String(reviewId)

  if (vote !== 'up' && vote !== 'down') {
    throw validationError('vote must be "up" or "down"')
  }

  // The pipeline is public and the id becomes part of the request path.
  if (!/^\d+$/.test(id)) {
    throw validationError('reviewId must be a numeric Yotpo review id')
  }

  const { enableReviews } = await resolveReviewsConfig(context)
  if (!enableReviews) {
    throw new Error('Yotpo reviews are not configured')
  }

  await new YotpoClient(context).vote(id, vote)

  return {}
}
