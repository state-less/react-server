"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LambdaBroker = exports.DynamodbStore = exports.DynamoDBState = void 0;

var _ = require("./");

var _Atomic = require("./Atomic");

var _DynamoDB = require("@state-less/atomic/DynamoDB");

var _util = require("./util");

var _websocket = require("../../lib/response-lib/websocket");

var _dynamodbLib = require("../../lib/dynamodb-lib");

var _consts = require("../../consts");

var _logger = _interopRequireDefault(require("../../lib/logger"));

var _interfaces = require("../../interfaces");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

;

class LambdaBroker extends _.Broker {
  constructor(options = {}) {
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
  } //rename to publish


  async sync(state, connection, requestId) {
    if (connection.endpoint === 'localhost') return;
    const {
      id,
      value,
      error
    } = state; // const {message, stack} = error || {};

    const syncObject = {
      id,
      value
    };
    const data = (0, _websocket.success)(syncObject, {
      action: 'setValue',
      requestId
    });

    try {
      return await (0, _util.emit)(connection, data);
      ;
    } catch (e) {
      await state.unsync(this, connection);
    }
  }

  async consume(state) {}

}

exports.LambdaBroker = LambdaBroker;
;

const copyStateVariables = ({
  key,
  scope,
  id
}) => ({
  key,
  scope,
  id
});

class DynamoDBState extends _Atomic.AtomicState {
  constructor(def, options) {
    super(def, options);
    Object.freeze(this.value);
    this.setValue = this.setValue.bind(this);
  }

  compileExpression(nextValue) {
    const {
      key,
      value,
      updateEquation
    } = this;
    _logger.default.info`Compiling expression ${value} ${nextValue}`;
    /**
     * Compiles an array of numbers to atomic update expressions.
     */

    if (value.length) {
      if (value.length !== nextValue.length) {
        throw new Error(`Atomic arrays need to be of same length! Reveived ${value} ${nextValue}`);
      }

      const trees = Object.values(value).map((val, i) => {
        return updateEquation(val, nextValue[i]);
      });
      const updateEq = this.compile(trees);
      return updateEq;
    }
    /**
     * Compiles a single number into a atomic update expression.
     */


    if (typeof value === 'number') {
      return this.compile(updateEquation(value, nextValue));
    }
  }

  compile(...trees) {
    return (0, _DynamoDB.compile)(...trees);
  }

  async setInternalValue(value) {
    this.value = value;
  }

  async setValue(value, initial) {
    if (Array.isArray(value) && initial) {
      const fakeArray = { ...this.value,
        $$isArray: true
      };
      fakeArray.length = this.value.length;
      await (0, _dynamodbLib.put)({ ...this,
        value: fakeArray
      }, 'dev2-states');
      this.value = value;
      /**
       * TODO: for some reason this.isAtomic is not set correctly even though options.atomic is filled. 
       * analyse.
       */
    } else if (!initial && (this.isAtomic || this.options.atomic)) {
      const expr = this.compileExpression(value);
      const {
        key,
        scope
      } = this;

      try {
        const res = await (0, _dynamodbLib.update)({
          key,
          scope
        }, expr, 'dev2-states');

        if (typeof res.Attributes.value === 'object') {
          /** Apply updated results partially (saves bandwidth) */
          Object.assign(this.value, res.Attributes.value);
        } else {
          this.value = res.Attributes.value;
        }
      } catch (e) {}
    } else {
      // const encrypted = JSON.stringify(encryptValue(value));
      const {
        key,
        scope,
        id
      } = { ...this
      };

      try {
        await (0, _dynamodbLib.put)({
          key,
          scope,
          id,
          value
        }, 'dev2-states');
      } catch (e) {//this.error = e.message;
      } finally {
        this.value = value;
      }
    }

    this.emit('setValue', this);
    /** 
     * Execute the sync after the callstack completed
     * otherwise it can happen that the client
     * tries to render a component which doesn't yet 
     * exist on the serverside
     */

    setTimeout(() => {
      DynamoDBState.sync(this, new LambdaBroker());
    }, 10);
  }

  async publish(broker, connectionInfo, requestId) {
    super.publish();
    return await DynamoDBState.sync(this, broker, requestId);
  }

  async sync(broker, connectionInfo, requestId) {
    const {
      key,
      scope
    } = this;
    super.sync(broker, connectionInfo, requestId);

    try {
      let res = await (0, _dynamodbLib.put)({
        id: connectionInfo.id,
        key: `${scope}:${key}`,
        connectionInfo
      }, 'dev2-subscriptions');
      res = await (0, _dynamodbLib.put)({
        id: `${scope}:${key}`,
        key: connectionInfo.id,
        connectionInfo
      }, 'dev2-subscriptions');
      return void 0;
    } catch (e) {}
  }

  async unsync(broker, connectionInfo) {
    const {
      key,
      scope
    } = this;

    try {
      let res = await (0, _dynamodbLib.del)({
        id: connectionInfo.id,
        key: `${scope}:${key}`
      }, 'dev2-subscriptions');
      res = await (0, _dynamodbLib.del)({
        key: connectionInfo.id,
        id: `${scope}:${key}`
      }, 'dev2-subscriptions');
      return res;
    } catch (e) {
      throw e;
    }
  }

