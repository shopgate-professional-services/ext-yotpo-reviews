import React, { Component } from 'react';
import PropTypes from 'prop-types';
import YotpoWidget from '../YotpoWidget';

/**
 * Creates Reference to acces DOM nodes
 */
class HtmlReferenceContainer extends Component {
  static propTypes = {
    config: PropTypes.shape().isRequired,
    productId: PropTypes.string.isRequired,
    navigate: PropTypes.func,
    product: PropTypes.shape(),
  };

  static defaultProps = {
    navigate: () => {},
    product: {},
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
    if (!this.props.config.yotpoAppKey) {
      return;
    }
    this.htmlContainer.current.addEventListener('touchstart', this.handleTap, true);
    this.htmlContainer.current.addEventListener('click', this.handleTap, true);
  }

  /**
   * Removes the event handler.
   */
  componentWillUnmount() {
    if (!this.props.config.yotpoAppKey) {
      return;
    }
    this.htmlContainer.current.removeEventListener('touchstart', this.handleTap, true);
    this.htmlContainer.current.removeEventListener('click', this.handleTap, true);
  }

  /**
   * If the user tapped a link element, prevent the default behaviour.
   * @param {Object} event The touchstart event.
   */
  handleTap = (event) => {
    const aTag = event.target.closest('a');
    const dataNetworkAttribute = event.target.closest('.yotpo-icon-btn');

    if (aTag && aTag.attributes.href) {
      event.preventDefault();
      const href = aTag.attributes.href.value;
      this.props.navigate(href);
    }

    if (dataNetworkAttribute && dataNetworkAttribute.attributes['data-network']) {
      const dataNetwork = dataNetworkAttribute.attributes['data-network'].value;
      const linkedinHref = `https://www.linkedin.com/shareArticle?mini=true&url=${this.props.product.productUrl}`;
      const twitterHref = `http://www.twitter.com/share?url=${this.props.product.productUrl}`;
      const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=#${this.props.product.productUrl}`;
      switch (dataNetwork) {
        case 'linkedin':
          event.preventDefault();
          this.props.navigate(linkedinHref);
          break;
        case 'twitter':
          event.preventDefault();
          this.props.navigate(twitterHref);
          break;
        case 'facebook':
          event.preventDefault();
          this.props.navigate(facebookHref);
          break;
        default:
          break;
      }
    }
  };
  /**
   * @returns {JSX}
   */
  render() {
    return (
      <div ref={this.htmlContainer}>
        <YotpoWidget
          product={this.props.product}
          productId={this.props.productId}
          config={this.props.config}
        />
      </div>
    );
  }
}

export default HtmlReferenceContainer;
