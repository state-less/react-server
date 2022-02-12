import { parentMap } from '../runtime'
import { Lifecycle as LifecycleType, CacheBehaviour } from "../interfaces";
import { authenticate } from '../util';
import { Store } from "./state";
import { storeContext } from "../context";

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


function findParent(key, id) {
    const par = parentMap[key];

    if (!par)
        return null;

    if (par.id === id)
        return par;

    if (par?.key)
        return findParent(par.key, id);
    return null;
}

const Lifecycle: LifecycleType = (fn, baseStore = new Store({
    autoCreate: true
})) => {
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

    let lastState;

    /**Reference to the store used by useState. */
    let lastStoreRef;

    const component = (() => {
        /** Component scope. This scope is valid once per rendered component and doesn't change during rerenders */
        let lastStates = [];
        const stateValues = new Map();
        let savedParent;
        return async (props = null, key, options, clientProps, socket = { id: SERVER_ID }, parent) => {
            let scopedUseEffect;
            let scopedUseContext;
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
            let functions = [[]];
            let dependencies = [];
            logger = componentLogger.scope(`${key}:${socket.id}`);

            if (parent)
                savedParent = parent;

            let jwt;
            try {
                jwt = authenticate({ data: socket });
            } catch (e) {

            }

            const storeProvider = findParent(key, storeContext.id);

            if (storeProvider) {
                baseStore = storeProvider.props.value;
            } else {
                logger.warning`Missing store provider in component ${key}. Using fallback.`
            }

            const { useState: useComponentState } = baseStore.scope(jwt?.address?.id || socket.id);
            const componentState = await useComponentState(key, {});

            const { value: lastResult, setValue: setResult } = componentState;

            const cannotSetClientStateError = () => {
                throw new Error('Cannot set access client state from server')
            }
            //Logger that sends anything to the client rendering the current component.
            lifecycle = logger;

            let { ttl = Infinity, createdAt, store = baseStore.scope(key) } = options;

            const id = Math.random();

            scopedUseContext = (ctx) => {
                const par = findParent(parent || savedParent, ctx.id);

                ctx.onRender(key, () => {
                    logger.warning`Rerendering Component because Provider updated`
                    setImmediate(render)
                })

                if (par?.props?.value)
                    return par?.props?.value;

                return null;
            }
            scopedUseState = async (initial, stateKey, { deny = false, scope = void 0, ...rest } = {}) => {
                if (deny) {
                    return [null, () => { throw new Error('Attempt to set unauthenticated state') }];
                }

                let scopedStore;
                if (/^@/.test(stateKey)) {
                    //Allow crossreferences between component scopes
                    stateKey = stateKey.replace('@', '')
                    scopedStore = baseStore.scope(stateKey.split('.').slice(0, -1).join('.'));
                    if (scope) {
                        scopedStore = scopedStore.scope(scope);
                    }
                    stateKey = stateKey.split('.').slice(0, -1)[0];
                } else if (scope) {
                    scopedStore = store.scope(scope)
                } else {
                    scopedStore = store;
                }

                lastStoreRef = scopedStore;

                const { useState } = lastStoreRef;

                let scopedKey = states[stateIndex]?.key || stateKey || uuidv4();

                const state = states[stateIndex] || await useState(scopedKey, initial, { temp: !stateKey, cache: Lifecycle.defaultCacheBehaviour, ...rest });

                let { value, setValue } = state;

                /** So I'm not sure how I can store unique references to null values. For now it's a restriction */
                if (!(value instanceof Object) && value !== null && typeof value !== 'undefined')
                    value = Object(value);

                stateValues.set(value, state);
                let mounted = true;

                const boundSetValue = async function (value, dirty = false) {
                    if (mounted === false && !dirty) {
                        throw new Error(`setState called on unmounted component. Be sure to remove all listeners and asynchronous function in the cleanup function of the effect.`)
                    }
                    await setValue(value);
                    // const was = Component.useEffect;
                    Lifecycle.useEffect = scopedUseEffect;
                    Lifecycle.useClientEffect = scopedUseClientEffect;
                    Lifecycle.useState = scopedUseState;
                    Lifecycle.useClientState = scopedUseClientState;
                    Lifecycle.useFunction = scopedUseFunction;
                    Lifecycle.useContext = scopedUseContext;

                    try {
                        // setImmediate(() => {
                        await render();
                        // })
                    } catch (e) {
                        //Investigate what the socket object is
                        // This doesnt' make too much sense
                        // socket.emit('error', key, 'component:render', e.message);
                        throw e;
                    }
                    // Component.useEffect = was;
                    mounted = false;
                }

                states[stateIndex] = state;

                stateIndex++;

                return [value, boundSetValue, state];
            }

            scopedUseClientState = (...args) => {
                if (Lifecycle.isServer(socket)) {
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
                if (!Lifecycle.isServer(socket)) return;

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
                if (Lifecycle.isServer(socket)) return;

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

            // scopedUseFunction = (fn) => {
            //     const id = functions[fnIndex][0] || v4();
            //     functions[fnIndex] = [id, fn];
            //     fnIndex++
            // };

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
                const { deleteState } = lastStoreRef;
                const promises = lastStates.map((state) => {
                    const { key } = state;
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

            /** This is where all the magic happens. */
            let render = async () => {
                stateIndex = 0;
                effectIndex = 0;
                fnIndex = 0;

                if (+new Date - createdAt > ttl) {
                    throw new Error('Component expired.');
                }

                componentLogger.warning`Rendering component ${key}`;
                // await cleanup()
                if (props?.children)
                    props.children = await (Array.isArray(props.children)?Promise.all(props.children):props.children);

                fn.useState = scopedUseState;
                fn.useEffect = scopedUseEffect;
                fn.useContext = scopedUseContext;

                const result = await fn({ ...props, key }, clientProps, socket);
                lastStates = states;

                if (!result && result !== null) {
                    logger.debug`Rendered function ${fn.toString()}`;
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

                    // const actions = result.props?.children?.filter((action) => {
                    //     return action.component === 'Action';
                    // }).forEach((action) => {
                    //     action.props.boundHandler = action.props.handler
                    //     action.props.boundHandler = action.props.handler
                    //     action.props.handler = Object.keys(action.props.handler);
                    // })
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

                const scope = Lifecycle.scope.get(socket.id) || new Map;
                Lifecycle.scope.set(socket.id, scope)
                scope.set(key, componentState)

                const renderChildren = async (comp) => {
                    if (!comp)
                        return
                    let children = await comp?.props?.children;
                    if (children && !Array.isArray(children)) {
                        if (children.render)
                            comp.props.children = await children.render(null, socket, { component: result, parent });
                        return //renderChildren(children);
                    }
                    for (let i = 0; i < children?.length; i++) {
                        const child = children[i]
                        if (Array.isArray(child)) {
                            await Promise.all(child.map(renderChildren))
                        } else if (typeof child.render === 'function') {
                            comp.props.children[i] = await child.render(null, socket, { component: result, parent })
                        } else {
                            logger.warning`No render function for child ${JSON.stringify(child)} in comp ${key}`;
                        }
                    }
                }
                if (!lastResult || !lastResult.props || Object.keys(lastResult.props).length !== Object.keys(result.props).length || JSON.stringify(lastResult.props) !== JSON.stringify(result.props)) {
                    /** This should ONLY be called for components that affect their child tree like Proivder */
                    // await renderChildren(result);
                    const res = await setResult(result);
                }

                await Promise.all(promises);

                return result;
            }

            Lifecycle.setTimeout = scopedTimeout;
            Lifecycle.useEffect = scopedUseEffect;
            Lifecycle.useClientEffect = scopedUseClientEffect;
            Lifecycle.useState = scopedUseState;
            Lifecycle.destroy = scopedDestroy;
            Lifecycle.useClientState = scopedUseClientState;
            Lifecycle.useFunction = scopedUseFunction;
            Lifecycle.useContext = scopedUseContext;

            const rendered = await render();

            if (rendered) {
                rendered.key = key;
            } else if (rendered !== null) {
                logger.warning`Nothing rendered at: ${(new Error).stack}`
            }
            return rendered;
        }
    })()

    return async (props, key, options = {}) => {
        const createdAt = +new Date;
        let bound = component.bind(null, props, key, { ...options, createdAt });
        componentLogger.warning`Setting component ${key}`;
        Lifecycle.instances.set(key, bound);
        // bound.server = true;
        return {
            ...await bound(),
            render: bound,
        }
    }

}

Lifecycle.useState = null;
Lifecycle.useEffect = null;
Lifecycle.useClientEffect = null;
Lifecycle.useFunction = null;
Lifecycle.useContext = null;
Lifecycle.useClientState = null;
Lifecycle.setTimeout = null;
Lifecycle.destroy = null;
/**
 * @typedef ReactServerComponent
 * @type {Object}
 * @property {string} key - The components key
 */

/**
 * Maintains a map of component instances.
 * @type {Map<string,ReactServerComponent>}
 */
Lifecycle.instances = new Map();
Lifecycle.rendered = new Map();
Lifecycle.scope = new Map();
Lifecycle.isServer = (socket) => {
    return socket.id === SERVER_ID
}
Lifecycle.defaultCacheBehaviour = CacheBehaviour.CACHE_FIRST;

export const useState = function useState (...args) {
    const scopedUseState : any = useState.caller;
    return scopedUseState.useState.apply(args);
}
export const useContext = function useContext (...args) {
    const scopedUseContext : any = useContext.caller;
    return scopedUseContext.useContext.apply(args);
}

export { Lifecycle }
export { Lifecycle as Component };