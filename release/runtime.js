"use strict";

const logger = require("./lib/logger").scope('runtime');

const filterComponents = child => child && child.server && 'function' == typeof child;

const filterRenderer = child => child && child.server && child.handler && 'function' == typeof child.handler;

const reduceComponents = (lkp, cmp) => {
  lkp[cmp.key] = cmp;
  return lkp;
};

const render = async (server, props, connectionInfo) => {
  let cmp = server;
  let stack = [];

  do {
    var _cmp, _cmp$props;

    cmp = await cmp(props, connectionInfo);

    if (cmp && (_cmp = cmp) !== null && _cmp !== void 0 && (_cmp$props = _cmp.props) !== null && _cmp$props !== void 0 && _cmp$props.children) {
      for (var i = 0; i < ((_cmp2 = cmp) === null || _cmp2 === void 0 ? void 0 : (_cmp2$props = _cmp2.props) === null || _cmp2$props === void 0 ? void 0 : _cmp2$props.children.length); i++) {
        var _cmp2, _cmp2$props, _cmp3, _cmp3$props;

        const child = (_cmp3 = cmp) === null || _cmp3 === void 0 ? void 0 : (_cmp3$props = _cmp3.props) === null || _cmp3$props === void 0 ? void 0 : _cmp3$props.children[i];
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