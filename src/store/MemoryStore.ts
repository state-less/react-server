import { createId } from '../lib/util';

type PrimitiveValue = string | number;

export type StateValue =
  | PrimitiveValue
  | Array<PrimitiveValue>
  | { [key: string]: StateValue };

export type StateOptions = {
  scope: string;
  key: string;
};

export class State {
  id: string;
  key: string;
  scope: string;
  value: StateValue;

  _store: Store;

  constructor(initialValue: StateValue, options: StateOptions) {
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
  _states: Map<string, State>;
  _stores: Map<string, Store>;
  _options: StoreOptions;

  constructor(options: StoreOptions) {
    this._states = new Map();
    this._options = options;
  }

  createState(value: StateValue, options?: StateOptions) {
    const state = new State(value, { ...options });

    state._store = this;
    this._states.set(options.key, state);

    return state;
  }

  hasState(key: string) {
    return this._states.has(key);
  }

  getState(initialValue: StateValue, options: StateOptions) {
    const { key } = options;
    if (!this.hasState(key)) return this.createState(initialValue, options);

    return this._states.get(key);
  }
}
