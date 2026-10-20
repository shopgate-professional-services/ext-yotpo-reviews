'use strict'

const YotpoClient = require('../yotpo/YotpoClient')

const RATING_SCALE_FACTOR = 20
const STARS = [5, 4, 3, 2, 1]
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 150
// Yotpo product ids allow only these characters; others could also alter the request path.
const PRODUCT_ID_PATTERN = /^[A-Za-z0-9_-]+$/
// Bounded so that a crafted cursor or offset on the public pipeline stays a page number Yotpo
// accepts; far larger positions make it answer 500.
const CURSOR_PATTERN = /^\d{1,9}$/
const MAX_POSITION = 999999999

// Shopgate sort value to Yotpo's V3 `sort` and `direction`. `smart` is Yotpo's relevance
// ranking ("Most relevant" in its widget); `votes_up` works although Yotpo does not document it.
// Unknown values send no sort.
const SORTS = {
  relevance: { sort: 'smart' },
  dateDesc: { sort: 'date' },
  dateAsc: { sort: 'date', direction: 'asc' },
  rateDesc: { sort: 'rating' },
  rateAsc: { sort: 'rating', direction: 'asc' },
  helpfulDesc: { sort: 'votes_up' }
}

/**
 * @param {*} value A pipeline input.
 * @param {number} fallback The value for a missing or invalid input.
 * @returns {number} A non-negative integer.
 */
function toCount (value, fallback) {
  return Number.isInteger(value) && value >= 0 ? value : fallback
}

/**
 * @param {*} value A Yotpo number.
 * @returns {number} The number, or 0 when it is not a finite number.
 */
