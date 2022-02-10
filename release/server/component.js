"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Component = exports.useContext = exports.useState = void 0;

var _interfaces = require("../interfaces");

var _util = require("../util");

var _state = require("./state");

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

function findParent(parent, id) {
  var _parent$component;

  if (parent !== null && parent !== void 0 && parent.component && (parent === null || parent === void 0 ? void 0 : (_parent$component = parent.component) === null || _parent$component === void 0 ? void 0 : _parent$component.id) === id) return parent.component;
  if (parent !== null && parent !== void 0 && parent.parent) return findParent(parent.parent, id);
  return null;
}

const Component = (fn, baseStore = new _state.Store({
  autoCreate: true
})) => {
  let logger;

  if (!baseStore) {
    componentLogger.warning`Missing store. Using default component store. (You might want to pass a store instance)`;
    throw new Error('Missing store'); // Store = componentStore;
  }

  let effectIndex = 0;
  let clientEffectIndex = 0;
  let stateIndex = 0;
  let fnIndex = 0;
  let lastState;
  /**Reference to the store used by useState. */

  let lastStoreRef;

  const component = (() => {
    /** Component scope. This scope is valid once per rendered component and doesn't change during rerenders */
    let lastStates = [];
    const stateValues = new Map();
    let savedParent;
    return async (props = null, key, options, clientProps, socket = {
      id: SERVER_ID
    }, parent) => {
      var _jwt, _jwt$address;

      let scopedUseEffect;
      let scopedUseContext;
      let scopedDestroy;
      let scopedUseClientEffect;
      let scopedUseState;
      let scopedUseClientState;
      let scopedUseFunction;
      let scopedTimeout;
      let states = [];
      let effects = [];
      let clientEffects = [];
      let promises = [];
      let functions = [[]];
      let dependencies = [];
      logger = componentLogger.scope(`${key}:${socket.id}`);
      if (parent) savedParent = parent;
      let jwt;

      try {
        jwt = (0, _util.authenticate)({
          data: socket
        });
      } catch (e) {}

      const {
        useState: useComponentState
      } = baseStore.scope(((_jwt = jwt) === null || _jwt === void 0 ? void 0 : (_jwt$address = _jwt.address) === null || _jwt$address === void 0 ? void 0 : _jwt$address.id) || socket.id);
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

      scopedUseContext = ctx => {
        var _par$props, _par$props2;

        const par = findParent(parent || savedParent, ctx.id);
        if (par !== null && par !== void 0 && (_par$props = par.props) !== null && _par$props !== void 0 && _par$props.value) return par === null || par === void 0 ? void 0 : (_par$props2 = par.props) === null || _par$props2 === void 0 ? void 0 : _par$props2.value;
        return null;
      };

      scopedUseState = async (initial, stateKey, {
        deny = false,
        scope = void 0,
        ...rest
      } = {}) => {
        var _states$stateIndex;

        if (deny) {
          return [null, () => {
            throw new Error('Attempt to set unauthenticated state');
          }];
        }

        let scopedStore;

        if (/^@/.test(stateKey)) {
          //Allow crossreferences between component scopes
          stateKey = stateKey.replace('@', '');
          scopedStore = baseStore.scope(stateKey.split('.').slice(0, -1).join('.'));

          if (scope) {
            scopedStore = scopedStore.scope(scope);
          }

          stateKey = stateKey.split('.').slice(0, -1)[0];
        } else if (scope) {
          scopedStore = store.scope(scope);
        } else {
          scopedStore = store;
        }

        lastStoreRef = scopedStore;
        const {
          useState
        } = lastStoreRef;
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
        /** So I'm not sure how I can store unique references to null values. For now it's a restriction */

        if (!(value instanceof Object) && value !== null && typeof value !== 'undefined') value = Object(value);
        stateValues.set(value, state);
        let mounted = true;

        const boundSetValue = async function (value, dirty = false) {
          if (mounted === false && !dirty) {
            throw new Error(`setState called on unmounted component. Be sure to remove all listeners and asynchronous function in the cleanup function of the effect.`);
          }

          await setValue(value); // const was = Component.useEffect;

          Component.useEffect = scopedUseEffect;
          Component.useClientEffect = scopedUseClientEffect;
          Component.useState = scopedUseState;
          Component.useClientState = scopedUseClientState;
          Component.useFunction = scopedUseFunction;
          Component.useContext = scopedUseContext;

          try {
            // setImmediate(() => {
            await render(); // })
          } catch (e) {
            //Investigate what the socket object is
            // This doesnt' make too much sense
            // socket.emit('error', key, 'component:render', e.message);
            throw e;
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
      }; // scopedUseFunction = (fn) => {
      //     const id = functions[fnIndex][0] || v4();
      //     functions[fnIndex] = [id, fn];
      //     fnIndex++
      // };


      scopedTimeout = (fn, timeout, ...args) => {
        let to = Math.random();
        promises.push(new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(fn(...args));
          }, timeout, ...args);
        }));
        return to;
      };

      scopedDestroy = async () => {
        const {
          deleteState
        } = lastStoreRef;
        const promises = lastStates.map(state => {
          const {
            key
          } = state;
          return deleteState(key);
        });
        await Promise.all(promises);
        await baseStore.deleteState(key);
        return true;
      };
      /** Runs effect cleanups and flags states for deletion */


      let cleanup = () => {
        //No previous render. Cleanup not necessary
        if (!lastStoreRef) return;
        const {
          deleteState
        } = lastStoreRef;
        states.forEach(state => {
          const {
            temp,
            persist
          } = state.options;

          if (temp || !persist) {
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
      /** This is where all the magic happens. */


      let render = async () => {
        stateIndex = 0;
        effectIndex = 0;
        fnIndex = 0;

        if (+new Date() - createdAt > ttl) {
          throw new Error('Component expired.');
        }

        componentLogger.warning`Rendering component ${key}`; // await cleanup()

        const result = await fn({ ...props,
          key
        }, clientProps, socket);
        lastStates = states;

        if (!result && result !== null) {
          logger.debug`Rendered function ${fn.toString()}`;
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
        scope.set(key, componentState);

        const renderChildren = async comp => {
          var _comp$props;

          if (!comp) return;
          let children = await (comp === null || comp === void 0 ? void 0 : (_comp$props = comp.props) === null || _comp$props === void 0 ? void 0 : _comp$props.children);

          if (children && !Array.isArray(children)) {
            if (children.render) comp.props.children = await children.render(null, socket, {
              component: result,
              parent
            });
            return; //renderChildren(children);
          }

          for (let i = 0; i < (children === null || children === void 0 ? void 0 : children.length); i++) {
            const child = children[i];

            if (Array.isArray(child)) {
              await Promise.all(child.map(renderChildren));
            } else if (typeof child.render === 'function') {
              comp.props.children[i] = await child.render(null, socket, {
                component: result,
                parent
              });
            } else {
              logger.warning`No render function for child ${JSON.stringify(child)} in comp ${key}`;
            }
          }
        };

        if (!lastResult || !lastResult.props || Object.keys(lastResult.props).length !== Object.keys(result.props).length || JSON.stringify(lastResult.props) !== JSON.stringify(result.props)) {
          /** This should ONLY be called for components that affect their child tree like Proivder */
          // await renderChildren(result);
          const res = await setResult(result);
        }

        await Promise.all(promises);
        return result;
      };

      Component.setTimeout = scopedTimeout;
      Component.useEffect = scopedUseEffect;
      Component.useClientEffect = scopedUseClientEffect;
      Component.useState = scopedUseState;
      Component.destroy = scopedDestroy;
      Component.useClientState = scopedUseClientState;
      Component.useFunction = scopedUseFunction;
      Component.useContext = scopedUseContext;
      const rendered = await render();

      if (rendered) {
        rendered.key = key;
      } else if (rendered !== null) {
        logger.warning`Nothing rendered at: ${new Error().stack}`;
      }

      return rendered;
    };
  })();

  return async (props, key, options = {}) => {
    const createdAt = +new Date();
    let bound = component.bind(null, props, key, { ...options,
      createdAt
    });
    componentLogger.warning`Setting component ${key}`;
    Component.instances.set(key, bound); // bound.server = true;

    return { ...(await bound()),
      render: bound
    };
  };
};

exports.Component = Component;
Component.useState = null;
Component.useEffect = null;
Component.useClientEffect = null;
Component.useFunction = null;
Component.useContext = null;
Component.useClientState = null;
Component.setTimeout = null;
Component.destroy = null;
/**
 * @typedef ReactServerComponent
 * @type {Object}
 * @property {string} key - The components key
 */

/**
 * Maintains a map of component instances.
 * @type {Map<string,ReactServerComponent>}
 */

Component.instances = new Map();
Component.rendered = new Map();
Component.scope = new Map();

Component.isServer = socket => {
  return socket.id === SERVER_ID;
};

Component.defaultCacheBehaviour = _interfaces.CacheBehaviour.CACHE_FIRST;

const useState = (...args) => Component.useState.apply(null, args);

exports.useState = useState;

const useContext = (...args) => Component.useContext.apply(null, args);

exports.useContext = useContext;