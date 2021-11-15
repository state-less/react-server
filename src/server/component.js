const { v4: uuidv4, v4 } = require("uuid");
const { EVENT_STATE_SET, NETWORK_FIRST, SERVER_ID, CACHE_FIRST } = require("../consts");
const _logger = require("../lib/logger");
const { assertIsValid } = require("../util");

let componentLogger = _logger.scope('state-server.component');
let lifecycle = _logger.scope('state-server.lifecycle');

// const CACHE_FIRST = 'CACHE_FIRST';
// const NETWORK_FIRST = 'NETWORK_FIRST';
// const SERVER_ID = 'base';

const isEqual = (arrA, arrB) => {
    if (!Array.isArray(arrA) && Array.isArray(arrB)) return false;
    if (!Array.isArray(arrB) && Array.isArray(arrA)) return false;
    return arrA.reduce((acc, cur, i) => {
        return acc && cur == arrB[i];
    }, true);
}


const Component = (fn, baseStore) => {
    let logger;

    if (!baseStore) {
        componentLogger.warning`Missing store. Using default component store. (You might want to pass a store instance)`;
        throw new Error('Missing store')
        // Store = componentStore;
    }

    let effectIndex = 0;
    let clientEffectIndex = 0;
    let stateIndex = 0;
    let fnIndex = 0;

    const { useState: useComponentState } = baseStore;
    let lastState;

    /**Reference to the store used by useState. */
    let lastStoreRef;

    const component = (() => {
        /** Component scope. This scope is valid once per rendered component and doesn't change during rerenders */
        let lastStates = [];

        return async (props = null, key, options, clientProps, socket = { id: SERVER_ID }) => {
            let scopedUseEffect;
            let scopedDestroy;
            let scopedUseClientEffect;
            let scopedUseState;
            let scopedUseClientState;
            let scopedUseFunction;
            let scopedTimeout;
            let states = [];
            let effects = []
            let clientEffects = [];
            let promises = [];
            // let functions = [[]];
            let dependencies = [];
            logger = componentLogger.scope(`${key}:${socket.id}`);

            /** TODO: Think of a way to provide a component state scope */
            // const componentState = await useComponentState(key, {}, {scope: socket.id});
            const componentState = await useComponentState(key, {});

            const { value: lastResult, setValue: setResult } = componentState;

            const cannotSetClientStateError = () => {
                throw new Error('Cannot set access client state from server')
            }
            //Logger that sends anything to the client rendering the current component.
            lifecycle = logger;

            let { ttl = Infinity, createdAt, store = baseStore.scope(key) } = options;

            const id = Math.random();
            const stateValues = new Map();
            scopedUseState = async (initial, stateKey, { deny, scope, ...rest } = {}) => {
                if (deny) {
                    return [null, () => { throw new Error('Attempt to set unauthenticated state') }];
                }

                let scopedStore;
                if (/^@/.test(stateKey)) {
                    //Allow crossreferences between component scopes
                    stateKey = stateKey.replace('@','')
                    scopedStore = baseStore.scope(stateKey.split('.').slice(0,-1).join('.'));
                    if (scope) {
                      scopedStore = scopedStore.scope(scope);
                    }
                    stateKey = stateKey.split('.').slice(0,-1)[0];
                } else if (scope) {
                    scopedStore = store.scope(scope)
                } else {
                    scopedStore = store;
                }

                lastStoreRef = scopedStore;

                const { useState } = lastStoreRef;

                let scopedKey = states[stateIndex]?.key || stateKey || uuidv4();

                const state = states[stateIndex] || await useState(scopedKey, initial, { temp: !stateKey, cache: Component.defaultCacheBehaviour, ...rest });

                let { value, setValue } = state;
                if (!(value instanceof Object))
                    value = Object(value);

                stateValues.set(value, state);
                let mounted = true;

                const boundSetValue = async function (value, dirty = false) {
                    if (mounted === false && !dirty) {
                        throw new Error(`setState called on unmounted component. Be sure to remove all listeners and asynchronous function in the cleanup function of the effect.`)
                    }
                    await setValue(value);
                    // const was = Component.useEffect;
                    Component.useEffect = scopedUseEffect;
                    Component.useClientEffect = scopedUseClientEffect;
                    Component.useState = scopedUseState;
                    Component.useClientState = scopedUseClientState;
                    Component.useFunction = scopedUseFunction;

                    try {
                        // setImmediate(() => {
                        await render();
                        // })
                    } catch (e) {
                        socket.emit('error', key, 'component:render', e.message);
                    }
                    // Component.useEffect = was;
                    mounted = false;
                }

                states[stateIndex] = state;

                stateIndex++;

                return [value, boundSetValue, state];
            }

            scopedUseClientState = (...args) => {
                if (Component.isServer(socket)) {
                    if (states[stateIndex]) {
                        states[stateIndex] = states[stateIndex];
                        stateIndex++;
                        return states[stateIndex];
                    }
                    stateIndex++;

                    return [null, cannotSetClientStateError]
                }
                return scopedUseState(...args);
            }

            scopedUseEffect = (fn, deps = [], notifyClient) => {
                if (!Component.isServer(socket)) return;

                const [lastDeps = [], cleanup] = effects[effectIndex] || [];
                if (!isEqual(lastDeps, deps) || !lastDeps.length) {
                    if (cleanup && 'function' === typeof cleanup) {
                        cleanup();
                    }
                    let nextCleanup = fn() || (() => { });
                    effects[effectIndex] = [deps, nextCleanup]
                } else {
                }


                effectIndex++;
            }

            scopedUseClientEffect = (fn, deps) => {
                if (Component.isServer(socket)) return;

                const [lastDeps, cleanup] = clientEffects[clientEffectIndex - 1] || [];
                if (!deps || !isEqual(lastDeps, deps)) {
                    if (cleanup && 'function' === typeof cleanup)
                        cleanup();

                    const nextCleanup = fn() || (() => { });
                    clientEffects[clientEffectIndex] = [deps, nextCleanup];
                } else {
                }

                clientEffectIndex++;
            }

            scopedUseFunction = (fn) => {
                const id = functions[fnIndex][0] || v4();
                functions[fnIndex] = [id, fn];
                fnIndex++
            };

            scopedTimeout = (fn, timeout, ...args) => {
                let to = Math.random();
                promises.push(
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            resolve(fn(...args));
                        }, timeout, ...args);
                    })
                )
                return to;
            }

            scopedDestroy = async () => {
                const {deleteState} = lastStoreRef;
                const promises = lastStates.map((state) => {
                    const {key} = state;
                    return deleteState(key);
                })
                await Promise.all(promises);
                await baseStore.deleteState(key);
                return true;
            }

            /** Runs effect cleanups and flags states for deletion */
            let cleanup = () => {
                //No previous render. Cleanup not necessary
                if (!lastStoreRef) return;

                const { deleteState } = lastStoreRef;
                states.forEach((state) => {
                    const { temp, persist } = state.options;
                    if (temp || !persist) {
                        deleteState(state.key);
                    }
                })

                clientEffects.forEach((cleanup) => {
                    if (cleanup && 'function' === typeof cleanup)
                        cleanup();
                })
                effects.forEach((cleanup) => {
                    if (cleanup && 'function' === typeof cleanup)
                        cleanup();
                })
            }

            let render = async () => {
                stateIndex = 0;
                effectIndex = 0;
                fnIndex = 0;

                if (+new Date - createdAt > ttl) {
                    throw new Error('Component expired.');
                }

                // await cleanup()
                const result = await fn(props, clientProps, socket);
                lastStates = states;

                if (!result && result !== null) {
                    logger.log`Rendered function ${fn.toString()}`;
                    throw new Error('Nothing returned from render. This usually means you have forgotten to return anything from your component.')
                }

                if (result && result.component === 'ClientComponent') {
                    for (const stateReferenceKey in result.props) {
                        const stateValue = result.props[stateReferenceKey];
                        if (stateValues.has(stateValue)) {
                            const { createdAt, scope, value, defaultValue, key, id } = stateValues.get(stateValue);
                            if (id)
                                result.props[stateReferenceKey] = { createdAt, scope, value, defaultValue, key, id };
                        }
                    }

                    if (result.props?.children && !Array.isArray(result.props?.children)) {
                        result.props.children = [result.props.children];
                    }

                    const actions = result.props?.children?.filter((action) => {
                        return action.component === 'Action';
                    }).forEach((action) => {
                        action.props.boundHandler = action.props.handler
                        action.props.handler = Object.keys(action.props.handler);
                    })
                } else if (result) {
                    for (const lookupReference in result.states) {
                        const stateValue = result.states[lookupReference];

                        if (stateValues.has(stateValue)) {
                            const { key: stateKey, scope } = stateValues.get(stateValue);

                            if (lookupReference)
                                result.states[lookupReference] = [stateKey, scope];
                        }
                    }
                }

                const scope = Component.scope.get(socket.id) || new Map;
                Component.scope.set(socket.id, scope)
                scope.set(key, componentState)

                //Implement publish mechanism based on configuration/environment.
                //Render server publishes on render. That updates the cache of the fallback renderer running serverless. (that's what happens right now)
                if (!lastResult || !lastResult.props || Object.keys(lastResult.props).length !== Object.keys(result.props).length) {
                    const res = await setResult(result);
                }

                await Promise.all(promises);

                return result;
            }

            Component.setTimeout = scopedTimeout;
            Component.useEffect = scopedUseEffect;
            Component.useClientEffect = scopedUseClientEffect;
            Component.useState = scopedUseState;
            Component.destroy = scopedDestroy;
            Component.useClientState = scopedUseClientState;
            Component.useFunction = scopedUseFunction;

            const rendered = await render();

            if (rendered) {
                rendered.key = key;
            } else {
                logger.warning`Nothing rendered at: ${(new Error).stack}`
            }
            return rendered;
        }
    })()

    return (props, key, options = {}) => {
        const createdAt = +new Date;
        let bound = component.bind(null, props, key, { ...options, createdAt });
        componentLogger.warning`Setting component ${key}`;
        Component.instances.set(key, bound);
        bound.server = true;
        return bound;
    }

}

Component.instances = new Map();
Component.rendered = new Map();
Component.scope = new Map();
Component.isServer = (socket) => {
    return socket.id === SERVER_ID
}
Component.defaultCacheBehaviour = CACHE_FIRST;

module.exports = { Component };