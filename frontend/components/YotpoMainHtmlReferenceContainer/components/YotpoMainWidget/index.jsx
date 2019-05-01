import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './style';
import getYotpo from '../../../../helpers/getYotpo';

/**
 * Yotpo main widget
 */
class YotpoMainWidget extends Component {
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
   * @param {Object} props props
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
        className={`yotpo yotpo-main-widget ${styles.container} ${styles.padding}`}
        data-product-id={`${this.props.productId}`}
        data-name={`${this.props.product.name}`}
        data-url={`${this.props.product.productUrl}`}
        data-image-url={`${this.props.product.featuredImageUrl}`}
        data-description=""
      />
    );
  }
}

export default YotpoMainWidget;
