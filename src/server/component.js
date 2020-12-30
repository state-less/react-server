const { v4: uuidv4 } = require("uuid");
const _logger = require("../lib/logger");

const logger = _logger.scope('state-server.component');

const { State, SocketIOBroker, Store } = require('./state');

const componentStore = new Store({autoCreate: true});


componentStore.onRequestState = () => true;

const Component = (fn, baseStore) => {
    logger.info`Creating component`;

    

    let effectIndex = 0;
    let stateIndex = 0;

    const component = (props, key, options, socket) => {
        let scopedUseEffect;
        let scopedUseState;
        let effects = []
        let states = [];

        const {ttl = Infinity, createdAt, store = baseStore.scope(key)} = options;
        const {useState, deleteState} = store;
        
        logger.info`Props ${props}`;
        const stateValues = new Map ();
        scopedUseState = (initial, stateKey) => {
            scopedKey = states[stateIndex]?.key || stateKey || uuidv4();
            logger.info`Component used state ${scopedKey} ${states[stateIndex]?.key} ${initial}`;
            const state = states[stateIndex] || useState(scopedKey, initial, {temp: !stateKey});
            const {value, setValue, key: k} = state;
            logger.info`Passed state to store ${JSON.stringify(value)} ${k}`;
            stateValues.set(value, state.key);
            let mounted = true;
            
            const boundSetValue = (value) => {
                logger.error`Setting value. ${props.temp} ${scopedKey||"no"} Rerendering  ${mounted}`
                if (mounted === false) {
                    throw new Error(`setState called on unmounted component. Be sure to remove all listeners and asynchronous function in the cleanup function of the effect.`)
                }
                setValue(value);
                // const was = Component.useEffect;
                Component.useEffect = scopedUseEffect;
                Component.useState = scopedUseState;
                try {
                    render();
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

        scopedUseEffect = (fn, deps) => {
            effects.forEach((cleanup) => {
                logger.info`Cleaning up effects`;
                if (cleanup && 'function' === typeof cleanup)
                cleanup();
            })
            

            logger.error`Running effects ${props.temp}`;
            const cleanup = fn();

            effects[effectIndex] = cleanup || (() => {});

            effectIndex++;

        }


        
        let cleanup = () => {
            logger.scope('bar').error`Destroying component`
            states.forEach((state) => {
                logger.warning`Destroying temporary state ${state.args}`

                const [options] = state.args;
                if (options.temp) {
                    deleteState(state.key);
                    logger.warning`Destroying temporary state ${state.key}`
                }
            })

            effects.forEach((cleanup) => {
                logger.info`Cleaning up effects`;
                if (cleanup && 'function' === typeof cleanup)
                cleanup();
            })
        }

        let render = () => {
            stateIndex = 0;
            effectIndex = 0;

            logger.error`Rendering. ${+new Date - createdAt} > ${ttl}`
            if (+new Date - createdAt > ttl) {
                throw new Error('Component expired.');
            }
            const instance = fn(props, socket);
            logger.scope('foo').error`set action ${JSON.stringify(instance)}`

            const result = {...instance};
            for (const key in instance.states) {
                const stateValue = instance.states[key];
                if (stateValues.has(stateValue)) {
                    const id = stateValues.get(stateValue);
                    logger.info`State reference found in stateValues. Using id.`;
                    result.states[key] = id;
                }
            }

            // const boundComponent = componentMap.get(key);
        //     for (const key in instance.actions) {
        //         boundComponent.actions = boundComponent.actions || new Map();
        //         boundComponent.actionIds = boundComponent.actionIds || new Map();
        //         const id = boundComponent.actionIds.get(key) || uuidv4();
        //         logger.error`Setting action for scoket ${socket}`
        //         boundComponent.actions.set(id, instance.actions[key]);
        //   logger.scope('foo').error`set action ${socket}`

        //         boundComponent.actionIds.set(key, id);
        //         result._actions = result._actions || new Map();
        //         result._actions.set(id, instance.actions[key]);
        //         result.actions[key] = key;
        //     }

            logger.info`Result ${result}`;
            mounted = true;
            Component.rendered.set(key, {...result, cleanup})

            return Component.rendered.get(key);
        }

        Component.useEffect = scopedUseEffect;
        Component.useState = scopedUseState;
        return render();
    }

    return (props, key, options = {}) => {
        const createdAt = +new Date;
        let bound = component.bind(null, props, key, {...options, createdAt});
        logger.warning`Setting component ${key}`;
        Component.instances.set(key, bound);
        return bound;
    }

    return result;
}
Component.instances = new Map();
Component.rendered = new Map();

module.exports = {Component};