import React, { Component } from 'react';
import PropTypes from 'prop-types';
import YotpoWidget from './components/YotpoMainWidget';

/**
 * Creates Reference to acces DOM nodes
 */
class HtmlReferenceContainer extends Component {
  static propTypes = {
    config: PropTypes.shape().isRequired,
    productId: PropTypes.string.isRequired,
    openPageExtern: PropTypes.func,
    product: PropTypes.shape(),
  };

  static defaultProps = {
    openPageExtern: () => {},
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
    this.htmlContainer.current.addEventListener('click', this.handleTap, true);
  }

  /**
   * Removes the event handler.
   */
  componentWillUnmount() {
    if (!this.props.config.yotpoAppKey) {
      return;
    }
    this.htmlContainer.current.removeEventListener('click', this.handleTap, true);
  }

  /**
   * If the user tapped a link element, prevent the default behaviour.
   * @param {Object} event The touchstart event.
   */
  handleTap = (event) => {
    const aTag = event.target.closest('a');

    if (aTag && aTag.attributes.href && !aTag.classList.contains('yotpo-icon')) {
      event.preventDefault();
      const href = aTag.attributes.href.value;
      this.props.openPageExtern(href);
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
