import { FunctionCall } from '../components/Action';
import Dispatcher from './Dispatcher';
import {
  ClientContext,
  IComponent,
  isReactServerComponent,
  isReactServerNode,
  Maybe,
  ReactServerComponent,
  ReactServerNode,
  RenderContext,
} from './types';
import { generateComponentPubSubKey } from './util';

export const Lifecycle = <T,>(
  Component: IComponent<T>,
  props: Record<string, any>,
  { key, context, clientProps }: RenderContext & { key: string }
): ReactServerNode<T> => {
  Dispatcher.getCurrent().addCurrentComponent({ Component, props, key });
  Dispatcher.getCurrent().setClientContext({
    context,
    clientProps,
  });
  const rendered = Component({ ...props }, { context, clientProps });
  Dispatcher.getCurrent().popCurrentComponent();

  return {
    __typename: Component.name,
    key,
    ...rendered,
  };
};

export const render = <T,>(
  tree: ReactServerComponent<T>,
  context: RenderContext = { clientProps: null, context: null },
  parent: ReactServerNode<unknown> | null = null
): ReactServerNode<T> => {
  const { Component, key, props } = tree;

  const processedChildren = [];

  let node = Lifecycle(Component, props, { key, ...context });
  if (isReactServerComponent(node)) {
    node = render(node as unknown as ReactServerComponent<T>, context, node);
  }
  const children = Array.isArray(node.children)
    ? node.children
    : [node.children].filter(Boolean);

  for (const child of children) {
    if (!isReactServerComponent(child)) {
      if (isReactServerNode(child)) {
        processedChildren.push(child);
      }
      continue;
    }

    let childResult: ReactServerNode<T> | ReactServerComponent<unknown> = null;
    do {
      Dispatcher.getCurrent().setParentNode((childResult || child).key, node);
      childResult = render(
        (childResult || child) as ReactServerComponent<T>,
        context,
        node
      );
    } while (isReactServerComponent(childResult));

    processedChildren.push(childResult);
  }

  node.children = processedChildren;

  if (isServerSideProps(node)) {
    for (const entry of Object.entries(node.props)) {
      const [propName, propValue] = entry;
      if (typeof propValue === 'function') {
        node.props[propName] = render(
          <FunctionCall
            component={node.key}
            name={propName}
            fn={node.props[propName]}
          />,
          context,
          node
        );
      }
    }
  }
  if (parent === null) {
    Dispatcher.getCurrent().setRootComponent(node);
  }

  const rendered = { key, ...node };
  Dispatcher.getCurrent()._pubsub.publish(generateComponentPubSubKey(tree), {
    updateComponent: { rendered },
  });
  return rendered;
};

type ServerSidePropsNode = {
  props: Record<string, any>;
  children: ReactServerNode<ServerSidePropsNode>[];
};

const isServerSideProps = (
  node: ReactServerNode<unknown>
): node is ReactServerNode<ServerSidePropsNode> => {
  return node.__typename === 'ServerSideProps';
};
