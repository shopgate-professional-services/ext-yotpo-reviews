import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import mockRenderOptions from '@shopgate/pwa-common/helpers/mocks/mockRenderOptions';
import { basicProductState } from '@shopgate/pwa-common-commerce/product/mock';
import { RouteContext } from '@shopgate/pwa-common/context';
import ProductReviews from './index';

const mockedStore = configureStore();
jest.mock('@shopgate/pwa-common-commerce/product/selectors/product', () => ({
  getProduct: jest.fn().mockReturnValue({ productId: 'product_one' }),
}));
jest.mock('../../components/YotpoBottomLineHtmlReferenceContainer', () => () => (<div>HtmlReferenceContainer</div>));
jest.mock('../../helpers/getConfig.js', () => () => ({ yotpoApiKey: 'mock' }));
/**
 * Create Component
 * @return {ReactWrapper}
 */
const createComponent = () => mount(
  <RouteContext.Provider value={{ params: { product: 'product_one' } }}>
    <Provider store={mockedStore({ product: basicProductState })}>
      <ProductReviews productId="product_one" />
    </Provider>
  </RouteContext.Provider>,
  mockRenderOptions
);

describe('ProductInfoAfter', () => {
  it('should render', () => {
    const component = createComponent();
    expect(component).toMatchSnapshot();
  });
});
