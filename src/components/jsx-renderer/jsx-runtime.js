const logger = require('../../lib/logger');


const jsxs = (Component, props) => {
    logger.error`JSX RUNTINE`
    return Component(props);
    return {}
}
const jsx = (Component, props) => {
    logger.error`JSX RUNTINE`
    // if (props.children && !Array.isArray(props.children))
    //     props.children = [props.children];
    return Component(props);
    return {}
}

const Fragment = (args) => {
    logger.error`JSX RUNTINE`
    return {}
}
module.exports = {jsx, jsxs, Fragment};