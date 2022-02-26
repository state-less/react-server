import { v4 as uuidv4 } from "uuid";
import ee from "event-emitter";
import {
  EVENT_STATE_ERROR,
  EVENT_STATE_USE,
  EVENT_STATE_SET,
  EVENT_STATE_PERMIT,
  EVENT_STATE_CREATE,
  EVENT_STATE_REQUEST,
  EVENT_SCOPE_CREATE,
  EVENT_STATE_DECLINE,
  SERVER_ID,
} from "../../consts";
import logger from "../../lib/logger";
import { StateOptions, UseStateOptions } from "../../interfaces";

const isFunction = (fn) => "function" === typeof fn;

class Broker {
  options: BrokerOptions;
  constructor(options: BrokerOptions) {
    this.options = options;
  }
  sync(state, client) {}
}

ee(Broker.prototype);

interface BrokerOptions {
  getScope?: Function;
}
class SocketIOBroker extends Broker {
  constructor(io, options: BrokerOptions = {}) {
    super(options);
    const { getScope = this.getScope } = options;
    Object.assign(this, { getScope });
  }

  getScope(socket, options) {
    let { scope = "client" } = options;
    return scope === "client" ? socket.id : scope;
  }

  emitError(socket, options, message) {
    socket.emit(EVENT_STATE_ERROR + ":" + options.clientId, {
      error: message,
      ...options,
    });
  }

  emit(socket, event, message) {
    socket.emit(event, message);
  }
  syncInitialState(state, socket, options) {
    const { id, value } = state;
    socket.emit(EVENT_STATE_CREATE + ":" + options.clientId, {
      id,
      value,
      ...options,
    });
  }

  sync(state, socket, ...args) {
    const { id, value, error } = state;
    const { message, stack } = error || {};

    const syncObject = {
      id,
      value,
      error: error ? { message, stack } : null,
    };

    socket.emit(EVENT_STATE_SET + ":" + id, syncObject);
  }
}

interface StoreOptions {
  key?: string;
  parent?: Store;
  autoCreate?: boolean;
  onRequestState?: Function;
  StateConstructor?: typeof State;
  StoreConstructor?: typeof Store;
  broker?: Broker;
}

interface CreateStateOptions {}

class Store {
  map: Map<string, State>;
  actions: Map<string, any>;
  scopes: Map<string, Store>;
  StateConstructor: typeof State;
  StoreConstructor?: typeof Store;
  key: string;
  autoCreate: boolean;
  broker?: Broker;
  options: StateOptions;
  parent?: Store;

  static STATE_PERMIT_DEFAULT: boolean;

  constructor(options: StoreOptions = {}) {
    const {
      key = SERVER_ID,
      parent = null,
      autoCreate = false,
      onRequestState,
      StateConstructor = State,
      StoreConstructor = Store,
      broker,
    } = options;
    this.map = new Map();
    this.actions = new Map();
    this.scopes = new Map();

    this.StateConstructor = StateConstructor;
    this.StoreConstructor = StoreConstructor;

    Object.assign(this, { key, parent, autoCreate, onRequestState, broker });
    this.useState = this.useState.bind(this);
    this.useStateSync = this.useStateSync.bind(this);
  }

  has(key: string): boolean | Promise<boolean> {
    return this.map.has(key);
  }

  get(key: string): State | Promise<State> {
    return this.map.get(key);
  }

  purge = () => {
    this.map.forEach((state) => {
      const [options = {}] = state.args || [];
      if (options.ttl) {
      }
      if (options.ttl && +new Date() - state.createdAt > options.ttl) {
        this.deleteState(state.key);
      }
    });
    this.scopes.forEach((scope) => {
      scope.purge();
    });
  };

  clone(options: StoreOptions) {
    const { StoreConstructor = Store } = options;
    return new StoreConstructor(options);
  }

  /**
   *
   * @param {String} key - The key of the subscope
   * @param  {...any} args - Additional args passed to the store constructor.
   * @returns {Store} - A new store instance
   */
  scope(key, options = {}) {
    const { StateConstructor, StoreConstructor, ...rest } = this;
    if (this.scopes.has(key)) {
      return this.scopes.get(key);
    }

    if (/\./.test(key)) {
      key = key.split(".");
      if (key[0] === this.key) return this.scope(key.slice(1), options);
    }

    if (Array.isArray(key) && this.scopes.has(key[0])) {
      return this.scopes.get(key[0]).scope(key.slice(1), options);
    } else if (Array.isArray(key) && key.length === 0) {
      return this;
    } else if (key === this.key) {
      return this;
    }

    if (Array.isArray(key) && !this.scopes.has(key[0])) {
      const { autoCreate, onRequestState } = this;
      const store = this.clone({
        ...rest,
        autoCreate,
        onRequestState,
        StateConstructor,
        StoreConstructor,
        key: `${this.key}.${key[0]}`,
        parent: this,
        ...options,
      });

      this.scopes.set(key[0], store);

      store.actions = this.actions;

      this.emit(EVENT_SCOPE_CREATE, store, key, options);
      return store.scope(key.slice(1));
    }

    const { autoCreate, onRequestState } = this;
    const store = this.clone({
      ...rest,
      autoCreate: true,
      onRequestState,
      StateConstructor,
      StoreConstructor,
      key: `${this.key}.${key}`,
      parent: this,
      ...options,
    });

    this.scopes.set(key, store);

    store.actions = this.actions;

    this.emit(EVENT_SCOPE_CREATE, store, key, options);
    return store;
  }

  path(...keys) {}

