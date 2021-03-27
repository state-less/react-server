const logger = require("./lib/logger").scope('runtime');

const filterComponents = (child) => child && child.server && 'function' == typeof child;
const filterRenderer = (child) => child && child.server && child.handler && 'function' == typeof child.handler;
const reduceComponents = (lkp, cmp) => {
    lkp[cmp.key] = cmp;
    return lkp;
};

const render = async (server) => {

    let cmp = server;
    let stack = [];
    do {
        cmp = await cmp();
        logger.warning`COMPONENT ${cmp}`
        if (cmp && cmp.component) {
            if (cmp.component === 'ClientComponent') break;
            throw new Error("client")
        }
        if (Array.isArray(cmp)) {
            stack.push(...cmp);
        }
        if (typeof cmp !== 'function')
            cmp = stack.shift();
    } while (typeof cmp === 'function');
    return cmp;
    // logger.warning`Rendering server ${server}`;
    // const {port} = server;
    // let {props: {children}} = server;
 
    // if (!Array.isArray(children)) children = [children];

    // const components = children.filter(filterComponents);
    // const renderer = children.find(filterRenderer);

    // const componentLkp = components.reduce(reduceComponents, {});

    // logger.warning`Rendering server ${componentLkp}`;
    // renderer.handler(componentLkp)
}


module.exports = {
    render
}