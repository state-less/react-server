"use strict";

const logger = require("./lib/logger").scope('runtime');

const filterComponents = child => child && child.server && 'function' == typeof child;

const filterRenderer = child => child && child.server && child.handler && 'function' == typeof child.handler;

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
    var _cmp, _cmp$props;

    cmp = await cmp(props, connectionInfo);

    if (cmp && (_cmp = cmp) !== null && _cmp !== void 0 && (_cmp$props = _cmp.props) !== null && _cmp$props !== void 0 && _cmp$props.children) {
      for (var i = 0; i < ((_cmp2 = cmp) === null || _cmp2 === void 0 ? void 0 : (_cmp2$props = _cmp2.props) === null || _cmp2$props === void 0 ? void 0 : _cmp2$props.children.length); i++) {
        var _cmp2, _cmp2$props, _cmp3, _cmp3$props;

        const child = (_cmp3 = cmp) === null || _cmp3 === void 0 ? void 0 : (_cmp3$props = _cmp3.props) === null || _cmp3$props === void 0 ? void 0 : _cmp3$props.children[i];

        if (Array.isArray(child)) {
          for (var j = 0; j < child.length; j++) {
            cmp.props.children[i][j] = await render(child[j], props, connectionInfo);
          }
        }

        if (child && typeof child !== 'function') continue;
        cmp.props.children[i] = await render(child, props, connectionInfo);
      }
    }

    if (cmp && cmp.component) {
      if (cmp.component === 'ClientComponent') continue;
      throw new Error("client");
    }

    if (Array.isArray(cmp)) {
      stack.push(...cmp);
    }

    if (typeof cmp !== 'function') cmp = stack.shift();
  } while (typeof cmp === 'function');

  return cmp;
};

module.exports = {
  render
};