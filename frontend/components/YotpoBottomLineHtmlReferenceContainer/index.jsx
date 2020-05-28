import React, { Component } from 'react';
import PropTypes from 'prop-types';
import YotpoBottomLineWidget from './components/YotpoBottomLineWidget';

/**
 * Creates Reference to acces DOM nodes
 */
class HtmlReferenceContainer extends Component {
  static propTypes = {
    config: PropTypes.shape().isRequired,
    productId: PropTypes.string.isRequired,
    product: PropTypes.shape(),
  };

  static defaultProps = {
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
    event.stopPropagation();
    event.preventDefault();
    /**
     * will scroll to yotpo reviews section
     */
    const scrollToReviews = () => {
      const reviewsId = document.querySelector('[id^="yotpo-reviews"]').id;
      const reviewsExcerpt = document.getElementById(reviewsId);
      if (
        typeof reviewsExcerpt !== 'object' ||
        !reviewsExcerpt ||
        !reviewsExcerpt.offsetTop ||
        !reviewsExcerpt.closest ||
        !reviewsExcerpt.closest('article')
      ) {
        return;
      }
      reviewsExcerpt
        .closest('article')
        .scroll(0, reviewsExcerpt.offsetTop - 120);
    };
    scrollToReviews();
  };

  /**
   * @returns {JSX}
   */
  render() {
    return (
      <div ref={this.htmlContainer}>
        <YotpoBottomLineWidget
          product={this.props.product}
          productId={this.props.productId}
          config={this.props.config}
        />
      </div>
    );
  }
}

export default HtmlReferenceContainer;
