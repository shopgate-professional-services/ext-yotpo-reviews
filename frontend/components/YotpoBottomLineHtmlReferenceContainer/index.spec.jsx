import React from 'react';
import { mount } from 'enzyme';
import { createMockStore } from '@shopgate/pwa-common/store';
import { Provider } from 'react-redux';
import YotpoBottomLineWidget from './components/YotpoBottomLineWidget';
import HtmlReferenceContainer from './index';

jest.mock('./components/YotpoBottomLineWidget', () => () => (<div>YotpoBottomLineWidget</div>));

const store = createMockStore();

describe('HtmlReferenceContainer', () => {
  it('should render HtmlReferenceContainer', () => {
    const component = mount((
      <Provider store={store}>
        <HtmlReferenceContainer
          config={{ yotpoAppKey: 'mock' }}
          productId="product_one"
        />
      </Provider>
    ));
    expect(component).toMatchSnapshot();
    expect(component.find(YotpoBottomLineWidget).length).toBe(1);
  });
});
