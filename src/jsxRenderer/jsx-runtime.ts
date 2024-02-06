import { v4 } from 'uuid';
import { globalInstance } from '../lib/reactServer';
import * as React from 'react/jsx-runtime';
export const jsxs = (Component, props, key = v4()) => {
  // const rendered = Lifecycle(Component, props, { key });
  globalInstance.components.set(key, {
    key,
    Component,
    props,
  });
  return { key, props, Component };
};

export const jsx = (Component, props, key = v4()) => {
  // const rendered = Lifecycle(Component, props, { key });
  console.log('REGISTERING COMPONENT', key, props.key);
  globalInstance.components.set(key, {
    key,
    Component,
    props,
  });

  if (props.ssr) {
    return React.jsx(Component, props);
  }
  return { key, props, Component };
};

export const Fragment = () => {
  throw new Error('Fragment not implemented yet');
};
