import { createId, isStateOptions } from '../lib/util';
import { EventEmitter } from 'events';
import fs from 'fs';

type PrimitiveValue = string | number;

export type GenericStateValue = PrimitiveValue | Array<PrimitiveValue>;
// | { [key: string]: GenericStateValue };

export type StateValue<T = unknown> = T;

export type StateOptions = {
  scope: string;
  key: string;
  labels?: string[];
};

export class State<T> extends EventEmitter {
  id: string;
  key: string;
  scope: string;
  value: StateValue<T>;
  labels: string[];

  _store: Store;

  constructor(initialValue: StateValue<T>, options: StateOptions) {
    super();
    this.id = createId(options.scope);
    this.key = options.key;
    this.scope = options.scope;
    this.labels = options.labels || [];
    this.value = initialValue;
  }

  setValue(value: StateValue<T>) {
    this.value = value;
    this.emit('change', this.value);
  }
}

// ee(State.prototype);

export type StoreOptions = {
  file?: string;
};

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
    if (options.file) {
      this.restore();
    }
  }

  restore = () => {
    const fn = this._options.file;
    if (fs.existsSync(fn)) {
      const json = fs.readFileSync(fn, 'utf8');
      this.deserialize(json);
    }
  };

  store = () => {
    const fn = this._options.file;
    if (fs.existsSync(fn)) {
      fs.writeFileSync(fn, this.serialize());
    }
  };

  sync = (interval = 1000 * 60) => {
    return setInterval(this.store, interval);
  };

  deserialize = (json) => {
    try {
      const obj = JSON.parse(json);
      Object.assign(this, obj);
    } catch (e) {
      throw new Error(`Invalid JSON`);
    }
  };

  serialize = () => {
    return JSON.stringify(this);
  };

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

  deleteState = (options: StateOptions) => {
    const { key, scope } = options;
    const states = this.getScope(scope);
    states.delete(key);
    this._states.delete(Store.getKey(options));
  };

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
    if (!this.hasState(Store.getKey(options)))
      return this.createState<T>(initialValue, options);

    return this._states.get(Store.getKey(options));
  }

  purgeLabels = (labels: string[]) => {
    for (const state of [...this._states.values()]) {
      if (state.labels.some((label) => labels.includes(label))) {
        this.deleteState({ scope: state.scope, key: state.key });
      }
    }
  };
}