  createState(
    key,
    def,
    options: UseStateOptions = {},
    ...args
  ): State | Promise<State> {
    const { StateConstructor } = this;
    const state = new StateConstructor(def, {
      ...options,
      broker: this.broker,
    });
    const { scope = this.key } = options;

    if (!key) key = state.id;

    state.key = key;

    /** I'm not sure whether the store should handle creating subscopes or the component controller */
    /** TODO: Think of a better scoping mechanism  */
    /** TODO: infinite loop when no scope passed */
    // if (scope && scope !== this.key && scope !== this.key.split('.').pop()) {
    //     return this.scope(scope).createState(key, def, {
    //         ...options,
    //         scope: scope.split('.').slice(1).join('.')
    //     }, ...args);
    // }
    /** The states scope should be the key of the store it was created in */
    state.scope = this.key;

    state.options = options;
    state.args = args;

    this.map.set(key, state);

    let parent: any = this;
    do {
      parent.emit(EVENT_STATE_CREATE, this, state, key, ...args);
    } while ((parent = parent.parent));
    return state;
  }

  deleteState = (key) => {
    this.map.delete(key);
  };

  /**
   * @description Callback to accept or deny requests to use a state.
   * @param {any} key - The key of the state.
   * @param {*} options - The options
   * @param  {...any} args - Additional arguments
   */
  onRequestState = (key, options, ...args) => false;

  requestState = (key, options, ...args) => {
    this.emit(EVENT_STATE_REQUEST, key, options, ...args);

    //Deny all state requests by default
    let permitted = Store.STATE_PERMIT_DEFAULT;
    if (isFunction(this.onRequestState)) {
      permitted = this.onRequestState(key, options, ...args);
    }

    if (permitted) {
      this.emit(EVENT_STATE_PERMIT, key, options, ...args);
    } else {
      this.emit(EVENT_STATE_DECLINE, key, options, ...args);
    }
    return permitted;
  };

  validateUseStateArgs(key, def, options: UseStateOptions = {}, ...args) {
    this.emit(EVENT_STATE_USE, key, def, ...args);

    // const {scope, ...rest} = options;

    if (typeof key !== "string") {
    }

    if (def?.scope) {
    }
    // if (scope) {
    //     return this.scope(scope).useState(key, def, {...rest}, ...args);
    // }

    options.scope = options.scope || this.key;
  }

  useState(key, def, options: UseStateOptions = {}, ...args) {
    this.validateUseStateArgs(key, def, options, ...args);

    if (Store.prototype.has.call(this, key) && this.key === options.scope)
      return Store.prototype.get.call(this, key);

    if (this.autoCreate)
      return Store.prototype.createState.call(key, def, options, ...args);
  }

  useStateSync(key, def, options, ...args) {
    return this.useState(key, def, options, ...args);
  }

  throwNotAvailble(key) {
    throw new Error(`Attempt to use non-existent state '${key}' failed.`);
  }

  action(key, callback) {
    if ("function" !== typeof callback)
      throw new Error("Expected callback to be of type function.");

    this.actions.set(key, callback);
  }

  exec = (key, args, ...extra) => {
    const action = this.actions.get(key);

    if (!isFunction(action)) {
      throw new Error(
        "Attemp to call action ${key} failed. Action is not of type function"
      );
    }

    const result = action(...args);
    return result;
  };

  emit = (...args) => {
    //Append events to callstack in order to get chained methods to work.
    setImmediate(() => {
      Store.prototype.emit.call(this, ...args);
    });
    this.parent && this.parent.emit(...args);
  };
}

Store.STATE_PERMIT_DEFAULT = false;

ee(Store.prototype);

class State {
  args: any[];
  createdAt: number;
  key: string;
  value: any;
  emit: Function;
  error: Error;
  brokers: [Broker, any[]];
  id: string;
  scope: string;
  options: StateOptions;
  static sync: Function;
  static genId: Function;

  constructor(defaultValue, options: StateOptions = {}) {
    const { syncInitialState = false, args, ...rest } = options;

    const id = State.genId();

    const instanceVariables = {
      createdAt: +new Date(),
      id,
      args,
      value: defaultValue,
      defaultValue,
      syncInitialState,
      brokers: [],
      ...rest,
    };

    Object.assign(this, instanceVariables);

    if (syncInitialState) this.setValue(defaultValue);
    // setImmediate(() => {
    // })
    this.setValue = this.setValue.bind(this);
  }

  setValue(value, initial = false): any | Promise<any> {
    this.value = value;
    this.emit("setValue", value);

    return State.sync(this);
  }

  getValue() {
    return this.value;
  }

  setError = (error) => {
    this.error = error;
    State.sync(this);
  };

  publish() {
    State.sync(this);
  }

  sync(broker, ...args): any {
    this.brokers.push([broker, args]);
    // State.sync(this);
    return this;
  }

  unsync(broker, filterFn) {
    const index = this.brokers.findIndex((entry: [Broker, any[]]) => {
      const [_broker, _args] = entry;
      const match = filterFn(_args);
      return match; //_broker == broker //&& !match;
    });
    this.brokers.splice(index, 1);
  }
}

State.genId = () => {
  return uuidv4();
};
ee(State.prototype);

State.sync = (instance) => {
  instance.brokers.forEach((entry, i) => {
    const [broker, args] = entry;
    if (typeof broker === "function") {
      broker(instance, ...args);
    } else if (broker instanceof Broker) {
      broker.sync(instance, args[0]);
    }
  });
};

logger.setState(State);

export { State, SocketIOBroker, Store, Broker };
