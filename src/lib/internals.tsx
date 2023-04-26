import { FunctionCall } from '../components/Action';
import Dispatcher from './Dispatcher';
import {
  ClientContext,
  IComponent,
  isClientContext,
  isReactServerComponent,
  isReactServerNode,
  ReactServerComponent,
  ReactServerNode,
  RenderOptions,
  ServerContext,
} from './types';
import { generateComponentPubSubKey } from './util';

export const Lifecycle = <T,>(
  Component: IComponent<T>,
  props: Record<string, any>,
  { key, context, clientProps }: RenderOptions & { key: string }
): ReactServerNode<T> => {
  Dispatcher.getCurrent().addCurrentComponent({ Component, props, key });
  Dispatcher.getCurrent().setClientContext({
    context,
    clientProps,
  });
  const rendered = Component({ ...props }, { context, clientProps, key });
  Dispatcher.getCurrent().popCurrentComponent();

  return {
    __typename: Component.name,
    key,
    ...rendered,
  };
};

const serverContext = () => ({} as ServerContext);

export const isServer = (context: RenderOptions) =>
  context.context === serverContext();

export const render = <T,>(
  tree: ReactServerComponent<T>,
  renderOptions: RenderOptions = { clientProps: null, context: null },
  parent: ReactServerComponent<unknown> | null = null
): ReactServerNode<T> => {
  const { Component, key, props } = tree;

  const processedChildren = [];
  const requestContext =
    !renderOptions || renderOptions?.context === null
      ? serverContext()
      : renderOptions.context;

  let node = Lifecycle(Component, props, {
    key,
    clientProps: renderOptions?.clientProps,
    context: requestContext,
  });
  if (isReactServerComponent(node)) {
    node = render(
      node as unknown as ReactServerComponent<T>,
      renderOptions,
      tree
    );
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
        renderOptions,
        tree
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
            component={parent.key || node.key}
            name={propName}
            fn={node.props[propName]}
          />,
          renderOptions,
          tree
        );
      }
    }
  }
  if (parent === null) {
    Dispatcher.getCurrent().setRootComponent(node);
  }

  const rendered = { key, ...node };

  console.log('Checking for client context');
  if (isClientContext(requestContext)) {
    console.log(
      'Publishing ',
      generateComponentPubSubKey(tree, requestContext as ClientContext),
      requestContext
    );
    Dispatcher.getCurrent()._pubsub.publish(
      generateComponentPubSubKey(tree, requestContext as ClientContext),
      {
        updateComponent: { rendered },
      }
    );
  }
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
