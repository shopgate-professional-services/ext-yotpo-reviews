'use strict'
/* eslint-env jest */

const getProductReviews = require('../lib/reviews/getProductReviews')
const { createContext, ok, row, rows, BOTTOMLINE } = require('./helpers')

const REVIEWS_URI = 'https://api-cdn.yotpo.com/v3/storefront/store/app_key/product/123/reviews'

/**
 * Answers like Yotpo V3: pages of `perPage` reviews out of `list`, with a bottomline on GET.
 * @param {Object[]} list All reviews of the product.
 * @param {Object} [options] `total` overrides the count.
 * @returns {Function} The request handler.
 */
function yotpo (list, { total = list.length } = {}) {
  return (options) => {
    const page = options.qs.page
    const perPage = options.qs.perPage
    const response = {
      pagination: { page, perPage, total },
      ...(options.method === 'GET' && { bottomline: BOTTOMLINE }),
      reviews: list.slice((page - 1) * perPage, page * perPage)
    }

    return ok(response)
  }
}

describe('getProductReviews', () => {
  describe('endpoint', () => {
    it('reads an unfiltered list with GET and the base product id', async () => {
      const context = createContext(yotpo(rows(3)))

      await getProductReviews(context, { productId: '123-variant', baseProductId: '123', limit: 2 })

      expect(context.requests).toHaveLength(1)
      expect(context.requests[0]).toMatchObject({
        method: 'GET',
        uri: REVIEWS_URI,
        qs: { page: 1, perPage: 2 },
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
      ['a star filter', { filterRate: 3 }, { scores: [3] }],
      ['the media filter', { filterMedia: true }, { pictured: true }],
      ['both filters', { filterRate: 5, filterMedia: true }, { scores: [5], pictured: true }]
    ])('reads a list with %s with POST and the filters as body', async (_, filters, body) => {
      const context = createContext(yotpo(rows(3)))

      const result = await getProductReviews(context, { productId: '123', limit: 10, ...filters })

      expect(context.requests[0]).toMatchObject({ method: 'POST', uri: REVIEWS_URI, qs: { page: 1, perPage: 10 } })
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

      expect(context.requests[0]).toMatchObject({ method: 'GET', uri: REVIEWS_URI, json: true })
    })

    it('URL-encodes the app key', async () => {
      const context = createContext(yotpo([]), { yotpoAppKey: ' a/b ' })

      await getProductReviews(context, { productId: 'X_y-1' })

      expect(context.requests[0].uri).toBe('https://api-cdn.yotpo.com/v3/storefront/store/a%2Fb/product/X_y-1/reviews')
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
      ['relevance', { sort: 'smart' }],
      ['dateDesc', { sort: 'date' }],
      ['dateAsc', { sort: 'date', direction: 'asc' }],
      ['rateDesc', { sort: 'rating' }],
      ['rateAsc', { sort: 'rating', direction: 'asc' }],
      ['helpfulDesc', { sort: 'votes_up' }]
    ])('maps %s for GET and POST', async (sort, query) => {
      const unfiltered = createContext(yotpo([]))
      const filtered = createContext(yotpo([]))

      await getProductReviews(unfiltered, { productId: '123', sort })
      await getProductReviews(filtered, { productId: '123', sort, filterRate: 4 })

      expect(unfiltered.requests[0].qs).toEqual({ page: 1, perPage: 10, ...query })
      expect(filtered.requests[0].qs).toEqual({ page: 1, perPage: 10, ...query })
    })

    it.each([[undefined], ['newest']])('sends no sort for %p', async (sort) => {
      const context = createContext(yotpo([]))

      await getProductReviews(context, { productId: '123', sort })

      expect(context.requests[0].qs).toEqual({ page: 1, perPage: 10 })
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
        { page: 1, perPage: 10 },
        { page: 2, perPage: 10 }
      ])
      expect(result.reviews.map(review => review.id)).toEqual(
        ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19']
      )
    })

    it('reads two POST pages for an unaligned filtered window', async () => {
      const context = createContext(yotpo(rows(25)))

      const result = await getProductReviews(context, { productId: '123', offset: 3, limit: 10, filterRate: 5 })

      expect(context.requests.map(request => [request.method, request.qs.page])).toEqual([['POST', 1], ['POST', 2]])
      expect(result.reviews.map(review => review.id)).toEqual(['4', '5', '6', '7', '8', '9', '10', '11', '12', '13'])
      expect(result.ratingSummary).toBeUndefined()
    })

    it('takes the count and the summary from the first of two pages', async () => {
      let call = 0
      const context = createContext((options) => {
        call += 1
        return ok({
          pagination: { total: call === 1 ? 25 : 26 },
          bottomline: call === 1 ? BOTTOMLINE : { ...BOTTOMLINE, totalReview: 999 },
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

      expect(context.requests[0].qs).toEqual({ page: 1, perPage: 10 })
      expect(result.reviews).toHaveLength(10)
    })

    it('caps the page size at 150', async () => {
      const context = createContext(yotpo(rows(3)))

      await getProductReviews(context, { productId: '123', limit: 500 })

      expect(context.requests[0].qs.perPage).toBe(150)
    })

    it('returns only the count for a limit of 0', async () => {
      const context = createContext(yotpo(rows(3)))

      const result = await getProductReviews(context, { productId: '123', offset: 7, limit: 0 })

      expect(context.requests.map(request => request.qs)).toEqual([{ page: 1, perPage: 1 }])
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
        pagination: { page: 0, perPage: 10, total: 0 },
        bottomline: { totalReview: 0, averageScore: 0.0, starDistribution: null },
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
      ['no reviews', { status: { code: 200 } }],
      ['an HTML page', '<html>error</html>']
    ])('throws when Yotpo answers 200 with %s', async (_, body) => {
      const context = createContext(() => ({ statusCode: 200, body }))

      await expect(getProductReviews(context, { productId: '123' })).rejects.toThrow('without data')
      await expect(getProductReviews(context, { productId: '123', filterRate: 2 })).rejects.toThrow('without data')
      expect(context.log.error).toHaveBeenCalledWith(expect.any(Object), 'Yotpo reviews API responded without data')
    })
  })

  describe('cursor', () => {
    it('continues at the Yotpo position of the cursor', async () => {
      const context = createContext(yotpo(rows(25)))

      const first = await getProductReviews(context, { productId: '123', limit: 10 })
      const second = await getProductReviews(context, { productId: '123', limit: 10, after: first.cursors.after })
      const third = await getProductReviews(context, { productId: '123', limit: 10, after: second.cursors.after })

      expect(first.cursors).toEqual({ after: '10' })
      expect(second.reviews.map(review => review.id)).toEqual(rows(10, 11).map(review => String(review.id)))
      expect(second.cursors).toEqual({ after: '20' })
      expect(third.reviews.map(review => review.id)).toEqual(['21', '22', '23', '24', '25'])
      expect(third).not.toHaveProperty('cursors')
    })

    it('reaches the end although a deleted review was left out', async () => {
      const list = rows(12)
      list[2] = row(3, { deleted: true })
      const context = createContext(yotpo(list))
      const loaded = []
      let after
      let requests = 0

      do {
        const result = await getProductReviews(context, { productId: '123', limit: 10, ...(after && { after }) })
        loaded.push(...result.reviews.map(review => review.id))
        after = result.cursors && result.cursors.after
        requests += 1
      } while (after && requests < 5)

      expect(requests).toBe(2)
      expect(loaded).toEqual(['1', '2', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
    })

    it('sends no cursor for the last full page and for an empty list', async () => {
      const full = createContext(yotpo(rows(10)))
      const empty = createContext(yotpo([]))

      expect(await getProductReviews(full, { productId: '123', limit: 10 })).not.toHaveProperty('cursors')
      expect(await getProductReviews(empty, { productId: '123', limit: 10 })).not.toHaveProperty('cursors')
    })

    it('continues a filtered list at the cursor and ends on its last page', async () => {
      const middle = createContext(yotpo(rows(25)))
      const last = createContext(yotpo(rows(15)))

      const continued = await getProductReviews(middle, { productId: '123', limit: 10, after: '10', filterRate: 5 })
      const ended = await getProductReviews(last, { productId: '123', limit: 10, after: '10', filterRate: 5 })

      expect(middle.requests[0]).toMatchObject({ method: 'POST', uri: REVIEWS_URI, qs: { page: 2, perPage: 10 } })
      expect(continued.cursors).toEqual({ after: '20' })
      expect(ended.reviews).toHaveLength(5)
      expect(ended).not.toHaveProperty('cursors')
    })

    it('continues at a cursor that is no multiple of the page size', async () => {
      const context = createContext(yotpo(rows(25)))

      const result = await getProductReviews(context, { productId: '123', limit: 10, after: '15' })

      expect(result.reviews.map(review => review.id)).toEqual(rows(10, 16).map(review => String(review.id)))
      expect(result).not.toHaveProperty('cursors')
    })

    it('continues after an unaligned cursor with the next position', async () => {
      const context = createContext(yotpo(rows(25)))

      const result = await getProductReviews(context, { productId: '123', limit: 10, after: '5' })

      expect(result.reviews.map(review => review.id)).toEqual(rows(10, 6).map(review => String(review.id)))
      expect(result.cursors).toEqual({ after: '15' })
    })

    it('ends when Yotpo counts more reviews than it returns', async () => {
      const short = createContext(yotpo(rows(10), { total: 25 }))
      const countOnly = createContext(yotpo(rows(3)))

      expect(await getProductReviews(short, { productId: '123', limit: 10, after: '10' })).not.toHaveProperty('cursors')
      expect(await getProductReviews(countOnly, { productId: '123', limit: 0 })).not.toHaveProperty('cursors')
    })

    it('prefers the cursor over an offset', async () => {
      const context = createContext(yotpo(rows(25)))

      const result = await getProductReviews(context, { productId: '123', limit: 10, after: '20', offset: 3 })

      expect(result.reviews.map(review => review.id)).toEqual(['21', '22', '23', '24', '25'])
    })

    it('reaches the end when the CDN repeats a review on the next page', async () => {
      const context = createContext((options) => {
        const page = options.qs.page
        const start = page === 2 ? 9 : (page - 1) * 10
        return ok({ pagination: { total: 25 }, bottomline: BOTTOMLINE, reviews: rows(25).slice(start, start + 10) })
      })
      const loaded = []
      let after
      let requests = 0

      do {
        const result = await getProductReviews(context, { productId: '123', limit: 10, ...(after && { after }) })
        loaded.push(...result.reviews.map(review => review.id))
        after = result.cursors && result.cursors.after
        requests += 1
      } while (after && requests < 5)

      expect(requests).toBe(3)
      expect(new Set(loaded).size).toBe(24)
      expect(loaded).not.toContain('20')
    })

    it.each([[1e21], [1000000000]])('starts at the first page for the out-of-range offset %p', async (offset) => {
      const context = createContext(yotpo(rows(25)))

      await getProductReviews(context, { productId: '123', limit: 10, offset })

      expect(context.requests[0].qs.page).toBe(1)
    })

    it.each([['abc'], ['-5'], ['1.5'], [12], ['9'.repeat(10)], ['9'.repeat(400)]])('ignores the invalid cursor %p', async (after) => {
      const context = createContext(yotpo(rows(25)))

      await getProductReviews(context, { productId: '123', limit: 10, after })

      expect(context.requests[0].qs.page).toBe(1)
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
        bottomline: { ...BOTTOMLINE, averageScore },
        reviews: []
      }))

      const result = await getProductReviews(context, { productId: '123' })

      expect(result.ratingSummary.average).toBe(average)
    })

    it('fills missing and invalid buckets with 0', async () => {
      const context = createContext(() => ok({
        pagination: { total: 3 },
        bottomline: { totalReview: 3, averageScore: 4, starDistribution: { 5: 2, 4: '1', 1: -1 } },
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
        votesUp: 3,
        votesDown: 1,
        content: 'Tasty',
        title: 'Great syrup',
        createdAt: '2025-08-04T21:47:44',
        verifiedBuyer: false,
        isShop: false,
        user: { displayName: 'Kaleena G.' },
        comment: { content: 'Thanks!', createdAt: '2026-10-07T11:36:34', displayName: '' },
        imagesData: [
          { id: 1, thumbUrl: 'https://cdn/1/square.jpg', originalUrl: 'https://cdn/1/original.jpg' },
          { id: 2, thumbUrl: 'https://cdn/2/square.jpg' }
        ],
        productVariants: { Size: '750 mL Glass Bottle' },
        customFields: {
          '--6688': { title: 'Flavor', formId: 1, value: ['Mango', 'Lime'], fieldType: 'MultipleChoice' },
          '--6689': { title: 'Sweetness', formId: 1, value: 4, fieldType: 'Rating' },
          '--6690': { title: 'Empty', formId: 1, value: '', fieldType: 'CustomerFreeText' }
        }
      })]))

      const { reviews } = await getProductReviews(context, { productId: '123' })

      expect(reviews).toEqual([{
        id: '734839832',
        rate: 80,
        author: 'Kaleena G.',
        date: '2025-08-04T21:47:44Z',
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

    it('maps a Shop app review without title', async () => {
      const context = createContext(yotpo([row(890536950, {
        title: null,
        content: 'One of my favorite must haves!',
        isShop: true,
        user: { displayName: 'Bertha', userType: 'User' },
        createdAt: '2026-09-14T08:16:15'
      })]))

      const { reviews: [review] } = await getProductReviews(context, { productId: '123' })

      expect(review).toMatchObject({
        id: '890536950',
        title: '',
        review: 'One of my favorite must haves!',
        author: 'Bertha',
        date: '2026-09-14T08:16:15Z'
      })
    })

    it('maps custom fields delivered as an array', async () => {
      const context = createContext(yotpo([row(1, {
        customFields: [
          { title: 'Flavor', fieldType: 'SingleChoice', value: 'Mango' },
          { title: 'Note', fieldType: 'CustomerFreeText', value: null }
        ]
      })]))

      const { reviews } = await getProductReviews(context, { productId: '123' })

      expect(reviews[0].customFields).toEqual([{ label: 'Flavor', value: 'Mango' }])
    })

    it('leaves out a verified flag that is no boolean and a missing date', async () => {
      const context = createContext(yotpo([row(1, { verifiedBuyer: 'yes', createdAt: '' })]))

      const { reviews } = await getProductReviews(context, { productId: '123' })

      expect(reviews[0]).not.toHaveProperty('isVerified')
      expect(reviews[0]).not.toHaveProperty('date')
    })

    it('leaves out optional fields without data', async () => {
      const context = createContext(yotpo([{
        id: 7,
        score: 5,
        content: 'Only text',
        createdAt: '2026-01-01T00:00:00.000Z',
        title: null,
        user: { displayName: '' },
        comment: { content: '  ', createdAt: '2026-01-02T00:00:00' },
        votesUp: 2
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
        row(1, { comment: { content: 'A', createdAt: '2026-10-07T11:36:34+02:00' } }),
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
