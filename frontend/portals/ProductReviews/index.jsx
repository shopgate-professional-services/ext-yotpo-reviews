import React from 'react';
import PropTypes from 'prop-types';
import { RouteContext } from '@shopgate/pwa-common/context';
import { hex2bin } from '@shopgate/pwa-common/helpers/data';
import HtmlReferenceContainer from '../../components/HtmlReferenceContainer';
import getConfig from '../../helpers/getConfig';
import connect from './connector';

const config = getConfig();

const HtmlReferenceContainerContext = connect(({
  productId,
  product,
  openPageExtern,
}) => (
  <HtmlReferenceContainer
    config={config}
    productId={productId}
    product={product}
    openPageExtern={openPageExtern}
  />
));

HtmlReferenceContainerContext.propTypes = {
  config: PropTypes.shape().isRequired,
  productId: PropTypes.string.isRequired,
  openPageExtern: PropTypes.func,
  productUrl: PropTypes.string,
};

HtmlReferenceContainerContext.defaultProps = {
  openPageExtern: () => {},
  productUrl: null,
};

/**
 * Renders YotpoWidget component in product.reviews portal
 * @returns {JSX}
 */
const ProductReviews = () => {
  if (!config.yotpoAppKey) {
    return null;
  }
  return (
    <RouteContext.Consumer>
      {({ params }) => (
        <HtmlReferenceContainerContext
          productId={hex2bin(params.productId)}
          config={config}
        />
    )}
    </RouteContext.Consumer>
  );
};

export default connect(ProductReviews);
