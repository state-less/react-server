import { PubSub } from 'graphql-subscriptions';
import {
  SetValueAction,
  State,
  StateOptions,
  StateValue,
  Store,
} from '../store/MemoryStore';
import { render } from './internals';
import { useEffect } from './reactServer';
import { Scopes } from './scopes';
import {
  Initiator,
  isClientContext,
  isProvider,
  isServerContext,
  ReactServerComponent,
  ReactServerNode,
  RenderOptions,
  RequestContext,
} from './types';
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
const recordedStates: State<unknown>[] = [];
const lastDeps: Record<string, any[]> = {};
const usedStates: Record<string, Record<string, State<unknown>>> = {};
const cleanupFns: Record<string, Array<() => void>> = {};
class Dispatcher {
  store: Store;
  _pubsub: PubSub;
  _currentComponent: ReactServerComponent<unknown>[];
  _renderOptions: RenderOptions;
  _parentLookup: Map<string, ReactServerNode<unknown>>;
  _recordStates: boolean;
  _currentClientEffect: number;
  _currentServerEffect: number;

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

  getCleanupFns = (key) => {
    return cleanupFns[key] || [];
  };

  getParentNode(key: string): ReactServerNode<unknown> {
    return this._parentLookup.get(key);
  }
  getStore() {
    return this.store;
  }

  addCurrentComponent = (component: ReactServerComponent<unknown>) => {
    this._currentComponent.push(component);
    this._currentClientEffect = 0;
  };

  popCurrentComponent = () => {
    this._currentComponent.pop();
  };

  useState<T>(
    initialValue: StateValue<T>,
    options: StateOptions
  ): [StateValue<T>, (value: SetValueAction<T>) => void] {
    const _currentComponent = this._currentComponent.at(-1);
    const renderOptions = this._renderOptions;
    const scope = getRuntimeScope(options.scope, renderOptions.context);
    const state = this.store.getState<T>(initialValue, { ...options, scope });

    for (const comp of this._currentComponent) {
      if (!state.labels.includes(comp.key)) {
        state.labels.push(comp.key);
      }
    }

    const listenerKey =
      clientKey(_currentComponent.key, renderOptions.context) +
      '::' +
      state.key;

    if (this._recordStates) {
      recordedStates.push(state);
    }

    const rerender = () => {
      render(
        _currentComponent,
        {
          ...renderOptions,
          initiator: Initiator.StateUpdate,
        },
        this._currentComponent.at(-2)
      );
    };

    for (const listener of Listeners[listenerKey] || []) {
      state.removeListener('change', listener);
      (Listeners[listenerKey] || []).splice(
        Listeners[listenerKey].indexOf(listener)
      );
    }

    // Listeners[listenerKey] = [];
    if (
      renderOptions.initiator === Initiator.RenderClient ||
      renderOptions.initiator === Initiator.RenderServer ||
      renderOptions.initiator === Initiator.StateUpdate ||
      renderOptions.initiator === Initiator.FunctionCall
    ) {
      state.on('change', rerender);
      Listeners[listenerKey] = Listeners[listenerKey] || [];
      Listeners[listenerKey].push(rerender);
    }
    state.getValue();
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

  useClientEffect(
    fn: () => void | (() => void),
    deps?: Array<any>
  ): [StateValue, (value: StateValue) => void] {
    const clientContext = this._renderOptions;
    const currentIndex = this._currentClientEffect;

    // Don't run during server side rendering
    if (isServerContext(clientContext.context)) {
      return;
    }
    if (isClientContext(clientContext.context)) {
      const componentKey = clientKey(
        this._currentComponent.at(-1).key,
        clientContext.context
      );

      const indexComponentKey = componentKey + '-' + currentIndex;

      let changed = false;
      for (let i = 0; i < deps?.length || 0; i++) {
        if (lastDeps[indexComponentKey]?.[i] !== deps[i]) {
          changed = true;
          break;
        }
      }
      if (
        changed ||
        (deps?.length === 0 && !lastDeps[indexComponentKey]) ||
        !deps
      ) {
        lastDeps[indexComponentKey] = deps;
        const cleanup = fn();
        const wrapped = () => {
          if (typeof cleanup === 'function') {
            cleanup();
            delete lastDeps[indexComponentKey];
            delete cleanupFns[componentKey][currentIndex];
          }
        };
        cleanupFns[componentKey] = cleanupFns[componentKey] || [];

        if (typeof cleanup === 'function') {
          cleanupFns[componentKey][this._currentClientEffect] = wrapped;
        }
      }
      this._currentClientEffect++;
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

  destroy = (component?) => {
    const _currentComponent = component || this._currentComponent.at(-1);
    this.store.purgeLabels(_currentComponent.key);
  };
}

Dispatcher.getCurrent = () => {
  return Dispatcher._current;
};

Dispatcher.init();

export default Dispatcher;
