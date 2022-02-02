"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Broker = exports.Store = exports.SocketIOBroker = exports.State = void 0;

var _uuid = require("uuid");

var _eventEmitter = _interopRequireDefault(require("event-emitter"));

var _consts = require("../../consts");

var _logger = _interopRequireDefault(require("../../lib/logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const isFunction = fn => 'function' === typeof fn;

class Broker {
  constructor(options) {
    this.options = options;
  }

  sync(state, client) {}

}

exports.Broker = Broker;
(0, _eventEmitter.default)(Broker.prototype);

class SocketIOBroker extends Broker {
  constructor(io, options = {}) {
    super(options);
    const {
      getScope = this.getScope
    } = options;
    Object.assign(this, {
      getScope
    });
  }

  getScope(socket, options) {
    let {
      scope = 'client'
    } = options;
    return scope === 'client' ? socket.id : scope;
  }

  emitError(socket, options, message) {
    socket.emit(_consts.EVENT_STATE_ERROR + ':' + options.clientId, {
      error: message,
      ...options
    });
  }

  emit(socket, event, message) {
    socket.emit(event, message);
  }

  syncInitialState(state, socket, options) {
    const {
      id,
      value
    } = state;
    socket.emit(_consts.EVENT_STATE_CREATE + ':' + options.clientId, {
      id,
      value,
      ...options
    });
  }

  sync(state, socket, ...args) {
    const {
      id,
      value,
      error
    } = state;
    const {
      message,
      stack
    } = error || {};
    const syncObject = {
      id,
      value,
      error: error ? {
        message,
        stack
      } : null
    };
    socket.emit(_consts.EVENT_STATE_SET + ':' + id, syncObject);
  }

}

exports.SocketIOBroker = SocketIOBroker;

class Store {
  constructor(_options = {}) {
    _defineProperty(this, "purge", () => {
      this.map.forEach(state => {
        const [options = {}] = state.args || [];

        if (options.ttl) {}

        if (options.ttl && +new Date() - state.createdAt > options.ttl) {
          this.deleteState(state.key);
        }
      });
      this.scopes.forEach(scope => {
        scope.purge();
      });
    });

    _defineProperty(this, "createState", (key, def, options = {}, ...args) => {
      const {
        StateConstructor
      } = this;
      const state = new StateConstructor(def, { ...options,
        broker: this.broker
      });
      const {
        scope = this.key
      } = options;
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
      let parent = this;

      do {
        parent.emit(_consts.EVENT_STATE_CREATE, this, state, key, ...args);
      } while (parent = parent.parent);

      return state;
    });

    _defineProperty(this, "deleteState", key => {
      this.map.delete(key);
    });

    _defineProperty(this, "onRequestState", (key, options, ...args) => false);

    _defineProperty(this, "requestState", (key, options, ...args) => {
      this.emit(_consts.EVENT_STATE_REQUEST, key, options, ...args); //Deny all state requests by default

      let permitted = Store.STATE_PERMIT_DEFAULT;

      if (isFunction(this.onRequestState)) {
        permitted = this.onRequestState(key, options, ...args);
      }

      if (permitted) {
        this.emit(_consts.EVENT_STATE_PERMIT, key, options, ...args);
      } else {
        this.emit(_consts.EVENT_STATE_DECLINE, key, options, ...args);
      }

      return permitted;
    });

    _defineProperty(this, "exec", (key, args, ...extra) => {
      const action = this.actions.get(key);

      if (!isFunction(action)) {
        throw new Error('Attemp to call action ${key} failed. Action is not of type function');
      }

      const result = action(...args);
      return result;
    });

    _defineProperty(this, "emit", (...args) => {
      //Append events to callstack in order to get chained methods to work.
      setImmediate(() => {
        Store.prototype.emit.call(this, ...args);
      });
      this.parent && this.parent.emit(...args);
    });

    const {
      key: _key = _consts.SERVER_ID,
      parent: _parent = null,
      autoCreate = false,
      onRequestState,
      StateConstructor: _StateConstructor = State,
      broker
    } = _options;
    this.map = new Map();
    this.actions = new Map();
    this.scopes = new Map();
    this.StateConstructor = _StateConstructor;
    Object.assign(this, {
      key: _key,
      parent: _parent,
      autoCreate,
      onRequestState,
      broker
    });
    this.useState = this.useState.bind(this);
  }

  has(key) {
    return this.map.has(key);
  }

  get(key) {
    return this.map.get(key);
  }

  clone(options, ...args) {
    const {
      StoreConstructor = Store
    } = options;
    return new StoreConstructor(options, ...args);
  }
  /**
   * 
   * @param {String} key - The key of the subscope
   * @param  {...any} args - Additional args passed to the store constructor.
   * @returns {Store} - A new store instance
   */


  scope(key, options = {}) {
    const {
      StateConstructor,
      ...rest
    } = this;

    if (this.scopes.has(key)) {
      return this.scopes.get(key);
    }

    if (/\./.test(key)) {
      key = key.split('.');
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
      const {
        autoCreate,
        onRequestState
      } = this;
      const store = this.clone({ ...rest,
        autoCreate,
        onRequestState,
        StateConstructor,
        key: `${this.key}.${key[0]}`,
        parent: this,
        ...options
      });
      this.scopes.set(key[0], store);
      store.actions = this.actions;
      this.emit(_consts.EVENT_SCOPE_CREATE, store, key, options);
      return store.scope(key.slice(1));
    }

    const {
      autoCreate,
      onRequestState
    } = this;
    const store = this.clone({ ...rest,
      autoCreate: true,
      onRequestState,
      StateConstructor,
      key: `${this.key}.${key}`,
      parent: this
    });
    this.scopes.set(key, store);
    store.actions = this.actions;
    this.emit(_consts.EVENT_SCOPE_CREATE, store, key, options);
    return store;
  }

  path(...keys) {}

  validateUseStateArgs(key, def, options = {}, ...args) {
    this.emit(_consts.EVENT_STATE_USE, key, def, ...args); // const {scope, ...rest} = options;

    if (typeof key !== 'string') {}

    if (def !== null && def !== void 0 && def.scope) {} // if (scope) {
    //     return this.scope(scope).useState(key, def, {...rest}, ...args);
    // }


    options.scope = options.scope || this.key;
  }

  useState(key, def, options = {}, ...args) {
    this.validateUseStateArgs(key, def, options, ...args);
    if (this.has(key) && this.key === options.scope) return this.get(key);
    if (this.autoCreate) return this.createState(key, def, options, ...args);
  }

  throwNotAvailble(key) {
    throw new Error(`Attempt to use non-existent state '${key}' failed.`);
  }

  action(key, callback) {
    if ('function' !== typeof callback) throw new Error('Expected callback to be of type function.');
    this.actions.set(key, callback);
  }

}

exports.Store = Store;
Store.STATE_PERMIT_DEFAULT = false;
(0, _eventEmitter.default)(Store.prototype);

class State {
  constructor(defaultValue, options = {}) {
    _defineProperty(this, "setError", error => {
      this.error = error;
      State.sync(this);
    });

    const {
      syncInitialState = false,
      args,
      ...rest
    } = options;
    const id = State.genId();
    const instanceVariables = {
      createdAt: +new Date(),
      id,
      args,
      value: defaultValue,
      defaultValue,
      syncInitialState,
      brokers: [],
      ...rest
    };
    Object.assign(this, instanceVariables);
    if (syncInitialState) this.setValue(defaultValue); // setImmediate(() => {
    // })

    this.setValue = this.setValue.bind(this);
  }

  setValue(value) {
    this.value = value;
    this.emit('setValue', value);
    return State.sync(this);
  }

  getValue() {
    return this.value;
  }

  publish() {
    State.sync(this);
  }

  sync(broker, ...args) {
    this.brokers.push([broker, args]); // State.sync(this);

    return this;
  }

  unsync(broker, filterFn) {
    const index = this.brokers.findIndex(entry => {
      const [_broker, _args] = entry;
      const match = filterFn(_args);
      return match; //_broker == broker //&& !match;
    });
    this.brokers.splice(index, 1);
  }

}

exports.State = State;

State.genId = () => {
  return (0, _uuid.v4)();
};

(0, _eventEmitter.default)(State.prototype);

State.sync = instance => {
  instance.brokers.forEach((entry, i) => {
    const [broker, args] = entry;

    if (typeof broker === 'function') {
      broker(instance, ...args);
    } else if (broker instanceof Broker) {
      broker.sync(instance, args[0]);
    }
  });
};

_logger.default.setState(State);