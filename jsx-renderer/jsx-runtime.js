const logger = require('../src/lib/logger');


const jsxs = (Component, props, key) => {
    logger.error`JSX RUNTINE ${props} ${key}`
    return Component(props, key);
}
const jsx = (Component, props, key) => {
    logger.error`JSX RUNTINE ${props} ${key}`

    const component = Component(props, key);
    component.key = key;
    
    return component
}

const Fragment = (args) => {
    logger.error`JSX RUNTINE`
    return {}
}
module.exports = {jsx, jsxs, Fragment};