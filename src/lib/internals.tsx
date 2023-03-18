import { FunctionCall } from '../components/Action';
import Dispatcher from './Dispatcher';
import {
  ClientRequest,
  isReactServerComponent,
  Maybe,
  ReactServerComponent,
  ReactServerNode,
} from './types';
import { generateComponentPubSubKey } from './util';

export const Lifecycle = <T,>(
  Component: (
    props: any,
    options: {
      request: Maybe<ClientRequest>;
    }
  ) => ReactServerNode<T>,
  props: Record<string, any>,
  { key, request }: { key: string; request: Maybe<ClientRequest> }
): ReactServerNode<T> => {
  Dispatcher.getCurrent().addCurrentComponent({ Component, props, key });
  Dispatcher.getCurrent().setClientContext(request);
  const rendered = Component({ ...props }, { request });
  Dispatcher.getCurrent().popCurrentComponent();

  return {
    __typename: Component.name,
    key,
    ...rendered,
  };
};

export const render = <T,>(
  tree: ReactServerComponent<T>,
  request: Maybe<ClientRequest> = null,
  parent: ReactServerNode<unknown> | null = null
): ReactServerNode<T> => {
  const { Component, key, props } = tree;
  console.log('Render', Component, props);

  const processedChildren = [];

  let node = Lifecycle(Component, props, { key, request });
  if (isReactServerComponent(node)) {
    node = render(node as unknown as ReactServerComponent<T>, request, node);
  }
  const children = Array.isArray(props.children)
    ? props.children
    : [props.children].filter(Boolean);
  console.log('Render children', children);

  for (const child of children) {
    console.log('Render child', child, children);

    if (!isReactServerComponent(child)) continue;

    let childResult: ReactServerNode<T> | ReactServerComponent<unknown> = null;
    do {
      Dispatcher.getCurrent().setParentNode((childResult || child).key, node);
      childResult = render(
        (childResult || child) as ReactServerComponent<T>,
        request,
        node
      );
      console.log('Render parent', Component, childResult.key, node);
    } while (isReactServerComponent(childResult));

    processedChildren.push(childResult);
  }

  node.children = processedChildren;

  if (isServerSideProps(node)) {
    for (const entry of Object.entries(node.props)) {
      const [propName, propValue] = entry;
      if (typeof propValue === 'function') {
        Dispatcher.getCurrent().addClientSideEffect(tree, propName, propValue);
        node.props[propName] = render(
          <FunctionCall
            component={node.key}
            name={propName}
            fn={node.props[propName]}
          />,
          request,
          node
        );
      }
    }
  }
  if (parent === null) {
    Dispatcher.getCurrent().setRootComponent(node);
  }

  const rendered = { key, ...node };
  Dispatcher.getCurrent()._pubsub.publish(
    generateComponentPubSubKey(tree),
    rendered
  );
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
