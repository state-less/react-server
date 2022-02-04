const logger = require('../src/lib/logger');


const jsxs = (Component, props, key) => {
    const {store, ...rest} = props;
    return Component(props, key, {store});
}
const jsx = (Component, props, key) => {
    const {store, ...rest} = props;
    const component = Component(props, key, {store});
    component.key = key;

    return component
}

const Fragment = (args) => {
    return {}
}
module.exports = {jsx, jsxs, Fragment};