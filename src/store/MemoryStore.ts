import { createId, isStateOptions } from '../lib/util';
import { Transport } from './transport';
import ee from 'event-emitter';
import { EventEmitter } from 'events';

type PrimitiveValue = string | number;

export type GenericStateValue = PrimitiveValue | Array<PrimitiveValue>;
// | { [key: string]: GenericStateValue };

export type StateValue<T = unknown> = T;

export type StateOptions = {
  scope: string;
  key: string;
};

export class State<T> extends EventEmitter {
  id: string;
  key: string;
  scope: string;
  value: StateValue<T>;

  _store: Store;

  constructor(initialValue: StateValue<T>, options: StateOptions) {
    super();
    this.id = createId(options.scope);
    this.key = options.key;
    this.scope = options.scope;
    this.value = initialValue;
    if (this?._store?._options?.transport) {
      this._store._options.transport
        .getState<T>(options.scope, options.key)
        .then((state) => {
          this.value = state.value;
          this.publish();
        });
    }
  }

  publish() {
    this.emit('change', this.value);
  }

  async setValue(value: StateValue<T>) {
    this.value = value;
    this.publish();

    if (this?._store?._options?.transport) {
      await this._store._options.transport.setState(this);
    }

    return this;
  }

  async getValue() {
    if (this?._store?._options?.transport) {
      const storedState = await this._store._options.transport.getState<T>(
        this.scope,
        this.key
      );
      if (storedState !== null) {
        const oldValue = this.value;
        this.value = storedState.value;
        if (oldValue !== this.value) {
          this.publish();
        }
      }
    }
    return this.value;
  }
}

ee(State.prototype);

export type StoreOptions = {
  transport?: Transport;
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
