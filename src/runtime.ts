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
  let current = component,
    root;
  /** Maintains a stack of components to be rendered */
  let stack = [];

  root = current;
  do {
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
      /** We skip arrays, as they are keyless childs. */
      if (Array.isArray(component) && parent) {
        parentMap[current.key] = parent;
      } else {
        parentMap[current.key] = component;
      }
    }

    /** We need to traverse the tree as some component down the tree might have rendered components */
    let children = current?.props?.children;
    if (children) {
      children = await Promise.all([current?.props?.children].flat());
      current.props.children = children;
    }

    if (current && children) {
      for (var i = 0; i < children.length; i++) {
        const child = await children[i];

        if (Array.isArray(child)) {
          for (var j = 0; j < child.length; j++) {
            children[i][j] = await render(
              child[j],
              props,
              connectionInfo,
              current
            );
            if (children[i][j]?.key) parentMap[children[i][j].key] = current;
          }
        } else {
          if (child?.key) parentMap[child.key] = current;
        }
        // if (child && typeof child !== 'function')
        //     continue;
        children[i] = await render(child, props, connectionInfo, current);
      }
    }
    if (current && current.component) {
      // if (cmp.component === 'ClientComponent') continue;
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
