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
 * @param {Object} response The `response` part of a Yotpo body.
 * @returns {Object} A successful Yotpo answer.
 */
function ok (response) {
  return { statusCode: 200, body: { status: { code: 200, message: 'OK' }, response } }
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
    votes_up: 0,
    votes_down: 0,
    content: `Review ${id}`,
    title: `Title ${id}`,
    created_at: '2026-10-04T12:00:00.000Z',
    verified_buyer: true,
    deleted: false,
    custom_fields: null,
    images_data: [],
    comment: null,
    user: { display_name: `Author ${id}`, user_type: 'User' },
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
  total_review: 239,
  average_score: 4.8953977,
  star_distribution: { '1': 2, '2': 0, '3': 4, '4': 9, '5': 224 }
}

module.exports = { createContext, ok, row, rows, BOTTOMLINE }
