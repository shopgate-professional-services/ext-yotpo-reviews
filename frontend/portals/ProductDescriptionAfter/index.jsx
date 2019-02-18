import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { RouteContext } from '@shopgate/pwa-common/context';
import { hex2bin } from '@shopgate/pwa-common/helpers/data';
import YotpoWidget from '../../components/YotpoWidget';
import getConfig from '../../helpers/getConfig';
import connect from './connector';
/**
 * @param {string} productId productId
 * @param {Object} config config
 * @returns {JSX}
 */
const YotpoWidgetContext = connect(({
  productId,
  product,
  config,
}) => (
  <YotpoWidget
    product={product}
    productId={productId}
    config={config}
  />
));
YotpoWidgetContext.propTypes = {
  config: PropTypes.shape().isRequired,
  productId: PropTypes.string.isRequired,
  navigate: PropTypes.func,
  product: PropTypes.shape(),
};

YotpoWidgetContext.defaultProps = {
  navigate: () => {},
  product: {},
};

/**
 * Renders YotpoWidget component in product.description.after portal
 * @returns {JSX}
 */
class productDescriptionAfter extends Component {
  static propTypes = {
    navigate: PropTypes.func,
  };

  static defaultProps = {
    navigate: () => {},
  }

  /**
   * @param {Object} props The component props.
   */
  constructor(props) {
    super(props);

    this.htmlContainer = React.createRef();
  }

  /**
   * Registers the event handler for when the user taps inside the html content.
   */
  componentDidMount() {
    this.htmlContainer.current.addEventListener('touchstart', this.handleTap, true);
    this.htmlContainer.current.addEventListener('click', this.handleTap, true);
  }

  /**
   * Removes the event handler.
   */
  componentWillUnmount() {
    this.htmlContainer.current.removeEventListener('touchstart', this.handleTap, true);
    this.htmlContainer.current.removeEventListener('click', this.handleTap, true);
  }

  /**
   * If the user tapped a link element, prevent the default behaviour.
   * @param {Object} event The touchstart event.
   */
  handleTap = (event) => {
    const aTag = event.target.closest('a');

    if (aTag && aTag.attributes.href) {
      event.preventDefault();
      const href = aTag.attributes.href.value;
      this.props.navigate(href);
    }
  };

  /**
   * @returns {jSX}
   */
  render() {
    const config = getConfig();

    if (!config.yotpoAppKey) {
      return null;
    }

    return (
      <RouteContext.Consumer>
        {({ params }) => (
          <div ref={this.htmlContainer}>
            <YotpoWidgetContext productId={hex2bin(params.productId)} config={config} />
          </div>
    )}
      </RouteContext.Consumer>
    );
  }
}

export default connect(productDescriptionAfter);
