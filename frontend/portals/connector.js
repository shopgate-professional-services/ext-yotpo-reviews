import { connect } from 'react-redux';
import { getBaseProduct } from '@shopgate/pwa-common-commerce/product/selectors/product';
import openPageExtern from '@shopgate/pwa-core/commands/openPageExtern';

/**
 * Maps the terms and conditions is orderable State.
 * @param {Object} state The current application state.
 * @param {Object} props The component props.
 * @returns {Object} The extended component props.
 */
const mapStateToProps = (state, props) => ({
  product: getBaseProduct(state, props),
});

/**
 * Connects the dispatch function to a callable function in the props.
 * @param {Function} dispatch The redux dispatch function.
 * @return {Object} The extended component props.
 */
const mapDispatchToProps = () => ({
  openPageExtern: src => openPageExtern({ src }),
});

export default connect(mapStateToProps, mapDispatchToProps);
