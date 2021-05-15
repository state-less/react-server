const logger = require("./lib/logger").scope('runtime');

const filterComponents = (child) => child && child.server && 'function' == typeof child;
const filterRenderer = (child) => child && child.server && child.handler && 'function' == typeof child.handler;
const reduceComponents = (lkp, cmp) => {
    lkp[cmp.key] = cmp;
    return lkp;
};

const render = async (server, props, connectionInfo) => {

    let cmp = server;
    let stack = [];
    do {
        cmp = await cmp(props, connectionInfo);

        if (cmp && cmp?.props?.children) {
            for (var i = 0; i < cmp?.props?.children.length; i++) {
                const child = cmp?.props?.children[i];
                if (child && typeof child !== 'function')
                    continue;
                cmp.props.children[i] = await render(child, props, connectionInfo);
            }
        }
        if (cmp && cmp.component) {
            if (cmp.component === 'ClientComponent') continue;
            throw new Error("client")
        }
        if (Array.isArray(cmp)) {
            stack.push(...cmp);
        }
        if (typeof cmp !== 'function')
            cmp = stack.shift();
    } while (typeof cmp === 'function');
    return cmp;
}


module.exports = {
    render
}