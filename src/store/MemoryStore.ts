import { createId, isStateOptions } from '../lib/util';

type PrimitiveValue = string | number;

export type GenericStateValue = PrimitiveValue | Array<PrimitiveValue>;
// | { [key: string]: GenericStateValue };

export type StateValue<T = unknown> = T;

export type StateOptions = {
  scope: string;
  key: string;
};

export class State<T> {
  id: string;
  key: string;
  scope: string;
  value: StateValue<T>;

  _store: Store;

  constructor(initialValue: StateValue<T>, options: StateOptions) {
    this.id = createId(options.scope);
    this.key = options.key;
    this.scope = options.scope;
    this.value = initialValue;
  }
}

export type StoreOptions = {};

export class Store {
  _scopes: Map<string, Map<string, State<unknown>>>;
  _states: Map<string, State<any>>;
  _options: StoreOptions;

  static getKey = (options: StateOptions) => {
    return `${options.scope}:${options.key}`;
  };

  constructor(options: StoreOptions) {
    this._states = new Map();
    this._scopes = new Map();
    this._options = options;
  }

  getScope = (scope: string) => {
    if (this._scopes.has(scope)) return this._scopes.get(scope);
    this._scopes.set(scope, new Map());
    return this._scopes.get(scope);
  };
  createState<T>(value: StateValue<T>, options?: StateOptions) {
    const state = new State(value, { ...options });
    state._store = this;

    const states = this.getScope(options.scope);
    states.set(options.key, state);

    this._states.set(Store.getKey(options), state);
    return state;
  }

  hasState(key: string | StateOptions) {
    if (typeof key === 'string') {
      return this._states.has(key);
    } else if (isStateOptions(key)) {
      return this._states.has(Store.getKey(key));
    } else {
      return false;
    }
  }

  getState<T>(initialValue: StateValue<T>, options: StateOptions): State<T> {
    const { key } = options;
    if (!this.hasState(Store.getKey(options)))
      return this.createState<T>(initialValue, options);

    return this._states.get(Store.getKey(options));
  }
}
