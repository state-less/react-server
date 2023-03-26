import { PubSub } from 'graphql-subscriptions';
import { Store } from '../store/MemoryStore';
import Dispatcher, { createContext } from './Dispatcher';
import { render } from './internals';
import { useContext, useEffect, useState } from './reactServer';
import { isReactServerNode } from './types';

const store = new Store({});
const pubSub = new PubSub();

Dispatcher.getCurrent().setPubSub(pubSub);

const effectMock = jest.fn();
const MockComponent = () => {
  useEffect(effectMock, []);
};

const StateComponent = () => {
  const [value, setValue] = useState(1, { key: 'ASD', scope: 'Asd' });

  return {
    value,
    setValue,
  };
};

const Children = (props) => {
  return {
    children: props.children,
  };
};
const context = createContext();
const secondContext = createContext();
const Provider = (props) => {
  return (
    <context.Provider value={props.value}>{props.children}</context.Provider>
  );
};
const ContextComponent = () => {
  const ctx = useContext(context);

  return {
    ctx,
  };
};

describe('Dispatcher', () => {
  let context, provider;
  it('should be able to create a context', () => {
    context = createContext();
    expect(context).toBeDefined();
  });
  it('should be able to create a Provider', () => {
    provider = <context.Provider value={1} />;
    expect(provider).toBeDefined();
    expect(isReactServerNode(provider));
  });
  it('should be able to render a Provider', () => {
    const node = render(provider, null);
    expect(node).toBeDefined();
  });

  it('should create a Dispatcher', () => {
    const dispatcher = new Dispatcher();
    expect(dispatcher).toBeDefined();
  });
  it('should  not be able to init  a Dispatcher twice', () => {
    expect(() => Dispatcher.init()).toThrow();
  });

  it('should be able to set/get a store', () => {
    const mocked = store;
    Dispatcher.getCurrent().setStore(mocked);
    expect(Dispatcher.getCurrent().getStore()).toBe(mocked);
    Dispatcher.getCurrent().setStore(store);
  });

  it('Should execute a useEffect on the Server', () => {
    const component = <MockComponent />;
    render(component);
    expect(effectMock).toBeCalledTimes(1);
  });

  it('Should not execute a useEffect on the client', () => {
    const component = <MockComponent />;
    render(component, {
      clientProps: {},
      context: { headers: { 'x-unique-id': 'client' } },
    });
    expect(effectMock).toBeCalledTimes(1);
  });

  it('should be able to use a state', () => {
    const component = <StateComponent />;
    const node = render<{ value: number }>(component);
    expect(node.value).toBe(1);
  });

  it('should be able to set a state', () => {
    const component = <StateComponent />;
    let node = render<{ value: number; setValue: (number) => void }>(component);
    expect(node.value).toBe(1);
    node.setValue(2);
    expect(node.value).toBe(1);

    node = render(component);
    expect(node.value).toBe(2);
  });

  it('should be able to use a context', () => {
    const component = (
      <Provider value={1} key="provider">
        <ContextComponent key="context" />
      </Provider>
    );

    const node = render<any>(component);

    expect(node.children[0].ctx).toBe(1);
  });

  it('should be able to use a context higher up the tree', () => {
    const component = (
      <Provider value={1} key="provider">
        <Children key="children">
          <ContextComponent key="context" />
        </Children>
      </Provider>
    );

    const node = render<any>(component);

    expect(node.children[0].children[0].ctx).toBe(1);
  });

  it('should return null if no provider is found', () => {
    const dispatcher = Dispatcher.getCurrent();
    expect(() => dispatcher.useContext(context)).toThrow();

    const component = <ContextComponent />;
    dispatcher.addCurrentComponent(component);
    render(component);
    const ctx = dispatcher.useContext(context);
    expect(ctx).toBe(null);
  });

  it('should not return a wrong provider', () => {
    const dispatcher = Dispatcher.getCurrent();
    const component = (
      <Provider>
        <ContextComponent />;
      </Provider>
    );
    dispatcher.addCurrentComponent(component.props.children[0]);
    render(component);
    const ctx = dispatcher.useContext(secondContext);
    expect(ctx).toBe(null);
  });

  it('doesnt error when no children are present', () => {
    const component = <Children />;
    const node = render(component);
    expect(node.children).toEqual([]);
  });
});
