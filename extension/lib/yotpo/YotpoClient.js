'use strict'

const { promisify } = require('util')

const CDN_URI = 'https://api-cdn.yotpo.com'
const API_URI = 'https://api.yotpo.com'
const REQUEST_TIMEOUT = 8000

/**
 * Talks to Yotpo's storefront reviews API with the public app key. Results are not cached.
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
   * Reads one page of the unfiltered reviews of a product, including Yotpo's bottomline.
   * @param {string} productId The Yotpo product id.
   * @param {Object} qs `page`, `per_page` and optionally `sort` and `direction`.
   * @returns {Promise<Object>} The `response` part of the Yotpo body.
   */
  getReviews (productId, qs) {
    return this.request({
      method: 'GET',
      uri: `${CDN_URI}/v1/widget/${this.appKey}/products/${encodeURIComponent(productId)}/reviews.json`,
      qs,
      json: true
    })
  }

  /**
   * Reads one page of filtered reviews. The count respects the filters; there is no bottomline.
   * @param {Object} body `domain_key` and optionally `scores`, `pictured` and `sortings`.
   * @param {Object} qs `page` and `per_page`.
   * @returns {Promise<Object>} The `response` part of the Yotpo body.
   */
  filterReviews (body, qs) {
    return this.request({
      method: 'POST',
      uri: `${CDN_URI}/v1/reviews/${this.appKey}/filter.json`,
      qs,
      json: body
    })
  }

  /**
   * Counts a helpfulness vote. Yotpo answers without the new counts.
   * @param {string} reviewId The numeric Yotpo review id.
   * @param {string} vote Either "up" or "down".
   * @returns {Promise<Object>}
   */
  vote (reviewId, vote) {
    return this.request({
      method: 'POST',
      uri: `${API_URI}/reviews/${encodeURIComponent(reviewId)}/vote/${vote}`,
      json: true
    }, false)
  }

  /**
   * @param {Object} options The request options.
   * @param {boolean} [requireResponse=true] Whether a body without `response` part is an error.
   * @returns {Promise<Object>} The `response` part of the Yotpo body; empty when it is not required.
   */
  async request (options, requireResponse = true) {
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

    const payload = response.body && response.body.response

    if (payload && typeof payload === 'object') {
      return payload
    }

    // A 200 without payload (e.g. a CDN error page) must not read as "no reviews".
    if (requireResponse) {
      this.log.error({ uri: options.uri }, 'Yotpo reviews API responded without data')
      throw new Error('Yotpo reviews API responded without data')
    }

    return {}
  }
}

module.exports = YotpoClient
