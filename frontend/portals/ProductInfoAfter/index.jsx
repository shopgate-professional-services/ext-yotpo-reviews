import React from 'react';
import PropTypes from 'prop-types';
import { RouteContext } from '@shopgate/pwa-common/context';
import { hex2bin } from '@shopgate/pwa-common/helpers/data';
import YotpoBottomLineHtmlReferenceContainer from '../../components/YotpoBottomLineHtmlReferenceContainer';
import getConfig from '../../helpers/getConfig';
import connect from '../connector';

const config = getConfig();

const YotpoBottomLineContainer = connect(({
  productId,
  product,
}) => (
  <YotpoBottomLineHtmlReferenceContainer
    config={config}
    productId={productId}
    product={product}
  />
));

YotpoBottomLineContainer.propTypes = {
  config: PropTypes.shape().isRequired,
  productId: PropTypes.string.isRequired,
  openPageExtern: PropTypes.func,
  productUrl: PropTypes.string,
};

YotpoBottomLineContainer.defaultProps = {
  openPageExtern: () => {},
  productUrl: null,
};

/**
 * Renders YotpoBottomLine component in product.info.after portal
 * @returns {JSX}
 */
const ProductInfoAfter = () => {
  if (!config.yotpoAppKey) {
    return null;
  }
  return (
    <RouteContext.Consumer>
      {({ params }) => (
        <YotpoBottomLineContainer
          productId={hex2bin(params.productId)}
          config={config}
        />
    )}
    </RouteContext.Consumer>
  );
};

export default connect(ProductInfoAfter);
