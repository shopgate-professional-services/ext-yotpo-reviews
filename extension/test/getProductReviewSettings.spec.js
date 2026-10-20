'use strict'
/* eslint-env jest */

const getProductReviewSettings = require('../lib/reviews/getProductReviewSettings')

describe('getProductReviewSettings', () => {
  it('reports the Yotpo capabilities with an app key', async () => {
    await expect(getProductReviewSettings({ config: { yotpoAppKey: 'app_key' } })).resolves.toEqual({
      features: ['filterRate', 'filterMedia', 'ratingSummary', 'reviewVotes'],
      paginationType: 'cursor',
      customFields: [],
      sortOptions: ['relevance', 'dateDesc', 'dateAsc', 'rateDesc', 'rateAsc', 'helpfulDesc']
    })
  })

  it.each([
    ['the app key is empty', { yotpoAppKey: '' }],
    ['there is no config', undefined]
  ])('returns the default settings when %s', async (_, config) => {
    await expect(getProductReviewSettings({ config })).resolves.toEqual({
      features: [],
      paginationType: 'offset',
      customFields: [],
      sortOptions: []
    })
  })
})
