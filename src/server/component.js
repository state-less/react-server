const { v4: uuidv4, v4 } = require("uuid");
const _logger = require("../lib/logger");

let __logger = _logger.scope('state-server.component');
let lifecycle = _logger.scope('state-server.lifecycle');

const { State, SocketIOBroker, Store } = require('./state');

const componentStore = new Store({autoCreate: true});


componentStore.onRequestState = () => true;


const isEqual = (arrA, arrB) => {
    return arrA.reduce((acc, cur, i) => {
        return acc && cur == arrB[i];
    }, true);
}
const Component = (fn, baseStore) => {
    let logger;
    __logger.info`Creating component`;

    

    let effectIndex = 0;
    let clientEffectIndex = 0;
    let stateIndex = 0;
    let fnIndex = 0;

    let lastState;
    const component = (props, key, options, socket = {id: 'server'}) => {
        let scopedUseEffect;
        let scopedUseClientEffect;
        let scopedUseState;
        let scopedUseClientState;
        let scopedUseFunction;

        let effects = []
        let clientEffects = [];
        let states = [];
        // let functions = [[]];
        let dependencies = [];

        const cannotSetClientStateError = () => {
            throw new Error('Cannot set access client state from server')
        }
        //Logger that sends anything to the client rendering the current component.
        logger = __logger.scope(`${key}:${socket.id}`);
        lifecycle = logger;

        const {ttl = Infinity, createdAt, store = baseStore.scope(key)} = options;
        const {useState, deleteState} = store;
        
        logger.info`Props ${props}`;
        const stateValues = new Map ();
        scopedUseState = (initial, stateKey, {deny, ...rest} = {}) => {
            if (deny) {
                return [null, () => {throw new Error('Attempt to set unauthenticated state')}];
            }

            let scopedKey = states[stateIndex]?.key || stateKey || uuidv4();
            logger.info`Component used state ${scopedKey} ${states[stateIndex]?.key} ${initial}`;
            const state = states[stateIndex] || useState(scopedKey, initial, {temp: !stateKey});

            let {value, setValue} = state;
            if (!(value instanceof Object))
                value = Object(value);

            logger.info`Passed state to store ${JSON.stringify(value)}`;
            stateValues.set(value, state.key);
            let mounted = true;
            
            const boundSetValue = function (value) {
                logger.error`Setting value. ${props.temp} ${scopedKey||"no"} Rerendering  ${mounted}`
                if (mounted === false) {
                    throw new Error(`setState called on unmounted component. Be sure to remove all listeners and asynchronous function in the cleanup function of the effect.`)
                }
                setValue(value);
                // const was = Component.useEffect;
                Component.useEffect = scopedUseEffect;
                Component.useClientEffect = scopedUseClientEffect;
                Component.useState = scopedUseState;
                Component.useClientState = scopedUseClientState;
                Component.useFunction = scopedUseFunction;

                try {
                    render();
                } catch (e) {
                    logger.error`Error rendering function ${e}`;
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
            logger.error`USE CLIENT STATE ${socket}`;
            // process.exit(0);
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
            logger.info`No socket connection returning`
            if (!Component.isServer(socket)) return;
            
            const [lastDeps = [], cleanup] = effects[effectIndex] || [];
            if (!isEqual(lastDeps, deps) || !lastDeps.length) {
                lifecycle.warning`Cleaning up effects`;
                if (cleanup && 'function' === typeof cleanup)
                    cleanup();
                logger.error`Running effects ${props.temp}`;
                let nextCleanup = fn() || (() => {});
                effects[effectIndex] = [deps, nextCleanup]
            } else {
                logger.error`Dpendencies match. NOT running effects`;
            }


            effectIndex++;
        }

        scopedUseClientEffect = (fn, deps = []) => {
            if (Component.isServer(socket)) return;

            const [lastDeps = [], cleanup] = clientEffects[clientEffectIndex] || [];
            if (!isEqual(lastDeps, deps) || !lastDeps.length) {
                lifecycle.warning`Cleaning up client effects`;
               
                if (cleanup && 'function' === typeof cleanup)
                    cleanup();
                logger.error`Running effects ${props.temp}`;
                const nextCleanup = fn() || (() => {});
                
                clientEffects[clientEffectIndex] = [deps, nextCleanup];
            } else {
                logger.error`Dpendencies match. NOT running effects`;
            }
                
            clientEffectIndex++;
        }
        
        scopedUseFunction = (fn) => {
            const id = functions[fnIndex][0] || v4();
            functions[fnIndex] = [id, fn];
            fnIndex++
        };

        let cleanup = () => {
            lifecycle.error`Destroying component`
            states.forEach((state) => {
                logger.warning`Destroying temporary state ${state.args}`

                const {temp} = state.options;
                if (temp) {
                    deleteState(state.key);
                    logger.warning`Destroying temporary state ${state.key}`
                }
            })

            clientEffects.forEach((cleanup) => {
                lifecycle.warning`Cleaning up client effects`;
                if (cleanup && 'function' === typeof cleanup)
                cleanup();
            })
            effects.forEach((cleanup) => {
                lifecycle.warning`Cleaning up effects on destroy`;
                if (cleanup && 'function' === typeof cleanup)
                cleanup();
            })
        }

        let render = () => {
            stateIndex = 0;
            effectIndex = 0;
            fnIndex = 0;

            logger.error`Rendering. ${+new Date - createdAt} > ${ttl}`
            if (+new Date - createdAt > ttl) {
                throw new Error('Component expired.');
            }
            const instance = fn(props, socket);

            const result = {...instance};
            for (const key in instance.states) {
                const stateValue = instance.states[key];
                if (stateValues.has(stateValue)) {
                    const id = stateValues.get(stateValue);
                    logger.debug`State reference found in stateValues. Using id.`;
                    if (id)
                        result.states[key] = id;
                }
            }

            result.cleanup = cleanup;
            // result.functions = Object.fromEntries(functions);

            logger.info`Result ${result}`;
            mounted = true;

            if (Component.isServer(socket))
                return result;
            
            Component.rendered.set(key, result)

            let lastState = result;
            return result
        }

        Component.useEffect = scopedUseEffect;
        Component.useClientEffect = scopedUseClientEffect;
        Component.useState = scopedUseState;
        Component.useClientState = scopedUseClientState;
        Component.useFunction = scopedUseFunction;
        return render();
    }

    return (props, key, options = {}) => {
        const createdAt = +new Date;
        let bound = component.bind(null, props, key, {...options, createdAt});
        __logger.warning`Setting component ${key}`;
        Component.instances.set(key, bound);
        return bound;
    }

    return result;
}
Component.instances = new Map();
Component.rendered = new Map();
Component.isServer = (socket) => {
    return socket.id === 'server'
}
module.exports = {Component};