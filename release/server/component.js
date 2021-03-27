"use strict";

const {
  v4: uuidv4,
  v4
} = require("uuid");

const {
  EVENT_STATE_SET
} = require("../consts");

const _logger = require("../lib/logger");

let componentLogger = _logger.scope('state-server.component');

let lifecycle = _logger.scope('state-server.lifecycle');

const CACHE_FIRST = 'CACHE_FIRST';
const NETWORK_FIRST = 'NETWORK_FIRST';
const SERVER_ID = 'base';

const isEqual = (arrA, arrB) => {
  return arrA.reduce((acc, cur, i) => {
    return acc && cur == arrB[i];
  }, true);
};

const Component = (fn, baseStore) => {
  let logger;
  componentLogger.info`Creating component`;

  if (!baseStore) {
    componentLogger.warning`Missing store. Using default component store. (You might want to pass a store instance)`;
    throw new Error('Missing store'); // baseStore = componentStore;
  }

  let effectIndex = 0;
  let clientEffectIndex = 0;
  let stateIndex = 0;
  let fnIndex = 0;
  const {
    useState: useComponentState
  } = baseStore;
  let lastState;

  const component = async (props = null, key, options, socket = {
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
    const componentState = await useComponentState(key, {}, {
      scope: socket.id
    });
    componentLogger.info`Component state is ${componentState}`;
    const {
      value: lastResult,
      setValue: setResult
    } = componentState;

    const cannotSetClientStateError = () => {
      throw new Error('Cannot set access client state from server');
    }; //Logger that sends anything to the client rendering the current component.


    lifecycle = logger;
    const {
      ttl = Infinity,
      createdAt,
      store = baseStore.scope(key)
    } = options;
    const {
      useState,
      deleteState
    } = store;
    logger.info`Props ${props}`;
    const id = Math.random();
    const stateValues = new Map();

    scopedUseState = async (initial, stateKey, {
      deny,
      ...rest
    } = {}) => {
      var _states$stateIndex, _states$stateIndex2;

      if (deny) {
        return [null, () => {
          throw new Error('Attempt to set unauthenticated state');
        }];
      }

      logger.error`ID ${id}`;
      let scopedKey = ((_states$stateIndex = states[stateIndex]) === null || _states$stateIndex === void 0 ? void 0 : _states$stateIndex.key) || stateKey || uuidv4();
      logger.info`Component used state ${scopedKey} ${rest} ${(_states$stateIndex2 = states[stateIndex]) === null || _states$stateIndex2 === void 0 ? void 0 : _states$stateIndex2.key} ${initial}`;
      const state = states[stateIndex] || (await useState(scopedKey, initial, {
        temp: !stateKey,
        cache: Component.defaultCacheBehaviour,
        ...rest
      }));
      console.log("Got state", new Error().stack);
      let {
        value,
        setValue
      } = state;
      if (!(value instanceof Object)) value = Object(value);
      logger.info`Passed state to store ${JSON.stringify(value)}`;
      stateValues.set(value, state);
      let mounted = true; // state.on(`${EVENT_STATE_SET}:${state.id}`, () => {
      //     logger.warning`State changed. Rerendering.`
      //     process.exit(0);
      // })

      const boundSetValue = async function (value) {
        logger.error`ID ${id}`;
        logger.error`Setting value. ${scopedKey || "no"} Rerendering  ${mounted}`;

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
          logger.error`Error rendering function ${e}`;
          socket.emit('error', key, 'component:render', e.message);
        } // Component.useEffect = was;


        mounted = false;
      };

      states[stateIndex] = state;
      stateIndex++;
      return [value, boundSetValue, state];
    };

    scopedUseClientState = (...args) => {
      logger.error`USE CLIENT STATE ${socket}`; // process.exit(0);

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
      logger.error`Effect called.! ${Component.isServer(socket)}`;
      logger.info`No socket connection returning`;
      if (!Component.isServer(socket)) return;
      const [lastDeps = [], cleanup] = effects[effectIndex] || [];

      if (!isEqual(lastDeps, deps) || !lastDeps.length) {
        if (cleanup && 'function' === typeof cleanup) {
          lifecycle.warning`Cleaning up effects`;
          cleanup();
        }

        lifecycle.debug`Running serverside effect ${effectIndex}.`;

        let nextCleanup = fn() || (() => {});

        effects[effectIndex] = [deps, nextCleanup];
      } else {
        logger.error`Dpendencies match. NOT running effects`;
      }

      effectIndex++;
    };

    scopedUseClientEffect = (fn, deps = []) => {
      if (Component.isServer(socket)) return;
      const [lastDeps = [], cleanup] = clientEffects[clientEffectIndex] || [];

      if (!isEqual(lastDeps, deps) || !lastDeps.length) {
        lifecycle.warning`Cleaning up client effects`;
        if (cleanup && 'function' === typeof cleanup) cleanup();
        logger.error`Running effects ${props.temp}`;

        const nextCleanup = fn() || (() => {});

        clientEffects[clientEffectIndex] = [deps, nextCleanup];
      } else {
        logger.error`Dpendencies match. NOT running effects`;
      }

      clientEffectIndex++;
    };

    scopedUseFunction = fn => {
      const id = functions[fnIndex][0] || v4();
      functions[fnIndex] = [id, fn];
      fnIndex++;
    };

    scopedTimeout = (fn, timeout, ...args) => {
      let to = Math.random();
      logger.error`Adding timeout ${timeout}`;
      promises.push(new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(fn(...args));
        }, timeout, ...args);
      }));
      return to;
    };

    let cleanup = () => {
      lifecycle.error`Destroying component`;
      states.forEach(state => {
        logger.warning`Destroying temporary state ${state.args}`;
        const {
          temp
        } = state.options;

        if (temp) {
          deleteState(state.key);
          logger.warning`Destroying temporary state ${state.key}`;
        }
      });
      clientEffects.forEach(cleanup => {
        lifecycle.warning`Cleaning up client effects`;
        if (cleanup && 'function' === typeof cleanup) cleanup();
      });
      effects.forEach(cleanup => {
        lifecycle.warning`Cleaning up effects on destroy`;
        if (cleanup && 'function' === typeof cleanup) cleanup();
      });
    };

    let render = async () => {
      stateIndex = 0;
      effectIndex = 0;
      fnIndex = 0;
      logger.error`Rendering. ${+new Date() - createdAt} > ${ttl}`;

      if (+new Date() - createdAt > ttl) {
        throw new Error('Component expired.');
      }

      const result = await fn(props, socket);

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
            logger.debug`State reference found in stateValues. Using id.`;
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

        logger.warning`Parsing actions ${result.props}`;

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
            console.log("result", baseStore);
            logger.debug`State reference found in stateValues. Using id.`;
            if (lookupReference) result.states[lookupReference] = [stateKey, scope];
          }
        }
      }

      logger.info`Result ${result}`;
      const scope = Component.scope.get(socket.id) || new Map();
      Component.scope.set(socket.id, scope);
      scope.set(key, componentState);
      logger.error`Setting state result ${result}`; //Implement publish mechanism based on configuration/environment.
      //Render server publishes on render. That updates the cache of the fallback renderer running serverless. (that's what happens right now)

      if (!lastResult || !lastResult.props || Object.keys(lastResult.props).length !== Object.keys(result.props).length) {
        const res = await setResult(result);
        logger.error`Updated state result ${res}`;
      }

      await Promise.all(promises); // if (Component.isServer(socket))
      //     return result;

      logger.warning`DBGACTION: Render: ${JSON.stringify(result)}`;
      process.env.ssrProps = JSON.stringify(result);
      return result; // return [componentState, cleanup]
    };

    Component.setTimeout = scopedTimeout;
    Component.useEffect = scopedUseEffect;
    Component.useClientEffect = scopedUseClientEffect;
    Component.useState = scopedUseState;
    Component.useClientState = scopedUseClientState;
    Component.useFunction = scopedUseFunction;
    return render();
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