import React from 'react';
import { mount } from 'enzyme';
import FormFooter  from '../FormFooter';
import { IFormAction } from '../../../../util/uniforms/FormSubmitHandler/FormSubmitHandler';

describe('Form Footer test', () => {
  it('testing showing actions', () => {
    const actions: IFormAction[] = [
      {
        name: 'action1',
        primary: true,
        execute: jest.fn()
      },
      {
        name: 'action2',
        execute: jest.fn()
      }
    ];

    const wrapper = mount(<FormFooter actions={actions} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('testing showing empty actions', () => {
    const props = {
      actions: []
    };

    const wrapper = mount(<FormFooter {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('testing showing no actions', () => {
    const wrapper = mount(<FormFooter />);
    expect(wrapper).toMatchSnapshot();
  });

  it('testing action click', () => {
    const action1 = {
      name: 'action1',
      execute: jest.fn()
    };

    const action2 = {
      name: 'action2',
      execute: jest.fn()
    };

    const props = {
      actions: [action1, action2]
    };

    const wrapper = mount(<FormFooter {...props} />);
    expect(wrapper).toMatchSnapshot();

    const button1 = wrapper.findWhere(node => node.key() === 'submit-action1');
    button1.simulate('click');

    expect(action1.execute).toBeCalledTimes(1);

    const button2 = wrapper.findWhere(node => node.key() === 'submit-action2');
    button2.simulate('click');

    expect(action2.execute).toBeCalledTimes(1);
  });
});
