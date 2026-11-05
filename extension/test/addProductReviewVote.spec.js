'use strict'
/* eslint-env jest */

const addProductReviewVote = require('../lib/reviews/addProductReviewVote')
const { createContext, ok } = require('./helpers')

describe('addProductReviewVote', () => {
  it.each(['up', 'down'])('forwards a %s vote and returns no counts', async (vote) => {
    const context = createContext(() => ok({ vote: { id: 10 } }))

    await expect(addProductReviewVote(context, { reviewId: '734839832', vote })).resolves.toEqual({})
    expect(context.requests).toHaveLength(1)
    expect(context.requests[0]).toMatchObject({
      method: 'POST',
      uri: `https://api.yotpo.com/reviews/734839832/vote/${vote}`,
      json: true
    })
  })

  it('accepts any successful body', async () => {
    const context = createContext(() => ({ statusCode: 200, body: { status: { code: 200, message: 'OK' } } }))

    await expect(addProductReviewVote(context, { reviewId: '1', vote: 'up' })).resolves.toEqual({})
  })

  it('accepts a numeric review id', async () => {
    const context = createContext(() => ok({}))

    await addProductReviewVote(context, { reviewId: 734839832, vote: 'up' })

    expect(context.requests[0].uri).toBe('https://api.yotpo.com/reviews/734839832/vote/up')
  })

  it.each([
    ['an unknown vote', { reviewId: '1', vote: 'sideways' }],
    ['a missing vote', { reviewId: '1' }],
    ['a path segment as id', { reviewId: '..', vote: 'up' }],
    ['an empty id', { reviewId: '', vote: 'up' }],
    ['a missing id', { vote: 'up' }],
    ['an id with a slash', { reviewId: '1/vote/down', vote: 'up' }]
  ])('rejects %s without a request', async (_, input) => {
    const context = createContext(() => ok({}))

    await expect(addProductReviewVote(context, input)).rejects.toMatchObject({ code: 'EVALIDATION' })
    expect(context.requests).toHaveLength(0)
  })

  it('rejects a vote without an app key', async () => {
    const context = createContext(() => ok({}), { yotpoAppKey: '' })

    await expect(addProductReviewVote(context, { reviewId: '1', vote: 'up' })).rejects.toThrow('not configured')
    expect(context.requests).toHaveLength(0)
  })

  it('fails on the rate limit', async () => {
    const context = createContext(() => ({ statusCode: 429, body: {} }))

    await expect(addProductReviewVote(context, { reviewId: '1', vote: 'up' })).rejects.toThrow('rate limit')
  })

  it('fails when Yotpo fails', async () => {
    const context = createContext(() => ({ statusCode: 500, body: {} }))

    await expect(addProductReviewVote(context, { reviewId: '1', vote: 'up' })).rejects.toThrow('500')
  })
})
