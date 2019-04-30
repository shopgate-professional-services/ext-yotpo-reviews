import React from 'react';
import { mount } from 'enzyme';
import { createMockStore } from '@shopgate/pwa-common/store';
import { Provider } from 'react-redux';
import YotpoWidget from './components/YotpoMainWidget';
import HtmlReferenceContainer from './index';

jest.mock('./components/YotpoMainWidget', () => () => (<div>YotpoWidget</div>));

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
    expect(component.find(YotpoWidget).length).toBe(1);
  });
});
