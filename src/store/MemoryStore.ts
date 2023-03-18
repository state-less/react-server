import { createId } from '../lib/util';

type PrimitiveValue = string | number;

export type GenericStateValue =
  | PrimitiveValue
  | Array<PrimitiveValue>
  | { [key: string]: GenericStateValue };

export type StateValue<T = unknown> = T & GenericStateValue;

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

export type StoreOptions = {
  scope: string;
};

export class Store {
  _states: Map<string, State<any>>;
  _stores: Map<string, Store>;
  _options: StoreOptions;

  constructor(options: StoreOptions) {
    this._states = new Map();
    this._options = options;
  }

  createState<T>(value: StateValue<T>, options?: StateOptions) {
    const state = new State(value, { ...options });

    state._store = this;
    this._states.set(options.key, state);

    return state;
  }

  hasState(key: string) {
    return this._states.has(key);
  }

  getState<T>(initialValue: StateValue<T>, options: StateOptions) {
    const { key } = options;
    if (!this.hasState(key)) return this.createState<T>(initialValue, options);

    return this._states.get(key);
  }
}
