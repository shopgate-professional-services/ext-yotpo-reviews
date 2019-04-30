import React, { Component } from 'react';
import PropTypes from 'prop-types';
import getYotpo from '../../../../helpers/getYotpo';

/**
 * Yotpo bottom line widget
 */
class YotpoBottomLineWidget extends Component {
  static propTypes = {
    config: PropTypes.shape().isRequired,
    productId: PropTypes.string.isRequired,
    product: PropTypes.shape(),
  };

  static defaultProps = {
    product: null,
  }

  /**
   * Constructs
   * @param {Objects} props props
   */
  constructor(props) {
    super(props);
    this.yotpoMountTimeout = undefined;
  }

  /**
   * Mounts Yotpo script.
   */
  componentDidMount() {
    if (!window.yotpo) {
      getYotpo(this.props.config.yotpoAppKey);
      return;
    }
    // Clean and refreshWidgets are needs to keep yotpo object information relevant
    window.yotpo.clean();
    window.yotpo.refreshWidgets();
    this.yotpoMountTimeout = setTimeout(() => {
      window.yotpo.initWidgets();
      this.yotpoMountTimeout = undefined;
    }, 500);
  }

  /**
   * Cleanup timeout request
   */
  componentWillUnmount() {
    // Set initialized to false on unmounting
    window.yotpo.initialized = false;
    clearTimeout(this.yotpoMountTimeout);
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
    );
  }
}

export default YotpoBottomLineWidget;
