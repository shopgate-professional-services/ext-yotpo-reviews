import React from 'react';
import { shallow } from 'enzyme';
import DisableProductReviews from './index';

describe('<DisableProductReviews />', () => {
  it('should return null', () => {
    const wrapper = shallow((
      <DisableProductReviews />
    ));

    expect(wrapper).toMatchSnapshot();
    expect(wrapper.find('div').exists()).toBe(false);
  });
});
