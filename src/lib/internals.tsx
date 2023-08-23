import { FunctionCall } from '../components/Action';
import Dispatcher from './Dispatcher';
import {
  ClientContext,
  IComponent,
  Initiator,
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
  { key, context, clientProps, initiator }: RenderOptions & { key: string }
): ReactServerNode<T> => {
  Dispatcher.getCurrent().setClientContext({
    context,
    clientProps,
    initiator,
  });
  const rendered = Component(
    { ...props },
    { context, clientProps, key, initiator }
  );

  return {
    __typename: Component.name,
    key,
    ...rendered,
  };
};

const serverContext = () => ({ __typename: 'ServerContext' } as ServerContext);

const renderCache = {};
export const render = <T,>(
  tree: ReactServerComponent<T>,
  renderOptions: RenderOptions = {
    clientProps: null,
    context: null,
    initiator: Initiator.RenderServer,
  },
  parent: ReactServerComponent<unknown> | null = null
): ReactServerNode<T> => {
  const { Component, key, props } = tree;

  const processedChildren = [];
  const requestContext =
    !renderOptions || renderOptions?.context === null
      ? serverContext()
      : renderOptions.context;

  Dispatcher.getCurrent().addCurrentComponent(tree);

  let node = Lifecycle(Component, props, {
    key,
    ...renderOptions,
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
    ? node.children.flat()
    : [node.children].filter(Boolean);

  const components: ReactServerComponent<unknown>[] = [];
  for (const child of children) {
    if (!isReactServerComponent(child)) {
      if (isReactServerNode(child)) {
        processedChildren.push(child);
      }
      continue;
    }

    let childResult: ReactServerNode<T> | ReactServerComponent<unknown> = null;
    components.push(child);
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

  Dispatcher.getCurrent().popCurrentComponent();
  node.children = processedChildren;

  if (isServerSideProps(node)) {
    for (const entry of Object.entries(node.props)) {
      const [propName, propValue] = entry;
      if (typeof propValue === 'function') {
        node.props[propName] = render(
          <FunctionCall
            key={`${node.key}.${propName}`}
            component={parent?.key || node.key}
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

  if (
    isClientContext(requestContext) &&
    JSON.stringify(rendered) !== JSON.stringify(renderCache[key])
  ) {
    console.log(
      'DIFF',
      JSON.stringify(rendered),
      JSON.stringify(renderCache[key]),
      parent?.key
    );
    console.log(`Rerendering component ${key}`);
    Dispatcher.getCurrent()._pubsub.publish(
      generateComponentPubSubKey(tree, requestContext as ClientContext),
      {
        updateComponent: { rendered },
      }
    );
  }

  renderCache[key] = rendered;
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