  async getValue(key) {
    let state;

    try {
      state = await (0, _dynamodbLib.get)({
        key: this.key,
        scope: this.scope
      }, 'dev2-states');
    } catch (e) {}

    if (state.Item) {
      var _state$Item$value;

      if (!Array.isArray(state.Item.value) && (_state$Item$value = state.Item.value) !== null && _state$Item$value !== void 0 && _state$Item$value.$$isArray) {
        this.value = Array.from(state.Item.value);
      } else {
        this.value = state.Item.value;
      }

      const {
        id,
        defaultValue,
        atomic,
        isAtomic
      } = state.Item;
      Object.assign(this, {
        id,
        defaultValue,
        atomic,
        isAtomic
      });
      return true;
    } else {
      return null;
    }
  }

}

exports.DynamoDBState = DynamoDBState;

DynamoDBState.sync = async (instance, broker, requestId) => {
  const {
    scope,
    key
  } = instance;

  _.State.sync(instance);

  const result = await (0, _dynamodbLib.query)({
    id: `${scope}:${key}`
  }, 'dev2-subscriptions');

  if (!result.Items) {
    throw new Error(`Could not get state subscriptions for state ${instance}`);
  }

  const {
    Items: subscriptions
  } = result;

  try {
    const syncResult = await Promise.all(subscriptions.map(item => {
      const {
        connectionInfo
      } = item;
      return broker.sync(instance, connectionInfo, requestId);
    }));
    return syncResult;
  } catch (e) {
    throw e;
  }
};

class DynamodbStore extends _.Store {
  constructor(options = {}) {
    const {
      key = _consts.SERVER_ID,
      parent = null,
      autoCreate = false,
      onRequestState,
      StateConstructor = DynamoDBState,
      TableName,
      broker
    } = options;
    super({
      key,
      parent,
      autoCreate,
      onRequestState,
      StateConstructor,
      broker
    });
    Object.assign(this, {
      TableName
    });
    this.useState = this.useState.bind(this);
    this.deleteState = this._deleteState.bind(this);
  }

  async has(stateKey, scope = "base") {
    if (super.has(stateKey)) {
      return true;
    }

    const state = await (0, _dynamodbLib.get)({
      key: stateKey,
      scope: scope
    }, 'dev2-states');
    const hasState = !!state.Item;
    return hasState;
  }

  async get(key, def, options, ...args) {
    const {
      cache = "CACHE_FIRST"
    } = options;

    if (super.has(key)) {
      const state = super.get(key);

      if (cache !== 'NETWORK_FIRST') {
        return state;
      } else {
        await state.getValue();
        return state;
      }
    }

    const state = this.createState(key, def, options, ...args); //TODO: Refactor. Make this a static method that writes to the instance from the outside.
    //Void!

    await state.getValue();
    return state;
  }

  async scanStates(stateKey, scope = this.key) {
    const params = {
      TableName: 'dev2-states',
      FilterExpression: '#key = :state AND begins_with(#scope, :scope)',
      ExpressionAttributeValues: {
        ':state': stateKey,
        ':scope': scope
      },
      ExpressionAttributeNames: {
        '#key': 'key',
        '#scope': 'scope'
      }
    };
    const states = await (0, _dynamodbLib.scan)(params);
    return await Promise.all(states.Items.map(s => this.useState(stateKey, s.value, {
      scope: s.scope
    })));
  }

  async scanScopes(scope = this.key) {
    const params = {
      TableName: 'dev2-states',
      FilterExpression: 'begins_with(#scope, :scope)',
      ExpressionAttributeValues: {
        // ':state' : stateKey,
        ':scope': scope
      },
      ExpressionAttributeNames: {
        // '#key' : 'key',
        '#scope': 'scope'
      }
    };
    const states = await (0, _dynamodbLib.scan)(params);
    console.log("SCAN RESULT", states);
    return states.Items;

    for (var i = 0; i < states.length; i++) {
      const s = states[i];
      states[i] = await this.useState(s.key, s.value, {
        scope: s.scope
      });
    }
  }

  clone(...args) {
    return new DynamodbStore(...args);
  }

  async useState(key, def, options = {
    throwIfNotAvailable: false
  }, ...args) {
    const {
      cache = _interfaces.CacheBehaviour.CACHE_FIRST
    } = options;
    this.validateUseStateArgs(key, def, options, ...args);
    const hasKey = await this.has(key, options.scope);
    if (hasKey) return await this.get(key, def, options, ...args);

    if (this.autoCreate) {
      const state = this.createState(key, def, options, ...args);
      await state.setValue(def, true);
      return state;
    }

    if (options.throwIfNotAvailable || !this.autoCreate) {
      this.throwNotAvailble(key);
    }
  }

  async _deleteState(key) {
    await (0, _dynamodbLib.del)({
      key,
      scope: this.key
    }, 'dev2-states');
  }

}

exports.DynamodbStore = DynamodbStore;