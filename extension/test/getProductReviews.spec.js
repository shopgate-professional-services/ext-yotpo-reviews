'use strict'
/* eslint-env jest */

const getProductReviews = require('../lib/reviews/getProductReviews')
const { createContext, ok, row, rows, BOTTOMLINE } = require('./helpers')

const REVIEWS_URI = 'https://api-cdn.yotpo.com/v1/widget/app_key/products/123/reviews.json'
const FILTER_URI = 'https://api-cdn.yotpo.com/v1/reviews/app_key/filter.json'

/**
 * Answers like Yotpo: pages of `per_page` reviews out of `list`, with a bottomline on reviews.json.
 * @param {Object[]} list All reviews of the product.
 * @param {Object} [options] `total` overrides the count.
 * @returns {Function} The request handler.
 */
function yotpo (list, { total = list.length } = {}) {
  return (options) => {
    const page = options.qs.page
    const perPage = options.qs.per_page
    const response = {
      pagination: { page, per_page: perPage, total },
      reviews: list.slice((page - 1) * perPage, page * perPage)
    }

    if (options.uri === REVIEWS_URI) {
      response.bottomline = BOTTOMLINE
    }

    return ok(response)
  }
}

describe('getProductReviews', () => {
  describe('endpoint', () => {
    it('reads an unfiltered list from reviews.json with the base product id', async () => {
      const context = createContext(yotpo(rows(3)))

      await getProductReviews(context, { productId: '123-variant', baseProductId: '123', limit: 2 })

      expect(context.requests).toHaveLength(1)
      expect(context.requests[0]).toMatchObject({
        method: 'GET',
        uri: REVIEWS_URI,
        qs: { page: 1, per_page: 2 },
        headers: { accept: 'application/json' },
        timeout: 8000
      })
    })

    it('falls back to the requested product id', async () => {
      const context = createContext(yotpo([]))

      await getProductReviews(context, { productId: '123' })

      expect(context.requests[0].uri).toBe(REVIEWS_URI)
    })

    it.each([
      ['a star filter', { filterRate: 3 }, { domain_key: '123', scores: [3] }],
      ['the media filter', { filterMedia: true }, { domain_key: '123', pictured: true }],
      ['both filters', { filterRate: 5, filterMedia: true }, { domain_key: '123', scores: [5], pictured: true }]
    ])('reads a list with %s from filter.json', async (_, filters, body) => {
      const context = createContext(yotpo(rows(3)))

      const result = await getProductReviews(context, { productId: '123', limit: 10, ...filters })

      expect(context.requests[0]).toMatchObject({ method: 'POST', uri: FILTER_URI, qs: { page: 1, per_page: 10 } })
      expect(context.requests[0].json).toEqual(body)
      expect(result.ratingSummary).toBeUndefined()
    })

    it.each([
      ['a star value out of range', { filterRate: 6 }],
      ['a star value as string', { filterRate: '3' }],
      ['a media filter that is not true', { filterMedia: 'yes' }],
      ['the verified filter, which Yotpo cannot apply', { filterVerified: true }],
      ['the text filter', { filterEmpty: true }]
    ])('ignores %s', async (_, filters) => {
      const context = createContext(yotpo(rows(1)))

      await getProductReviews(context, { productId: '123', ...filters })

      expect(context.requests[0].uri).toBe(REVIEWS_URI)
    })

    it('URL-encodes the app key', async () => {
      const context = createContext(yotpo([]), { yotpoAppKey: ' a/b ' })

      await getProductReviews(context, { productId: 'X_y-1' })

      expect(context.requests[0].uri).toBe('https://api-cdn.yotpo.com/v1/widget/a%2Fb/products/X_y-1/reviews.json')
    })

    it.each([['..'], ['a/b'], ['x y'], [''], [undefined]])('answers %p without a request, as Yotpo cannot store it', async (productId) => {
      const context = createContext(yotpo(rows(3)))

      const unfiltered = await getProductReviews(context, { productId })
      const filtered = await getProductReviews(context, { productId, filterRate: 4 })

      expect(context.requests).toHaveLength(0)
      expect(unfiltered).toEqual({
        reviews: [],
        totalReviewCount: 0,
        ratingSummary: { average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
      })
      expect(filtered).toEqual({ reviews: [], totalReviewCount: 0 })
    })
  })

  describe('sort', () => {
    it.each([
      ['dateDesc', { sort: 'date', direction: 'desc' }, { sort_by: 'date', ascending: false }],
      ['dateAsc', { sort: 'date', direction: 'asc' }, { sort_by: 'date', ascending: true }],
      ['rateDesc', { sort: 'rating', direction: 'desc' }, { sort_by: 'score', ascending: false }],
      ['rateAsc', { sort: 'rating', direction: 'asc' }, { sort_by: 'score', ascending: true }],
      ['helpfulDesc', { sort: 'votes_up', direction: 'desc' }, { sort_by: 'votes_up', ascending: false }]
    ])('maps %s on both endpoints', async (sort, query, sorting) => {
      const unfiltered = createContext(yotpo([]))
      const filtered = createContext(yotpo([]))

      await getProductReviews(unfiltered, { productId: '123', sort })
      await getProductReviews(filtered, { productId: '123', sort, filterRate: 4 })

      expect(unfiltered.requests[0].qs).toEqual({ page: 1, per_page: 10, ...query })
      expect(filtered.requests[0].json.sortings).toEqual([sorting])
    })

    it.each([['relevance'], [undefined], ['newest']])('sends no sort for %s', async (sort) => {
      const unfiltered = createContext(yotpo([]))
      const filtered = createContext(yotpo([]))

      await getProductReviews(unfiltered, { productId: '123', sort })
      await getProductReviews(filtered, { productId: '123', sort, filterMedia: true })

      expect(unfiltered.requests[0].qs).toEqual({ page: 1, per_page: 10 })
      expect(filtered.requests[0].json).not.toHaveProperty('sortings')
    })
  })

  describe('pages', () => {
    it.each([
      [0, 2, 1],
      [10, 10, 2],
      [20, 10, 3]
    ])('reads one page for offset %i and limit %i', async (offset, limit, page) => {
      const context = createContext(yotpo(rows(35)))

      const result = await getProductReviews(context, { productId: '123', offset, limit })

      expect(context.requests.map(request => request.qs.page)).toEqual([page])
      expect(result.reviews.map(review => review.id)).toEqual(
        rows(limit, offset + 1).map(review => String(review.id))
      )
    })

    it('reads two pages for an offset that is no multiple of the limit', async () => {
      const context = createContext(yotpo(rows(25)))

      const result = await getProductReviews(context, { productId: '123', offset: 9, limit: 10 })

      expect(context.requests.map(request => request.qs)).toEqual([
        { page: 1, per_page: 10 },
        { page: 2, per_page: 10 }
      ])
      expect(result.reviews.map(review => review.id)).toEqual(
        ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19']
      )
    })

    it('reads two filter.json pages for an unaligned filtered window', async () => {
      const context = createContext(yotpo(rows(25)))

      const result = await getProductReviews(context, { productId: '123', offset: 3, limit: 10, filterRate: 5 })

      expect(context.requests.map(request => [request.uri, request.qs.page])).toEqual([[FILTER_URI, 1], [FILTER_URI, 2]])
      expect(result.reviews.map(review => review.id)).toEqual(['4', '5', '6', '7', '8', '9', '10', '11', '12', '13'])
      expect(result.ratingSummary).toBeUndefined()
    })

    it('takes the count and the summary from the first of two pages', async () => {
      let call = 0
      const context = createContext((options) => {
        call += 1
        return ok({
          pagination: { total: call === 1 ? 25 : 26 },
          bottomline: call === 1 ? BOTTOMLINE : { ...BOTTOMLINE, total_review: 999 },
          reviews: rows(10, (options.qs.page - 1) * 10 + 1)
        })
      })

      const result = await getProductReviews(context, { productId: '123', offset: 5, limit: 10 })

      expect(result.totalReviewCount).toBe(25)
      expect(result.ratingSummary.count).toBe(239)
    })

    it('returns the remaining reviews of the last page', async () => {
      const context = createContext(yotpo(rows(25)))

      const result = await getProductReviews(context, { productId: '123', offset: 19, limit: 10 })

      expect(result.reviews.map(review => review.id)).toEqual(['20', '21', '22', '23', '24', '25'])
      expect(result.totalReviewCount).toBe(25)
    })

    it('defaults to the first page of 10', async () => {
      const context = createContext(yotpo(rows(12)))

      const result = await getProductReviews(context, { productId: '123', offset: -3, limit: 'x' })

      expect(context.requests[0].qs).toEqual({ page: 1, per_page: 10 })
      expect(result.reviews).toHaveLength(10)
    })

    it('caps the page size at 150', async () => {
      const context = createContext(yotpo(rows(3)))

      await getProductReviews(context, { productId: '123', limit: 500 })

      expect(context.requests[0].qs.per_page).toBe(150)
    })

    it('returns only the count for a limit of 0', async () => {
      const context = createContext(yotpo(rows(3)))

      const result = await getProductReviews(context, { productId: '123', offset: 7, limit: 0 })

      expect(context.requests.map(request => request.qs)).toEqual([{ page: 1, per_page: 1 }])
      expect(result.reviews).toEqual([])
      expect(result.totalReviewCount).toBe(3)
    })

    it('leaves out deleted reviews', async () => {
      const context = createContext(yotpo([row(1), row(2, { deleted: true }), row(3)]))

      const result = await getProductReviews(context, { productId: '123' })

      expect(result.reviews.map(review => review.id)).toEqual(['1', '3'])
    })

    it('leaves out deleted reviews after cutting the window', async () => {
      const list = rows(25)
      list[6] = row(7, { deleted: true })
      const context = createContext(yotpo(list))

      const result = await getProductReviews(context, { productId: '123', offset: 5, limit: 10 })

      expect(result.reviews.map(review => review.id)).toEqual(['6', '8', '9', '10', '11', '12', '13', '14', '15'])
    })

    it('counts 0 for an unknown product', async () => {
      const context = createContext(() => ok({
        pagination: { page: 0, per_page: 10, total: 0 },
        bottomline: { total_review: 0, average_score: 0.0, star_distribution: null },
        reviews: []
      }))

      const result = await getProductReviews(context, { productId: '123' })

      expect(result).toEqual({
        reviews: [],
        totalReviewCount: 0,
        ratingSummary: { average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
      })
    })

    it.each([
      ['no response part', { status: { code: 200 } }],
      ['an HTML page', '<html>error</html>']
    ])('throws when Yotpo answers 200 with %s', async (_, body) => {
      const context = createContext(() => ({ statusCode: 200, body }))

      await expect(getProductReviews(context, { productId: '123' })).rejects.toThrow('without data')
      await expect(getProductReviews(context, { productId: '123', filterRate: 2 })).rejects.toThrow('without data')
      expect(context.log.error).toHaveBeenCalledWith(expect.any(Object), 'Yotpo reviews API responded without data')
    })
  })

  describe('rating summary', () => {
    it('maps the bottomline of an unfiltered list', async () => {
      const context = createContext(yotpo(rows(1)))

      const result = await getProductReviews(context, { productId: '123' })

      expect(result.ratingSummary).toEqual({
        average: 98,
        count: 239,
        distribution: { 5: 224, 4: 9, 3: 4, 2: 0, 1: 2 }
      })
    })

    it.each([
      [4.33, 86],
      [4.35, 88],
      [1, 20]
    ])('rounds the average %f to one decimal star (%i)', async (averageScore, average) => {
      const context = createContext(() => ok({
        pagination: { total: 1 },
        bottomline: { ...BOTTOMLINE, average_score: averageScore },
        reviews: []
      }))

      const result = await getProductReviews(context, { productId: '123' })

      expect(result.ratingSummary.average).toBe(average)
    })

    it('fills missing and invalid buckets with 0', async () => {
      const context = createContext(() => ok({
        pagination: { total: 3 },
        bottomline: { total_review: 3, average_score: 4, star_distribution: { 5: 2, 4: '1', 1: -1 } },
        reviews: []
      }))

      const result = await getProductReviews(context, { productId: '123' })

      expect(result.ratingSummary.distribution).toEqual({ 5: 2, 4: 0, 3: 0, 2: 0, 1: 0 })
    })
  })

  describe('mapping', () => {
    it('maps every field', async () => {
      const context = createContext(yotpo([row(734839832, {
        score: 4,
        votes_up: 3,
        votes_down: 1,
        content: 'Tasty',
        title: 'Great syrup',
        created_at: '2025-08-04T21:47:44.000Z',
        verified_buyer: false,
        user: { display_name: 'Kaleena G.' },
        comment: { content: 'Thanks!', created_at: '2026-10-07T11:36:34', display_name: '' },
        images_data: [
          { id: 1, thumb_url: 'https://cdn/1/square.jpg', original_url: 'https://cdn/1/original.jpg' },
          { id: 2, thumb_url: 'https://cdn/2/square.jpg' }
        ],
        custom_fields: {
          '--6688': { title: 'Flavor', value: ['Mango', 'Lime'], field_type: 'MultipleChoice' },
          '--6689': { title: 'Sweetness', value: 4, field_type: 'Rating' },
          '--6690': { title: 'Empty', value: '', field_type: 'CustomerFreeText' }
        }
      })]))

      const { reviews } = await getProductReviews(context, { productId: '123' })

      expect(reviews).toEqual([{
        id: '734839832',
        rate: 80,
        author: 'Kaleena G.',
        date: '2025-08-04T21:47:44.000Z',
        title: 'Great syrup',
        review: 'Tasty',
        isVerified: false,
        merchantReply: { reply: 'Thanks!', date: '2026-10-07T11:36:34Z' },
        media: [{ type: 'image', url: 'https://cdn/1/original.jpg' }],
        customFields: [
          { label: 'Flavor', value: 'Mango, Lime' },
          { label: 'Sweetness', value: '4' }
        ],
        reviewVotes: { up: 3, down: 1 }
      }])
    })

    it('leaves out a verified flag that is no boolean and a missing date', async () => {
      const context = createContext(yotpo([row(1, { verified_buyer: 'yes', created_at: '' })]))

      const { reviews } = await getProductReviews(context, { productId: '123' })

      expect(reviews[0]).not.toHaveProperty('isVerified')
      expect(reviews[0]).not.toHaveProperty('date')
    })

    it('leaves out optional fields without data', async () => {
      const context = createContext(yotpo([{
        id: 7,
        score: 5,
        content: 'Only text',
        created_at: '2026-01-01T00:00:00.000Z',
        user: { display_name: '' },
        comment: { content: '  ', created_at: '2026-01-02T00:00:00' },
        votes_up: 2
      }]))

      const { reviews } = await getProductReviews(context, { productId: '123' })

      expect(reviews).toEqual([{
        id: '7',
        rate: 100,
        author: '',
        date: '2026-01-01T00:00:00.000Z',
        title: '',
        review: 'Only text'
      }])
    })

    it('keeps a reply date with a zone and omits a missing one', async () => {
      const context = createContext(yotpo([
        row(1, { comment: { content: 'A', created_at: '2026-10-07T11:36:34+02:00' } }),
        row(2, { comment: { content: 'B' } })
      ]))

      const { reviews } = await getProductReviews(context, { productId: '123' })

      expect(reviews[0].merchantReply).toEqual({ reply: 'A', date: '2026-10-07T11:36:34+02:00' })
      expect(reviews[1].merchantReply).toEqual({ reply: 'B' })
    })
  })

  describe('errors', () => {
    it.each([
      [404, 'Yotpo reviews API responded with 404'],
      [500, 'Yotpo reviews API responded with 500'],
      [429, 'Yotpo reviews API rate limit reached']
    ])('throws on HTTP %i', async (statusCode, message) => {
      const context = createContext(() => ({ statusCode, body: 'Account not found' }))

      await expect(getProductReviews(context, { productId: '123' })).rejects.toThrow(message)
      expect(context.log.error).toHaveBeenCalledWith(expect.any(Object), message)
    })

    it('logs only the start of an HTML error page', async () => {
      const context = createContext(() => ({ statusCode: 503, body: `<html>${'x'.repeat(2000)}</html>` }))

      await expect(getProductReviews(context, { productId: '123' })).rejects.toThrow('503')
      expect(context.log.error.mock.calls[0][0].body).toHaveLength(500)
    })

    it('throws on a network error or timeout', async () => {
      const context = createContext(() => {
        throw new Error('ETIMEDOUT')
      })

      await expect(getProductReviews(context, { productId: '123' })).rejects.toThrow('ETIMEDOUT')
    })

    it('throws when the second of two pages fails', async () => {
      const context = createContext((options) => (options.qs.page === 2
        ? { statusCode: 500, body: {} }
        : yotpo(rows(25))(options)))

      await expect(getProductReviews(context, { productId: '123', offset: 5, limit: 10 })).rejects.toThrow('500')
    })
  })
})
