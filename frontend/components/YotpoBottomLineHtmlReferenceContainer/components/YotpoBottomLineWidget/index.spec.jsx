import React from 'react';
import { mount } from 'enzyme';
import YotpoBottomLineWidget from './index';
import getYotpo from '../../../../helpers/getYotpo';

jest.mock('../../../../helpers/getYotpo');
const noProduct = null;
const product = {
  name: 'item',
  productUrl: 'wwww.123.com',
  featuredImageUrl: 'www.123456.com',
};
describe('<YotpoBottomLineWidget />', () => {
  it('should not render if there is product props', () => {
    const wrapper = mount((
      <YotpoBottomLineWidget product={noProduct} config={{ yotpoAppKey: null }} productId="2" />
    ));

    expect(wrapper).toMatchSnapshot();
    expect(wrapper.find('div').exists()).toBe(false);
  });
  it('should render yotpo divs when a product is passed', () => {
    const wrapper = mount((
      <YotpoBottomLineWidget product={product} config={{ yotpoAppKey: null }} productId="2" />
    ));

    expect(wrapper).toMatchSnapshot();
    expect(wrapper.find('div').exists()).toBe(true);
  });
  it('should call mountScript if no window.yotpo', () => {
    const wrapper = mount((
      <YotpoBottomLineWidget product={product} config={{ yotpoAppKey: null }} productId="2" />
    ));
    const renderedInstance = wrapper.instance();
    renderedInstance.componentDidMount();
    expect(getYotpo).toHaveBeenCalled();
  });
  it('should call clean from window.yotpo', () => {
    window.yotpo = {
      initialzied: false,
      clean: jest.fn(),
      initWidgets: jest.fn(),
      refreshWidgets: jest.fn(),
    };
    const wrapper = mount((
      <YotpoBottomLineWidget product={product} config={{ yotpoAppKey: null }} productId="2" />
    ));
    const renderedInstance = wrapper.instance();
    renderedInstance.componentDidMount();
    expect(window.yotpo.clean).toHaveBeenCalled();
  });
});
