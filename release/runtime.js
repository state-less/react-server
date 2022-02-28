"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.render = exports.parentMap = exports.tree = void 0;

const filterComponents = child => child && child.server && "function" == typeof child;

const filterRenderer = child => child && child.server && child.handler && "function" == typeof child.handler;

const reduceComponents = (lkp, cmp) => {
  lkp[cmp.key] = cmp;
  return lkp;
};
/**
 * Contains the rendered tree.
 */


const tree = {};
exports.tree = tree;
const parentMap = {};
exports.parentMap = parentMap;

const isElement = object => {
  if (!object) return false;
  return typeof object.type === "function" && object.props;
};

const render = async (component, props, connectionInfo, parent = null) => {
  /** The current component that gets rendered */
  let cmp = component,
      root;
  /** Maintains a stack of components to be rendered */

  let stack = [];

  do {
    var _cmp, _cmp$props;

    if (isElement(cmp)) {
      /** A normal component is similar to JSX.Element */
      cmp = await cmp.type(props, connectionInfo, parent);
    } else if (typeof cmp === "function") {
      /** Components can return Components which will be rendered in a second pass; usually upon a client request */
      cmp = await cmp(props, connectionInfo);
    } else if (typeof cmp === "object") {
      /** Usually components are already transformed to objects and no further processing needs to be done */
      cmp = await cmp;
    } else if (cmp === null || typeof cmp === "undefined") {
      cmp = null;
    } else {
      throw new Error("Component not valid");
    }

    root = cmp;
    /** We need to traverse the tree as some component down the tree might have rendered Components */

    let children = (_cmp = cmp) === null || _cmp === void 0 ? void 0 : (_cmp$props = _cmp.props) === null || _cmp$props === void 0 ? void 0 : _cmp$props.children;

    if (children) {
      var _cmp2, _cmp2$props;

      children = await Promise.all([(_cmp2 = cmp) === null || _cmp2 === void 0 ? void 0 : (_cmp2$props = _cmp2.props) === null || _cmp2$props === void 0 ? void 0 : _cmp2$props.children].flat());
      cmp.props.children = children;
    }

    if (cmp && children) {
      for (var i = 0; i < children.length; i++) {
        const child = await children[i];

        if (Array.isArray(child)) {
          for (var j = 0; j < child.length; j++) {
            var _children$i$j;

            children[i][j] = await render(child[j], props, connectionInfo, cmp);
            if ((_children$i$j = children[i][j]) !== null && _children$i$j !== void 0 && _children$i$j.key) parentMap[children[i][j].key] = cmp;
          }
        } else {
          if (child !== null && child !== void 0 && child.key) parentMap[child.key] = cmp;
        } // if (child && typeof child !== 'function')
        //     continue;


        children[i] = await render(child, props, connectionInfo);
      }
    }

    if (cmp && cmp.component) {// if (cmp.component === 'ClientComponent') continue;
      // throw new Error("client")
    }

    if (Array.isArray(cmp)) {
      stack.push(...cmp);
    }

    if (typeof cmp !== "function") cmp = stack.shift();
  } while (cmp);

  Object.assign(tree, root);
  /** The resolved tree */

  return root;
};

exports.render = render;