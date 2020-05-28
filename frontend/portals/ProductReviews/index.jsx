import React from 'react';
import PropTypes from 'prop-types';
import { withCurrentProduct } from '@shopgate/engage/core';
import YotpoMainHtmlReferenceContainer from '../../components/YotpoMainHtmlReferenceContainer';
import getConfig from '../../helpers/getConfig';
import connect from '../connector';

const config = getConfig();

/**
 * Renders YotpoWidget component in product.reviews portal
 * @returns {JSX}
 */
const ProductReviews = ({ productId, product, openPageExtern }) => {
  if (!config.yotpoAppKey) {
    return null;
  }

  return (
    <YotpoMainHtmlReferenceContainer
      config={config}
      productId={productId}
      product={product}
      openPageExtern={openPageExtern}
    />
  );
};

ProductReviews.propTypes = {
  openPageExtern: PropTypes.func.isRequired,
  product: PropTypes.shape().isRequired,
  productId: PropTypes.string.isRequired,
};

export default withCurrentProduct(connect(ProductReviews));
