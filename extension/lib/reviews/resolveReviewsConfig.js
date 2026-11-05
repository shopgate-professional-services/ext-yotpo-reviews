'use strict'

/**
 * Resolves whether Yotpo reviews are enabled: an app key is configured. Without one the
 * pipelines fall back to the shop's default reviews, as if the extension were not installed.
 * @param {Object} context The pipeline context.
 * @returns {Promise<{ enableReviews: boolean }>}
 */
module.exports = async (context) => {
  const appKey = context && context.config && context.config.yotpoAppKey

  return { enableReviews: typeof appKey === 'string' && appKey.trim().length > 0 }
}
