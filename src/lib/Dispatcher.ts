import { PubSub } from 'graphql-subscriptions';
import { StateOptions, StateValue, Store } from '../store/MemoryStore';
import { render } from './internals';
import { useEffect } from './reactServer';
import { Scopes } from './scopes';
import {
  isClientContext,
  isProvider,
  isServerContext,
  ReactServerComponent,
  ReactServerNode,
  RenderOptions,
  RequestContext,
} from './types';
import { ClientContext, Maybe } from './types';
import { clientKey } from './util';

type ProviderComponent = {
  context: unknown;
  children: ReactServerNode<unknown>;
};
export type Context<C> = {
  context: { current: C };
  Provider: (props: any) => ProviderComponent;
};
export const createContext = <T>(): Context<T> => {
  const context = {
    current: null,
  };
  return {
    context,
    Provider: (props) => {
      useEffect(() => {
        context.current = props.value;
      }, [props.value]);
      return {
        context,
        children: props.children,
      };
    },
  };
};

export const getRuntimeScope = (scope: string, context: RequestContext) => {
  return scope.replace(
    Scopes.Client,
    isClientContext(context) ? context?.headers['x-unique-id'] : 'server'
  );
  // return scope === Scopes.Client
  //   ? isClientContext(context)
  //     ? context?.headers['x-unique-id']
  //     : 'server'
  //   : scope;
};

const Listeners = {};
class Dispatcher {
  store: Store;
  _pubsub: PubSub;
  _currentComponent: ReactServerComponent<unknown>[];
  _renderOptions: RenderOptions;
  _parentLookup: Map<string, ReactServerNode<unknown>>;

  static _tree: ReactServerNode<unknown>;
  static _current: Dispatcher;
  static getCurrent: () => Dispatcher;

  constructor() {
    this._currentComponent = [];
    this._parentLookup = new Map();
  }

  static init = () => {
    if (!Dispatcher._current) {
      Dispatcher._current = new Dispatcher();
    } else {
      throw new Error('Dispatcher already initialized');
    }
  };
  setPubSub = (pubsub: PubSub) => {
    this._pubsub = pubsub;
  };
  setClientContext = (context: RenderOptions) => {
    this._renderOptions = context;
  };

  setStore(store: Store) {
    this.store = store;
  }
  setRootComponent(component: ReactServerNode<unknown>) {
    Dispatcher._tree = component;
  }

  setParentNode(key: string, component: ReactServerNode<unknown>) {
    this._parentLookup.set(key, component);
  }
  getParentNode(key: string): ReactServerNode<unknown> {
    return this._parentLookup.get(key);
  }
  getStore() {
    return this.store;
  }

  addCurrentComponent = (component: ReactServerComponent<unknown>) => {
    this._currentComponent.push(component);
  };

  popCurrentComponent = () => {
    this._currentComponent.pop();
  };

  useState<T>(
    initialValue: StateValue<T>,
    options: StateOptions
  ): [StateValue<T>, (value: StateValue<T>) => void] {
    const _currentComponent = this._currentComponent.at(-1);
    const renderOptions = this._renderOptions;
    const scope = getRuntimeScope(options.scope, renderOptions.context);
    const state = this.store.getState<T>(initialValue, { ...options, scope });

    const rerender = () => {
      for (const listener of Listeners[
        clientKey(_currentComponent.key, renderOptions.context)
      ] || []) {
        state.off('change', listener);
      }
      render(_currentComponent, renderOptions);
    };

    for (const listener of Listeners[
      clientKey(_currentComponent.key, renderOptions.context)
    ] || []) {
      state.off('change', listener);
    }
    state.once('change', rerender);
    Listeners[clientKey(_currentComponent.key, renderOptions.context)] =
      Listeners[clientKey(_currentComponent.key, renderOptions.context)] || [];
    Listeners[clientKey(_currentComponent.key, renderOptions.context)].push(
      rerender
    );

    state.getValue(+new Date());
    const value = state.value as T;

    return [
      value,
      (value: StateValue<T>) => {
        state.setValue(value);
      },
    ];
  }

  useEffect(
    fn: () => void,
    deps: Array<any>
  ): [StateValue, (value: StateValue) => void] {
    const clientContext = this._renderOptions;

    // Don't run during client side rendering
    if (isClientContext(clientContext.context)) {
      return;
    }

    if (isServerContext(clientContext.context)) {
      fn();
    }
  }

  useContext = (context: Context<unknown>) => {
    const _currentComponent = this._currentComponent.at(-1);
    if (!_currentComponent) {
      throw new Error('Nothing rendered yet');
    }
    let parent: ReactServerComponent<any> | ReactServerNode<any> =
      _currentComponent;
    do {
      parent = this.getParentNode(parent.key);
      if (isProvider(parent)) {
        if (parent.context === context.context) {
          return parent.context.current;
        }
      }
    } while (parent);
    return null;
  };
}

Dispatcher.getCurrent = () => {
  return Dispatcher._current;
};

Dispatcher.init();

export default Dispatcher;
