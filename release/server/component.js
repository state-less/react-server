"use strict";

const {
  v4: uuidv4,
  v4
} = require("uuid");

const {
  EVENT_STATE_SET,
  NETWORK_FIRST,
  SERVER_ID,
  CACHE_FIRST
} = require("../consts");

const _logger = require("../lib/logger");

const {
  assertIsValid
} = require("../util");

let componentLogger = _logger.scope('state-server.component');

let lifecycle = _logger.scope('state-server.lifecycle'); // const CACHE_FIRST = 'CACHE_FIRST';
// const NETWORK_FIRST = 'NETWORK_FIRST';
// const SERVER_ID = 'base';


const isEqual = (arrA, arrB) => {
  if (!Array.isArray(arrA) && Array.isArray(arrB)) return false;
  if (!Array.isArray(arrB) && Array.isArray(arrA)) return false;
  return arrA.reduce((acc, cur, i) => {
    return acc && cur == arrB[i];
  }, true);
};

const Component = (fn, baseStore) => {
  let logger;

  if (!baseStore) {
    componentLogger.warning`Missing store. Using default component store. (You might want to pass a store instance)`;
    throw new Error('Missing store'); // Store = componentStore;
  }

  let effectIndex = 0;
  let clientEffectIndex = 0;
  let stateIndex = 0;
  let fnIndex = 0;
  const {
    useState: useComponentState
  } = baseStore;
  let lastState;

  const component = async (props = null, key, options, clientProps, socket = {
    id: SERVER_ID
  }) => {
    let scopedUseEffect;
    let scopedUseClientEffect;
    let scopedUseState;
    let scopedUseClientState;
    let scopedUseFunction;
    let scopedTimeout;
    let effects = [];
    let clientEffects = [];
    let states = [];
    let promises = []; // let functions = [[]];

    let dependencies = [];
    logger = componentLogger.scope(`${key}:${socket.id}`);
    /** TODO: Think of a way to provide a component state scope */
    // const componentState = await useComponentState(key, {}, {scope: socket.id});

    const componentState = await useComponentState(key, {});
    const {
      value: lastResult,
      setValue: setResult
    } = componentState;

    const cannotSetClientStateError = () => {
      throw new Error('Cannot set access client state from server');
    }; //Logger that sends anything to the client rendering the current component.


    lifecycle = logger;
    let {
      ttl = Infinity,
      createdAt,
      store = baseStore.scope(key)
    } = options;
    const id = Math.random();
    const stateValues = new Map();

    scopedUseState = async (initial, stateKey, {
      deny,
      scope,
      ...rest
    } = {}) => {
      var _states$stateIndex;

      if (deny) {
        return [null, () => {
          throw new Error('Attempt to set unauthenticated state');
        }];
      }

      let scopedStore;

      if (scope) {
        scopedStore = store.scope(scope);
      } else {
        scopedStore = store;
      }

      const {
        useState,
        deleteState
      } = scopedStore;
      let scopedKey = ((_states$stateIndex = states[stateIndex]) === null || _states$stateIndex === void 0 ? void 0 : _states$stateIndex.key) || stateKey || uuidv4();
      const state = states[stateIndex] || (await useState(scopedKey, initial, {
        temp: !stateKey,
        cache: Component.defaultCacheBehaviour,
        ...rest
      }));
      let {
        value,
        setValue
      } = state;
      if (!(value instanceof Object)) value = Object(value);
      stateValues.set(value, state);
      let mounted = true;

      const boundSetValue = async function (value) {
        if (mounted === false) {
          throw new Error(`setState called on unmounted component. Be sure to remove all listeners and asynchronous function in the cleanup function of the effect.`);
        }

        await setValue(value); // const was = Component.useEffect;

        Component.useEffect = scopedUseEffect;
        Component.useClientEffect = scopedUseClientEffect;
        Component.useState = scopedUseState;
        Component.useClientState = scopedUseClientState;
        Component.useFunction = scopedUseFunction;

        try {
          // setImmediate(() => {
          await render(); // })
        } catch (e) {
          socket.emit('error', key, 'component:render', e.message);
        } // Component.useEffect = was;


        mounted = false;
      };

      states[stateIndex] = state;
      stateIndex++;
      return [value, boundSetValue, state];
    };

    scopedUseClientState = (...args) => {
      if (Component.isServer(socket)) {
        if (states[stateIndex]) {
          states[stateIndex] = states[stateIndex];
          stateIndex++;
          return states[stateIndex];
        }

        stateIndex++;
        return [null, cannotSetClientStateError];
      }

      return scopedUseState(...args);
    };

    scopedUseEffect = (fn, deps = [], notifyClient) => {
      if (!Component.isServer(socket)) return;
      const [lastDeps = [], cleanup] = effects[effectIndex] || [];

      if (!isEqual(lastDeps, deps) || !lastDeps.length) {
        if (cleanup && 'function' === typeof cleanup) {
          cleanup();
        }

        let nextCleanup = fn() || (() => {});

        effects[effectIndex] = [deps, nextCleanup];
      } else {}

      effectIndex++;
    };

    scopedUseClientEffect = (fn, deps) => {
      if (Component.isServer(socket)) return;
      const [lastDeps, cleanup] = clientEffects[clientEffectIndex - 1] || [];

      if (!deps || !isEqual(lastDeps, deps)) {
        if (cleanup && 'function' === typeof cleanup) cleanup();

        const nextCleanup = fn() || (() => {});

        clientEffects[clientEffectIndex] = [deps, nextCleanup];
      } else {}

      clientEffectIndex++;
    };

    scopedUseFunction = fn => {
      const id = functions[fnIndex][0] || v4();
      functions[fnIndex] = [id, fn];
      fnIndex++;
    };

    scopedTimeout = (fn, timeout, ...args) => {
      let to = Math.random();
      promises.push(new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(fn(...args));
        }, timeout, ...args);
      }));
      return to;
    };

    let cleanup = () => {
      states.forEach(state => {
        const {
          temp
        } = state.options;

        if (temp) {
          deleteState(state.key);
        }
      });
      clientEffects.forEach(cleanup => {
        if (cleanup && 'function' === typeof cleanup) cleanup();
      });
      effects.forEach(cleanup => {
        if (cleanup && 'function' === typeof cleanup) cleanup();
      });
    };

    let render = async () => {
      stateIndex = 0;
      effectIndex = 0;
      fnIndex = 0;

      if (+new Date() - createdAt > ttl) {
        throw new Error('Component expired.');
      }

      const result = await fn(props, clientProps, socket);

      if (!result && result !== null) {
        throw new Error('Nothing returned from render. This usually means you have forgotten to return anything from your component.');
      }

      if (result && result.component === 'ClientComponent') {
        var _result$props, _result$props2, _result$props3, _result$props3$childr;

        for (const stateReferenceKey in result.props) {
          const stateValue = result.props[stateReferenceKey];

          if (stateValues.has(stateValue)) {
            const {
              createdAt,
              scope,
              value,
              defaultValue,
              key,
              id
            } = stateValues.get(stateValue);
            if (id) result.props[stateReferenceKey] = {
              createdAt,
              scope,
              value,
              defaultValue,
              key,
              id
            };
          }
        }

        if ((_result$props = result.props) !== null && _result$props !== void 0 && _result$props.children && !Array.isArray((_result$props2 = result.props) === null || _result$props2 === void 0 ? void 0 : _result$props2.children)) {
          result.props.children = [result.props.children];
        }

        const actions = (_result$props3 = result.props) === null || _result$props3 === void 0 ? void 0 : (_result$props3$childr = _result$props3.children) === null || _result$props3$childr === void 0 ? void 0 : _result$props3$childr.filter(action => {
          return action.component === 'Action';
        }).forEach(action => {
          action.props.boundHandler = action.props.handler;
          action.props.handler = Object.keys(action.props.handler);
        });
      } else if (result) {
        for (const lookupReference in result.states) {
          const stateValue = result.states[lookupReference];

          if (stateValues.has(stateValue)) {
            const {
              key: stateKey,
              scope
            } = stateValues.get(stateValue);
            if (lookupReference) result.states[lookupReference] = [stateKey, scope];
          }
        }
      }

      const scope = Component.scope.get(socket.id) || new Map();
      Component.scope.set(socket.id, scope);
      scope.set(key, componentState); //Implement publish mechanism based on configuration/environment.
      //Render server publishes on render. That updates the cache of the fallback renderer running serverless. (that's what happens right now)

      if (!lastResult || !lastResult.props || Object.keys(lastResult.props).length !== Object.keys(result.props).length) {
        const res = await setResult(result);
      }

      await Promise.all(promises);
      return result;
    };

    Component.setTimeout = scopedTimeout;
    Component.useEffect = scopedUseEffect;
    Component.useClientEffect = scopedUseClientEffect;
    Component.useState = scopedUseState;
    Component.useClientState = scopedUseClientState;
    Component.useFunction = scopedUseFunction;
    const rendered = await render();
    rendered.key = key;
    return rendered;
  };

  return (props, key, options = {}) => {
    const createdAt = +new Date();
    let bound = component.bind(null, props, key, { ...options,
      createdAt
    });
    componentLogger.warning`Setting component ${key}`;
    Component.instances.set(key, bound);
    bound.server = true;
    return bound;
  };
};

Component.instances = new Map();
Component.rendered = new Map();
Component.scope = new Map();

Component.isServer = socket => {
  return socket.id === SERVER_ID;
};

Component.defaultCacheBehaviour = CACHE_FIRST;
module.exports = {
  Component
};