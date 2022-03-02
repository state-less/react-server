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
  let current = component,
      root;
  /** Maintains a stack of components to be rendered */

  let stack = [];
  root = current;

  do {
    var _current, _current$props;

    if (isElement(current)) {
      /** A normal component is similar to JSX.Element */
      current = await current.type(props, connectionInfo, parent);
    } else if (typeof current === "function") {
      /** Components can return Components which will be rendered in a second pass; usually upon a client request */
      current = await current(props, connectionInfo);
    } else if (typeof current === "object") {
      /** Usually components are already transformed to objects and no further processing needs to be done */
      current = await current;
    } else if (current === null || typeof current === "undefined") {
      current = null;
    } else {
      throw new Error("Component not valid");
    }
    /** If a component renders another component we need to store the tree to be able to look up providers */


    if (isElement(current) && component.key !== current.key) {
      parentMap[current.key] = component;
    }
    /** We need to traverse the tree as some component down the tree might have rendered components */


    let children = (_current = current) === null || _current === void 0 ? void 0 : (_current$props = _current.props) === null || _current$props === void 0 ? void 0 : _current$props.children;

    if (children) {
      var _current2, _current2$props;

      children = await Promise.all([(_current2 = current) === null || _current2 === void 0 ? void 0 : (_current2$props = _current2.props) === null || _current2$props === void 0 ? void 0 : _current2$props.children].flat());
      current.props.children = children;
    }

    if (current && children) {
      for (var i = 0; i < children.length; i++) {
        const child = await children[i];

        if (Array.isArray(child)) {
          for (var j = 0; j < child.length; j++) {
            var _children$i$j;

            children[i][j] = await render(child[j], props, connectionInfo, current);
            if ((_children$i$j = children[i][j]) !== null && _children$i$j !== void 0 && _children$i$j.key) parentMap[children[i][j].key] = current;
          }
        } else {
          if (child !== null && child !== void 0 && child.key) parentMap[child.key] = current;
        } // if (child && typeof child !== 'function')
        //     continue;


        children[i] = await render(child, props, connectionInfo, current);
      }
    }

    if (current && current.component) {// if (cmp.component === 'ClientComponent') continue;
      // throw new Error("client")
    }

    if (Array.isArray(current)) {
      stack.push(...current);
    }
    /** If the component rendered a functin we need to render it again */


    if (typeof current !== "function") current = stack.shift();
  } while (current);

  Object.assign(tree, root);
  /** The resolved tree */

  return root;
};

exports.render = render;