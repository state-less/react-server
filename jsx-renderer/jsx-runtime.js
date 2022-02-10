const logger = require('../src/lib/logger');
const {Component:Lifecycle} = require('../release/server/component');

const jsxs = (Component, props, key) => {
    const {store, ...rest} = props;
    return Component(props, key, {store});
}
const jsx = (Component, props, key) => {
    const {store, ...rest} = props;
    const component = Lifecycle(Component)(props, key, {store});
    component.key = key;
    component.constructor = Component;
    
    return component
}

const Fragment = (args) => {
    return {}
}
module.exports = {jsx, jsxs, Fragment};