'use strict'

const { promisify } = require('util')

const CDN_URI = 'https://api-cdn.yotpo.com'
const API_URI = 'https://api.yotpo.com'
const REQUEST_TIMEOUT = 8000

/**
 * Talks to Yotpo's storefront reviews API with the public app key. Results are not cached.
 * Reviews come from the V3 storefront API, which Yotpo's own widgets use; V1 leaves out
 * reviews without title (Shopify Shop app). Votes exist only in V1.
 */
class YotpoClient {
  /**
   * @param {Object} context The pipeline context.
   */
  constructor ({ config, tracedRequest, log }) {
    const appKey = config && typeof config.yotpoAppKey === 'string' ? config.yotpoAppKey.trim() : ''
    this.appKey = encodeURIComponent(appKey)
    this.tracedRequest = tracedRequest
    this.log = log
  }

  /**
   * Reads one page of the reviews of a product. Without filters Yotpo adds the unfiltered
   * bottomline; with filters the count respects them and there is no bottomline.
   * @param {string} productId The Yotpo product id.
   * @param {Object} qs `page`, `perPage` and optionally `sort` and `direction`.
   * @param {Object} [filters] `scores` and/or `pictured`, sent as POST body like Yotpo's widget.
   * @returns {Promise<Object>} The Yotpo body with `pagination`, `bottomline` and `reviews`.
   */
  async getReviews (productId, qs, filters) {
    const uri = `${CDN_URI}/v3/storefront/store/${this.appKey}/product/${encodeURIComponent(productId)}/reviews`
    const body = await this.request(filters
      ? { method: 'POST', uri, qs, json: filters }
      : { method: 'GET', uri, qs, json: true })

    // A 200 without reviews (e.g. a CDN error page) must not read as "no reviews".
    if (!body || typeof body !== 'object' || !Array.isArray(body.reviews)) {
      this.log.error({ uri }, 'Yotpo reviews API responded without data')
      throw new Error('Yotpo reviews API responded without data')
    }

    return body
  }

  /**
   * Counts a helpfulness vote. Yotpo answers without the new counts.
   * @param {string} reviewId The numeric Yotpo review id.
   * @param {string} vote Either "up" or "down".
   * @returns {Promise<*>} The parsed body; the caller ignores it.
   */
  vote (reviewId, vote) {
    return this.request({
      method: 'POST',
      uri: `${API_URI}/reviews/${encodeURIComponent(reviewId)}/vote/${vote}`,
      json: true
    })
  }

  /**
   * @param {Object} options The request options.
   * @returns {Promise<*>} The parsed body.
   */
  async request (options) {
    const response = await promisify(this.tracedRequest('Yotpo'))({
      ...options,
      headers: { accept: 'application/json' },
      timeout: REQUEST_TIMEOUT
    })

    if (response.statusCode === 429) {
      this.log.error({ uri: options.uri }, 'Yotpo reviews API rate limit reached')
      throw new Error('Yotpo reviews API rate limit reached')
    }

    if (response.statusCode >= 400) {
      const body = typeof response.body === 'string' ? response.body.slice(0, 500) : response.body
      this.log.error(
        { statusCode: response.statusCode, body, uri: options.uri },
        `Yotpo reviews API responded with ${response.statusCode}`
      )
      throw new Error(`Yotpo reviews API responded with ${response.statusCode}`)
    }

    return response.body
  }
}

module.exports = YotpoClient
