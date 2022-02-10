const logger = require('../src/lib/logger');
const {Component:Lifecycle} = require('../release/server/component');
const {storeContext} = require('../release/context');
const { v4 } = require('uuid');

let last = null;
let root = null;

const lookup = {};

const render = (key) => {

};

const jsxs = (Component, props, key) => {
    const {store, ...rest} = props;
    return Component(props, key, {store});
}
const jsx = (Component, props, key = v4()) => {
    const {store, ...rest} = props;
    const component = Lifecycle(Component)(props, key, {store});
    component.key = key;
    component.constructor = Component;
    
    lookup[key] = component;

    return component
}

const Fragment = (args) => {
    return {}
}
module.exports = {jsx, jsxs, Fragment};