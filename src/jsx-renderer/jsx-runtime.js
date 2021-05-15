console.log("DIR", __dirname)
const logger = require('./logger');
const util = require('util')
const runtime = require('react/jsx-runtime');
const jsxs = (Component, props, key) => {
    const {store, ...rest} = props;
    process.env.ssrProps = props;
    const comp = Component(props, key, {
        store,
    });
    process.exit(0);
}
const jsx = (Component, props, key) => {
    const { store, ...rest } = props;
    // if (props.children && !Array.isArray(props.children))
    //     props.children = [props.children];
    const isServer = Component.server;
    global.window = {}
    if (!Component.server) return runtime.jsx(Component, props);
    const component = Component(rest, key, {store});
}

const Fragment = (args) => {
    return {}
}
module.exports = { jsx, jsxs, Fragment };