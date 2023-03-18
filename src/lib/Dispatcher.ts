import { PubSub } from 'graphql-subscriptions';
import { StateOptions, StateValue, Store } from '../store/MemoryStore';
import { render } from './internals';
import { useEffect } from './reactServer';
import { isProvider, ReactServerComponent, ReactServerNode } from './types';
import { ClientRequest, Maybe } from './types';

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

class RenderContext {
  request: ClientRequest;
  constructor(request: ClientRequest) {
    this.request = request;
  }
}
class Dispatcher {
  store: Store;
  _pubsub: PubSub;
  _currentComponent: ReactServerComponent<unknown>[];
  _clientContext: RenderContext;
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
  setClientContext = (context: Maybe<ClientRequest>) => {
    this._clientContext = new RenderContext(context);
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
    const clientContext = this._clientContext;
    const state = this.store.getState(initialValue, options);
    const value = state.value;
    return [
      value,
      (value: StateValue<T>) => {
        state.value = value;
        render(_currentComponent, clientContext.request);
      },
    ];
  }

  useEffect(
    fn: () => void,
    deps: Array<any>
  ): [StateValue, (value: StateValue) => void] {
    const clientContext = this._clientContext;
    if (clientContext.request !== null) {
      return;
    }

    fn();
  }

  useContext = (context: Context<unknown>) => {
    const _currentComponent = this._currentComponent.at(-1);
    if (!_currentComponent) {
      throw new Error('Nothing rendered yet');
    }
    let parent = render(_currentComponent);
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
