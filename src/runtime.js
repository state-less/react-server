const logger = require("./lib/logger").scope('runtime');

const filterComponents = (child) => child && child.server && 'function' == typeof child;
const filterRenderer = (child) => child && child.server && child.handler && 'function' == typeof child.handler;
const reduceComponents = (lkp, cmp) => {
    lkp[cmp.key] = cmp;
    return lkp;
};

/**
 * The JSX runtime. This renders the component tree.
 * @param {function} component - The root component that shall be rendered
 * @param {*} props - The props that shall be passed to the component
 * @param {*} connectionInfo - The connectionInfo (e.g. socket connection, http headers)
 * @returns 
 */
const render = async (component, props, connectionInfo) => {
    /** The current component that gets rendered */
    let cmp = component;
    /** Maintains a stack of components to be rendered */
    let stack = [];

    do {
        if (typeof cmp === 'function') {
            /** Components can return Components which will be rendered in a second pass; usually upon a client request */
            cmp = await cmp(props, connectionInfo);
        } else if (typeof cmp === 'object') {
            /** Usually components are already transformed to objects and no further processing needs to be done */
            cmp = cmp
        } else if (cmp === null) {
            cmp = cmp;
        } else {
            throw new Error('Component not valid');
        }

        /** We need to traverse the tree as some component down the tree might have rendered Components */
        if (cmp && cmp?.props?.children) {
            for (var i = 0; i < cmp?.props?.children.length; i++) {
                const child = cmp?.props?.children[i];
                if (Array.isArray(child)) {
                    for (var j = 0; j < child.length; j++) {
                        cmp.props.children[i][j] = await render(child[j], props, connectionInfo)
                    }
                }
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

    /** The resolved tree */
    return cmp;
}


module.exports = {
    render
}