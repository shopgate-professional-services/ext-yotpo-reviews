'use strict'
/* eslint-env jest */

/**
 * Creates a pipeline context whose `tracedRequest` answers from the given handler.
 * @param {Function} handler Receives the request options, returns `{ statusCode, body }`.
 * @param {Object} [config] Extension config overrides.
 * @returns {Object} The context plus the recorded request options in `requests`.
 */
function createContext (handler, config) {
  const requests = []

  return {
    requests,
    config: { yotpoAppKey: 'app_key', ...config },
    log: { warn: jest.fn(), error: jest.fn() },
    tracedRequest: () => (options, callback) => {
      requests.push(options)
      let response
      try {
        response = handler(options)
      } catch (err) {
        return callback(err)
      }
      callback(null, response)
    }
  }
}

/**
 * @param {Object} body A Yotpo V3 body.
 * @returns {Object} A successful Yotpo answer.
 */
function ok (body) {
  return { statusCode: 200, body }
}

/**
 * Builds a Yotpo review with the sparse default keys of a live response.
 * @param {number} id The review id.
 * @param {Object} [overrides] Additional or replaced keys.
 * @returns {Object}
 */
function row (id, overrides) {
  return {
    id,
    score: 5,
    votesUp: 0,
    votesDown: 0,
    content: `Review ${id}`,
    title: `Title ${id}`,
    createdAt: '2026-10-04T12:00:00',
    verifiedBuyer: true,
    isShop: false,
    customFields: null,
    imagesData: null,
    videosData: null,
    comment: null,
    user: { displayName: `Author ${id}`, userType: 'User' },
    ...overrides
  }
}

/**
 * @param {number} count The number of reviews.
 * @param {number} [start] The id of the first review.
 * @returns {Object[]} Reviews with consecutive ids.
 */
function rows (count, start = 1) {
  return Array.from({ length: count }, (_, index) => row(start + index))
}

const BOTTOMLINE = {
  totalReview: 239,
  averageScore: 4.8953977,
  starDistribution: { '1': 2, '2': 0, '3': 4, '4': 9, '5': 224 }
}

module.exports = { createContext, ok, row, rows, BOTTOMLINE }
