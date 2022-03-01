const filterComponents = (child) =>
  child && child.server && "function" == typeof child;
const filterRenderer = (child) =>
  child && child.server && child.handler && "function" == typeof child.handler;
const reduceComponents = (lkp, cmp) => {
  lkp[cmp.key] = cmp;
  return lkp;
};

/**
 * Contains the rendered tree.
 */
export const tree = {};
export const parentMap = {};

const isElement = (object: any) => {
  if (!object) return false;

  return typeof object.type === "function" && object.props;
};

export const render = async (
  component,
  props,
  connectionInfo,
  parent = null
) => {
  /** The current component that gets rendered */
  let cmp = component,
    root;
  /** Maintains a stack of components to be rendered */
  let stack = [];

  root = cmp;
  do {
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

    if (root !== cmp) parentMap[cmp.key] = root;
    /** We need to traverse the tree as some component down the tree might have rendered Components */
    let children = cmp?.props?.children;
    if (children) {
      children = await Promise.all([cmp?.props?.children].flat());
      cmp.props.children = children;
    }

    if (cmp && children) {
      for (var i = 0; i < children.length; i++) {
        const child = await children[i];

        if (Array.isArray(child)) {
          for (var j = 0; j < child.length; j++) {
            children[i][j] = await render(child[j], props, connectionInfo, cmp);
            if (children[i][j]?.key) parentMap[children[i][j].key] = cmp;
          }
        } else {
          if (child?.key) parentMap[child.key] = cmp;
        }
        // if (child && typeof child !== 'function')
        //     continue;
        children[i] = await render(child, props, connectionInfo, cmp);
      }
    }
    if (cmp && cmp.component) {
      // if (cmp.component === 'ClientComponent') continue;
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
