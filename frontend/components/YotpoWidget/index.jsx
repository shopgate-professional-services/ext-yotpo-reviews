import React, { Component } from 'react';
import PropTypes from 'prop-types';
import mountScript from '../../helpers/mountScript';

/**
 * Mounts yotpo script.
 */
class YotpoScript extends Component {
  static propTypes = {
    config: PropTypes.shape().isRequired,
    productId: PropTypes.string.isRequired,
    product: PropTypes.shape(),
  };

  static defaultProps = {
    product: null,
  }

  /**
   * Mounts Yotpo script.
   */
  componentDidMount() {
    if (!window.yotpo) {
      mountScript(this.props.config.yotpoAppKey);
      return;
    }
    window.yotpo.initialized = false;
    window.yotpo.clean();
    setTimeout(() => { window.yotpo.initWidgets(); }, 500);
  }

  /**
   * Update for yotpo fetching for different variant
   * @param {Object} prevProps prevProps
   */
  componentDidUpdate(prevProps) {
    if (this.props.productId !== prevProps.productId) {
      window.yotpo.initialized = false;
      window.yotpo.clean();
      setTimeout(() => {
        window.yotpo.refreshWidgets();
        window.yotpo.initWidgets();
      }, 2000);
    }
  }

  /**
   * Renders.
   * @return {JSX}
   */
  render() {
    if (!this.props.product) {
      return null;
    }
    return (
      <div>
        <div
          className="yotpo bottomLine"
          data-appkey={`${this.props.config.yotpoAppKey}`}
          data-domain=""
          data-product-id={`${this.props.productId}`}
          data-name={`${this.props.product.name}`}
          data-url={`${this.props.product.productUrl}`}
          data-image-url={`${this.props.product.featuredImageUrl}`}
          data-description=""
        />
        <div
          className="yotpo yotpo-main-widget"
          data-product-id={`${this.props.productId}`}
          data-name={`${this.props.product.name}`}
          data-url={`${this.props.product.productUrl}`}
          data-image-url={`${this.props.product.featuredImageUrl}`}
          data-description=""
        />
      </div>
    );
  }
}

export default YotpoScript;
