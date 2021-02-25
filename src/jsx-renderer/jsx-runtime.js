console.log("DIR", __dirname)
const logger = require('./logger');
const util = require('util')
const runtime = require('react/jsx-runtime');
const jsxs = (Component, props, key) => {
    logger.error`JSX RUNTINE ${key}`
    process.env.ssrProps = props;
    const comp = Component(props);
    process.env.ssrProps = null;
    return comp;
}
const jsx = (Component, props, key) => {
    const { ...rest } = props;
    logger.error`JSX RUNTINE ${runtime} ${util.inspect(Component)}, ${key}`
    // if (props.children && !Array.isArray(props.children))
    //     props.children = [props.children];
    const isServer = Component.server;
    global.window = {}
    if (!Component.server) return runtime.jsx(Component, props);
    const component = Component(rest);
    component.key = key;
    return component;
}

const Fragment = (args) => {
    logger.error`JSX RUNTINE`
    return {}
}
module.exports = { jsx, jsxs, Fragment };