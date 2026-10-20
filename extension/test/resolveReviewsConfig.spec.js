'use strict'
/* eslint-env jest */

const resolveReviewsConfig = require('../lib/reviews/resolveReviewsConfig')

describe('resolveReviewsConfig', () => {
  it('is enabled with an app key', async () => {
    await expect(resolveReviewsConfig({ config: { yotpoAppKey: 'app_key' } }))
      .resolves.toEqual({ enableReviews: true })
  })

  it.each([
    ['null', null],
    ['an empty string', ''],
    ['whitespace', '   '],
    ['no string', 42]
  ])('is disabled when the app key is %s', async (_, yotpoAppKey) => {
    await expect(resolveReviewsConfig({ config: { yotpoAppKey } }))
      .resolves.toEqual({ enableReviews: false })
  })

  it('is disabled without config', async () => {
    await expect(resolveReviewsConfig({})).resolves.toEqual({ enableReviews: false })
  })
})
