import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './style';
import getYotpo from '../../../../helpers/getYotpo';

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
    window.yotpo.initialized = false;
    window.yotpo.clean();
    this.yotpoMountTimeout = setTimeout(() => {
      window.yotpo.initWidgets();
      this.yotpoMountTimeout = undefined;
    }, 500);
  }

  /**
   * Cleanup timeout request
   */
  componentWillUnmount() {
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
      <div>
        <div
          className={`yotpo bottomLine ${styles.padding}`}
          data-appkey={`${this.props.config.yotpoAppKey}`}
          data-domain=""
          data-product-id={`${this.props.productId}`}
          data-name={`${this.props.product.name}`}
          data-url={`${this.props.product.productUrl}`}
          data-image-url={`${this.props.product.featuredImageUrl}`}
          data-description=""
        />
        <div
          className={`yotpo yotpo-main-widget ${styles.container} ${styles.padding}`}
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
