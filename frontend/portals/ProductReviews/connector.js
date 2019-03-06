import { connect } from 'react-redux';
import { getProduct } from '@shopgate/pwa-common-commerce/product/selectors/product';
import { historyPush } from '@shopgate/pwa-common/actions/router';
/**
 * Maps the terms and conditions is orderable State.
 * @param {Object} state The current application state.
 * @param {Object} props The component props.
 * @returns {Object} The extended component props.
 */
const mapStateToProps = (state, props) => ({
  product: getProduct(state, props),
});

/**
 * Connects the dispatch function to a callable function in the props.
 * @param {Function} dispatch The redux dispatch function.
 * @return {Object} The extended component props.
 */
const mapDispatchToProps = dispatch => ({
  navigate: pathname => dispatch(historyPush({ pathname })),
});

export default connect(mapStateToProps, mapDispatchToProps);
