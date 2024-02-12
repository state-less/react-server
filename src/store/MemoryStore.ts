import { createId, isStateOptions } from '../lib/util';
import { PostgresTransport, Transport } from './transport';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import json from 'big-json';

type PrimitiveValue = string | number;

export type GenericStateValue = PrimitiveValue | Array<PrimitiveValue>;
// | { [key: string]: GenericStateValue };

export type StateValue<T = unknown> = T;

export type SetValueAction<T> =
  | StateValue<T>
  | ((value: StateValue<T>) => StateValue<T>);

export type StateOptions = {
  scope: string;
  uuid?: string;
  user?: string;
  client?: string;
  key: string;
  labels?: string[];
  storeInitialState?: boolean;
};

export type QueryOptions = StateOptions & {
  poll?: number;
};
export class Query<T> extends EventEmitter {
  value: StateValue<T>;
  initialValue: StateValue<T>;
  fetched: boolean;
  _options: QueryOptions;
  _store: Store;
  constructor(initialValue: StateValue<T>, options: QueryOptions) {
    super();
    this.value = initialValue;
    this.initialValue = initialValue;
    this._options = options;
    this.fetched = false;
  }

  getValue() {
    const transport = this._store?._options?.transport;
    if (transport instanceof PostgresTransport && !this.fetched) {
      transport.queryByOptions(this._options).then((query) => {
        this.value = query?.map((state) => ({
          key: state.key,
          scope: state.scope,
          uuid: state.uuid,
          ...state.value,
        }));
        this.fetched = true;
        this.emit('change', this.value);
      });
      this._store.on('destroy::' + Store.getKey(this._options), () => {
        this.fetched = false;
        console.log('Destroy triggered, refetching query');
        this.refetch();
      });
    }
  }

  refetch() {
    this.fetched = false;
    this.getValue();
  }
}

export class State<T> extends EventEmitter {
  id: string;
  uuid: string;
  key: string;
  /**
   * The unique id of the currently authenticated user.
   * */
  user: string;
  /**
   * The unique id of the connected client.
   */
  client: string;
  scope: string;
  value: StateValue<T>;
  initialValue: StateValue<T>;
  initialValuePublished: boolean;
  timestamp: number;
  labels: string[];

  _store: Store;

  constructor(initialValue: StateValue<T>, options: StateOptions) {
    super();
    this.uuid = options.uuid || createId(options.scope);
    this.key = options.key;
    this.scope = options.scope;
    this.user = options.user;
    this.client = options.client;
    this.labels = options.labels || [];
    this.value = initialValue;
    this.initialValue = initialValue;
    this.initialValuePublished = false;
    this.timestamp = 0;

    // if (this?._store?._options?.transport) {
    //   this._store._options.transport
    //     .getState<T>(options.scope, options.key)
    //     .then((state) => {
    //       this.initialValuePublished = true;
    //       this.value = state.value;
    //       this.publish();
    //     });
    // }
  }

  publish() {
    this.emit('change', this.value);
  }

  async setValue(valueAction: SetValueAction<T>) {
    let value;
    if (typeof valueAction === 'function') {
      value = (valueAction as (value: StateValue<T>) => StateValue<T>)(
        this.value
      );
    } else {
      value = valueAction;
    }
    console.log('SET VALUE', this.key, value);
    this.value = value;

    if (this?._store?._options?.transport) {
      this.timestamp = +new Date();
      this._store._options.transport.setState(this).then(() => {
        this.timestamp = +new Date();
      });
      this.publish();
    } else {
      this.publish();
    }

    return this;
  }

  getValue() {
    const timestamp = +new Date();
    if (this?._store?._options?.transport) {
      this._store._options.transport.getState<T>(this).then((storedState) => {
        if (storedState !== null) {
          if (timestamp > this.timestamp) {
            if (!this.initialValuePublished) {
              console.log(
                'SET VALUE IN GET VALUE',
                this.key,
                storedState.value
              );
              this.value = storedState.value;
              this.initialValuePublished = true;

              // TODO: The client hasn't yet subscribed to component updates when this response is received
              // We need to add a "once" listener to the subscribe event which will trigger the publish
              setTimeout(() => {
                this.publish();
              }, 1000);
            }
          }
        }
      });
    }
    return this.value;
  }

  destroy = () => {
    if (this._store) {
      this._store.deleteState({
        key: this.key,
        scope: this.scope,
        user: this.user,
        client: this.client,
      });
    }
    if (this?._store?._options?.transport) {
      this._store._options.transport.deleteState(this);
    }
    this.emit('destroy');
    this._store.emit('destroy::' + Store.getKey(this));
  };
  toJSON = () => {
    const { scope, key, value } = this;
    return { scope, key, value };
  };
}

// ee(State.prototype);

export type StoreOptions = {
  transport?: Transport;
  file?: string;
  logger?: any;
};

export class Store extends EventEmitter {
  _scopes: Map<string, Map<string, State<unknown>>>;
  _queries: Map<string, Query<any>>;
  _states: Map<string, State<any>>;
  _options: StoreOptions;
  _storing: boolean;

