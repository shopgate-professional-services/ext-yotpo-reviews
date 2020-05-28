import React from 'react';
import PropTypes from 'prop-types';
import { withCurrentProduct } from '@shopgate/engage/core';
import YotpoBottomLineHtmlReferenceContainer from '../../components/YotpoBottomLineHtmlReferenceContainer';
import getConfig from '../../helpers/getConfig';
import connect from '../connector';

const config = getConfig();

/**
 * Renders YotpoBottomLine component in product.info.after portal
 * @returns {JSX}
 */
const ProductInfoAfter = ({ productId, product }) => {
  if (!config.yotpoAppKey) {
    return null;
  }
  return (
    <YotpoBottomLineHtmlReferenceContainer
      config={config}
      productId={productId}
      product={product}
    />
  );
};

ProductInfoAfter.propTypes = {
  product: PropTypes.shape().isRequired,
  productId: PropTypes.string.isRequired,
};

export default withCurrentProduct(connect(ProductInfoAfter));
