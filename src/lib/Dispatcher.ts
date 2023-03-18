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
        console.log('!!!!!!! PROVIDER');
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
  _currentComponent: ReactServerComponent<unknown>[];
  _clientContext: RenderContext;
  _parentLookup: Map<string, ReactServerNode<unknown>>;
  _fnLookup: Map<
    string,
    { tree: ReactServerComponent<unknown>; fn: (...args: unknown[]) => void }
  >;
  static _tree: ReactServerNode<unknown>;

  static _current: Dispatcher;
  static getCurrent: () => Dispatcher;

  constructor() {
    this._currentComponent = [];
    this._parentLookup = new Map();
    this._fnLookup = new Map();
  }

  static init = () => {
    if (!Dispatcher._current) {
      Dispatcher._current = new Dispatcher();
    } else {
      throw new Error('Dispatcher already initialized');
    }
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

  addClientSideEffect = <T>(
    tree: ReactServerComponent<T>,
    propName: string,
    fn: (...args: unknown[]) => void
  ) => {
    this._fnLookup.set(tree.key + '.' + propName, { tree, propName });
  };

  popCurrentComponent = () => {
    this._currentComponent.pop();
  };

  useState(
    initialValue: StateValue,
    options: StateOptions
  ): [StateValue, (value: StateValue) => void] {
    const _currentComponent = this._currentComponent.at(-1);
    const clientContext = this._clientContext;
    const state = this.store.getState(initialValue, options);
    const value = state.value;
    return [
      value,
      (value: StateValue) => {
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
    let parent = _currentComponent;
    do {
      parent = this.getParentNode(parent.key);
      console.log('USE CONTEXT', context, parent, _currentComponent.key);
      if (isProvider(parent)) {
        if (parent.context === context.context) {
          console.log('Same context, returning');
          return parent.context.current;
        } else {
          console.log('Different context, continuing');
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