function toNumber (value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/**
 * @param {string} [value] A Yotpo timestamp.
 * @returns {string|undefined} The timestamp, marked as UTC when Yotpo sent it without a zone.
 */
function toUtcDate (value) {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined
  }

  return /(Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`
}

/**
 * Builds the unfiltered rating summary from Yotpo's bottomline. A product without reviews gets
 * zeros, because a response without summary would keep the one the PWA stored before.
 * @param {Object} [bottomline] The Yotpo bottomline.
 * @returns {{ average: number, count: number, distribution: Object }}
 */
function buildRatingSummary (bottomline) {
  const { averageScore, totalReview, starDistribution: stars } = bottomline || {}
  const distribution = {}

  for (const star of STARS) {
    const count = stars && stars[star]
    distribution[star] = Number.isInteger(count) && count > 0 ? count : 0
  }

  return {
    // Rounded to one decimal star first, because the PWA shows `average / 20` with one decimal.
    average: Math.round(toNumber(averageScore) * 10) * (RATING_SCALE_FACTOR / 10),
    count: Number.isInteger(totalReview) && totalReview > 0 ? totalReview : 0,
    distribution
  }
}

/**
 * @param {Object} [customFields] Yotpo custom fields by field id.
 * @returns {Object[]} Label/value pairs with content.
 */
function mapCustomFields (customFields) {
  if (!customFields || typeof customFields !== 'object') {
    return []
  }

  return Object.keys(customFields)
    .map((key) => {
      const field = customFields[key] || {}
      const value = Array.isArray(field.value) ? field.value.join(', ') : field.value
      return {
        label: typeof field.title === 'string' ? field.title.trim() : '',
        value: value === undefined || value === null ? '' : String(value).trim()
      }
    })
    .filter(field => field.label && field.value)
}

/**
 * Maps a Yotpo review into the Shopgate review shape. Optional fields without data are left
 * out, because a missing value differs from `false` or an empty list.
 * @param {Object} row The Yotpo review.
 * @returns {Object}
 */
function mapReview (row) {
  const review = {
    id: String(row.id),
    rate: Math.round(toNumber(row.score) * RATING_SCALE_FACTOR),
    author: (row.user && row.user.displayName) || '',
    title: row.title || '',
    review: row.content || ''
  }

  const date = toUtcDate(row.createdAt)
  if (date) {
    review.date = date
  }

  if (typeof row.verifiedBuyer === 'boolean') {
    review.isVerified = row.verifiedBuyer
  }

  const comment = row.comment
  if (comment && typeof comment.content === 'string' && comment.content.trim().length > 0) {
    review.merchantReply = { reply: comment.content }
    const replyDate = toUtcDate(comment.createdAt)
    if (replyDate) {
      review.merchantReply.date = replyDate
    }
  }

  const media = (Array.isArray(row.imagesData) ? row.imagesData : [])
    .filter(image => image && typeof image.originalUrl === 'string' && image.originalUrl.length > 0)
    .map(image => ({ type: 'image', url: image.originalUrl }))
  if (media.length > 0) {
    review.media = media
  }

  const customFields = mapCustomFields(row.customFields)
  if (customFields.length > 0) {
    review.customFields = customFields
  }

  if (typeof row.votesUp === 'number' && typeof row.votesDown === 'number') {
    review.reviewVotes = { up: row.votesUp, down: row.votesDown }
  }

  return review
}

/**
 * Yotpo-backed implementation of shopgate.catalog.getProductReviews.v1. Runs only when Yotpo
 * reviews are enabled. A failed Yotpo request throws, so the PWA shows its error state.
 * @param {Object} context The pipeline context.
 * @param {Object} input Pipeline input.
 * @param {string} input.productId The requested product id.
 * @param {string} [input.baseProductId] The resolved base product id.
 * @param {string} [input.after] Cursor from the previous page: the Yotpo position to continue at.
 * @param {number} [input.offset] Number of reviews to skip when no cursor is sent.
 * @param {number} [input.limit] Page size.
 * @param {string} [input.sort] Shopgate sort value.
 * @param {boolean} [input.filterMedia] Keeps only reviews with images.
 * @param {number} [input.filterRate] Keeps only reviews with this number of stars (1-5).
 * @returns {Promise<{ reviews: Object[], totalReviewCount: number, cursors: (Object|undefined), ratingSummary: (Object|undefined) }>}
 */
module.exports = async (context, input) => {
  const productId = input.baseProductId || input.productId
  const client = new YotpoClient(context)
  // The cursor is Yotpo's row position, so a review that moves between two requests and that the
  // PWA de-duplicates cannot shift the next page.
  const requestedOffset = toCount(input.offset, 0)
  const offset = typeof input.after === 'string' && CURSOR_PATTERN.test(input.after)
    ? Number(input.after)
    : (requestedOffset <= MAX_POSITION ? requestedOffset : 0)
  const limit = Math.min(toCount(input.limit, DEFAULT_LIMIT), MAX_LIMIT)
  const perPage = Math.max(limit, 1)
  const sort = SORTS[input.sort]
  const filterRate = STARS.includes(input.filterRate) ? input.filterRate : null
  const filterMedia = input.filterMedia === true
  const isFiltered = filterRate !== null || filterMedia

  if (typeof productId !== 'string' || !PRODUCT_ID_PATTERN.test(productId)) {
    return {
      reviews: [],
      totalReviewCount: 0,
      ...(!isFiltered && { ratingSummary: buildRatingSummary() })
    }
  }

  const filters = isFiltered
    ? { ...(filterRate !== null && { scores: [filterRate] }), ...(filterMedia && { pictured: true }) }
    : undefined
  const fetchPage = page => client.getReviews(productId, { page, perPage, ...sort }, filters)

  // A position that is no multiple of the page size spans two Yotpo pages of the same size.
  const skip = limit === 0 ? 0 : offset % perPage
  const firstPage = limit === 0 ? 1 : Math.floor(offset / perPage) + 1
  const pages = skip === 0 ? [firstPage] : [firstPage, firstPage + 1]
  const responses = await Promise.all(pages.map(fetchPage))

  const rows = responses
    .map(response => (Array.isArray(response.reviews) ? response.reviews : []))
    .reduce((all, list) => all.concat(list), [])
  const first = responses[0]

  const pageRows = rows.slice(skip, skip + limit)
  const totalReviewCount = toCount(first.pagination && first.pagination.total, 0)
  const next = offset + pageRows.length

  const result = {
    reviews: pageRows
      .filter(row => row && row.deleted !== true)
      .map(mapReview),
    totalReviewCount
  }

  if (pageRows.length > 0 && next < totalReviewCount) {
    result.cursors = { after: String(next) }
  }

  if (!isFiltered) {
    result.ratingSummary = buildRatingSummary(first.bottomline)
  }

  return result
}
