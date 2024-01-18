import { createId, isStateOptions } from '../lib/util';
import { Transport } from './transport';
import ee from 'event-emitter';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import json from 'big-json';
import cloneDeep from 'clone-deep';

type PrimitiveValue = string | number;

export type GenericStateValue = PrimitiveValue | Array<PrimitiveValue>;
// | { [key: string]: GenericStateValue };

export type StateValue<T = unknown> = T;

export type SetValueAction<T> =
  | StateValue<T>
  | ((value: StateValue<T>) => StateValue<T>);

export type StateOptions = {
  scope: string;
  key: string;
  labels?: string[];
  id?: string;
};

export class State<T> extends EventEmitter {
  id: string;
  key: string;
  scope: string;
  value: StateValue<T>;
  timestamp: number;
  labels: string[];

  _store: Store;

  constructor(initialValue: StateValue<T>, options: StateOptions) {
    super();
    this.id = options.id || createId(options.scope);
    this.key = options.key;
    this.scope = options.scope;
    this.labels = options.labels || [];
    this.value = initialValue;
    this.timestamp = 0;
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
    console.log('Emitting change', this.key);
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

    this.value = value;
    this.timestamp = +new Date();

    if (this?._store?._options?.transport) {
      this._store._options.transport.setState(this);
      this.publish();
    } else {
      this.publish();
    }

    return this;
  }

  async getValue(timestamp: number) {
    if (this?._store?._options?.transport) {
      const storedState = await this._store._options.transport.getState<T>(
        this.scope,
        this.key
      );

      if (storedState !== null) {
        const oldValue = this.value;
        this.value = storedState.value;

        if (JSON.stringify(oldValue) !== JSON.stringify(this.value)) {
          this.publish();
        }
      }
    }
    return this.value;
  }
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
  _states: Map<string, State<any>>;
  _options: StoreOptions;
  _storing: boolean;

  static getKey = (options: StateOptions) => {
    return `${options.scope}:${options.key}`;
  };

  constructor(options: StoreOptions) {
    super();
    this._states = new Map();
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
