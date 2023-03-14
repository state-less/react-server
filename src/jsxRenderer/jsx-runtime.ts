import { v4 } from 'uuid';
import { globalInstance } from '../lib/reactServer';

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
  globalInstance.components.set(key, {
    key,
    Component,
    props,
  });
  return { key, props, Component };
};

export const Fragment = () => {
  throw new Error('Fragment not implemented yet');
};
