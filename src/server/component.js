const { v4: uuidv4 } = require("uuid");
const _logger = require("../lib/logger");

const logger = _logger.scope('state-server.component');

const { State, SocketIOBroker, Store } = require('./state');

const componentStore = new Store({autoCreate: true});


componentStore.onRequestState = () => true;

const componentMap = new Map();

const Component = (fn, store) => {
    logger.info`Creating component`;

    const {useState} = store;

    const states = []
    Component.stateIndex = 0;
    
    const component = (props, key, socket) => {
        logger.info`Props ${props}`;

        const states = new Map ();
        Component.useState = (initial) => {
            const key = uuidv4();
            logger.info`Component used state ${initial}`;
            const state = states[Component.stateIndex] || useState(key, initial);
            const {value, setValue} = state;
            logger.info`Passed state to store ${JSON.stringify(value)}`;
            states.set(value, state.key);
            
            const _setValue = (value) => {
                logger.info`Setting value. Rerendering`
                setValue(value);
                Component.render();
            }

            states[Component.stateIndex] = state;

            Component.stateIndex++;

            return [value, _setValue];
        }

        Component.useEffect = (fn, deps) => {
            logger.info`Running effects`;
            const cleanup = fn();
        }

        Component.render = () => {
            Component.stateIndex = 0;
            const instance = fn(props, socket);
            
            const result = {...instance};
            for (const key in instance.states) {
                const value = instance.states[key];
                if (states.has(value)) {
                    const id = states.get(value);
                    logger.info`State included`;
                    result.states[key] = id;
                }
            }

            const boundComponent = componentMap.get(key);
            for (const key in instance.actions) {
                const id = uuidv4();
                boundComponent.actions = boundComponent.actions || new Map();
                boundComponent.actions.set(id, instance.actions[key]);
                result.actions[key] = id;
            }

            logger.info`Result ${result}`;
            return result;
        }

        return Component.render();
    }

    return (props, key) => {
        componentMap.set(key, component.bind(null, props, key));
        logger.warning`Setting component ${key}`;
        return;
    }

    return result;
}

Component.map = componentMap;

module.exports = {Component};