  static getKey = (options: StateOptions) => {
    return `${options.scope}:${options.key}:${options.user}:${options.uuid}`;
  };

  constructor(options: StoreOptions) {
    super();
    this._states = new Map();
    this._queries = new Map();
    this._scopes = new Map();
    this._options = options;
    this._storing = false;
    if (options.file) {
      this.restore();
    }
  }

  restore = () => {
    const fn = path.resolve(this._options.file);

    if (fs.existsSync(fn)) {
      if (this._options.logger) {
        this._options.logger.info`Deserializing store from ${fn}`;
      }
      this._storing = true;
      const stream = fs.createReadStream(fn);
      const parseStream = json.createParseStream();

      parseStream.on('data', (pojo) => {
        this.dehydrate(pojo);
      });

      stream.pipe(parseStream);
    }
  };

  store = () => {
    const fn = path.resolve(this._options.file);
    if (this._storing) return;
    this._storing = true;
    if (this._options.logger) {
      this._options.logger.info`Serializing store to ${fn}`;
    }

    if (fs.existsSync(fn)) {
      fs.copyFileSync(fn, fn + '.bak');
      fs.unlinkSync(fn);
    }

    const writeStream = fs.createWriteStream(fn);
    const stream = this.serialize();
    stream.pipe(writeStream);

    stream.on('end', () => {
      if (this._options.logger) {
        this._options.logger.info`Serialized store to ${fn}`;
      }
      writeStream.end();
      this._storing = false;
    });
    writeStream.on('error', (err) => {
      writeStream.end();
      this._storing = false;
    });
  };

  sync = (interval = 1000 * 60) => {
    return setInterval(this.store, interval);
  };

  dehydrate = (obj) => {
    try {
      let _states;
      if (Array.isArray(obj)) {
        _states = obj;
      } else if (obj._states) {
        _states = obj._states;
      }
      // const scopes = new Map(_scopes);

      const states = new Map(_states);
      states.forEach((value: any, key) => {
        states.set(key, new State(value.value, value));
      });
      // scopes.forEach((value: any, key) => {
      //   const _states = new Map(value);
      //   _states.forEach((value: any, key) => {
      //     _states.set(key, states.get(key));
      //   });
      //   scopes.set(key, states);
      // });
      // Object.assign(this, { _scopes: scopes, _states: states });
      // this._scopes = scopes as any;
      this._states = states as any;
      if (this._options.logger) {
        this._options.logger.info`Deserialized store. ${this._states.size}`;
      }
      this.emit('dehydrate');
      this._storing = false;
    } catch (e) {
      throw new Error(`Invalid JSON`);
    }
  };

  serialize = () => {
    const { _options: _, ...rest } = this;
    const states = [...this._states.entries()];
    // const scopes = [...this._scopes.entries()].map(([key, value]) => {
    //   return [key, [...value.entries()].map((state) => cloneDeep(state))];
    // });
    const out = { _states: states };
    return json.createStringifyStream({
      body: out,
    });
  };

  getScope = (scope: string) => {
    if (this._scopes.has(scope)) return this._scopes.get(scope);
    this._scopes.set(scope, new Map());
    return this._scopes.get(scope);
  };

  hasQuery(key: string | StateOptions) {
    if (typeof key === 'string') {
      return this._queries.has(key);
    } else if (isStateOptions(key)) {
      return this._queries.has(Store.getKey(key));
    } else {
      return false;
    }
  }

  createQuery<T>(initialValue: StateValue<T>, options: QueryOptions) {
    if (this.hasQuery(options)) {
      return this._queries.get(Store.getKey(options));
    }
    const query = new Query(initialValue, options);
    query._store = this;
    this._queries.set(Store.getKey(options), query);
    return query;
  }

  query<T>(initialValue: StateValue<T>, options: StateOptions) {
    if (!this.hasQuery(options)) {
      return this.createQuery(initialValue, options);
    }
    const query = this._queries.get(Store.getKey(options));
    query._store = this;

    return query;
  }

  createState<T>(value: StateValue<T>, options?: StateOptions) {
    const state = new State(value, { ...options });
    state._store = this;

    if (options?.storeInitialState && this?._options?.transport) {
      console.log('Storing initial state', options.key);
      this._options.transport.setInitialState(state).then(() => {
        state.emit('stored', state.value);
        this.emit(`created::${state.key}`, state.value);
      });
    }

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
    if (!this.hasState(Store.getKey(options))) {
      return this.createState<T>(initialValue, options);
    }
    return this._states.get(Store.getKey(options));
  }

  // getStatesByUser = (userId: string) => {
  //   if (!this._options.transport) {
  //     this._;
  //   }

  //   return [...this._states.entries()].filter(
  //     ([_, state]) => state.user === userId
  //   );
  // };

  purgeLabels = (labels: string[]) => {
    for (const state of [...this._states.values()]) {
      if (state.labels.some((label) => labels.includes(label))) {
        this.deleteState({
          scope: state.scope,
          key: state.key,
          client: state.client,
          user: state.user,
        });
      }
    }
  };
}
