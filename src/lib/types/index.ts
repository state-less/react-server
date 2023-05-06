import { Context } from '../Dispatcher';

export type Maybe<T> = T | null;

/** Contains information about the client request, such as the headers */
export type ClientContext = {
  headers: Record<string, string>;
};

export const isClientContext = (context: any): context is ClientContext => {
  return context && context.headers !== undefined;
};

export const isServerContext = (context: any): context is ClientContext => {
  return context && context.__typename === 'ServerContext';
};
/** Contains information about the server */
export type ServerContext = {
  os: string;
  __typename: 'ServerContext';
};

/** Provides context about the current request the component is being rendered under (server / client) */
export type RequestContext = ClientContext | ServerContext;

export enum Initiator {
  RenderServer,
  RenderClient,
  FunctionCall,
  StateUpdate,
  Mount,
}

export type RenderOptions = {
  context: Maybe<RequestContext>;
  clientProps: Maybe<Record<string, any>>;
  initiator: Initiator;
};

export type ReactServerNode<T> = {
  __typename: string;
  children: Array<ReactServerNode<unknown>>;
  key: string;
} & T;

export interface IComponent<T> {
  (
    props: Record<string, any>,
    options: RenderOptions & { key: string }
  ): ReactServerNode<T>;
}
export type ReactServerComponent<T> = {
  props: Record<string, any>;
  key: string;
  Component: IComponent<T>;
};

export const isReactServerComponent = <T>(
  node: unknown
): node is ReactServerComponent<T> => {
  return (
    node &&
    typeof node === 'object' &&
    'Component' in node &&
    'props' in node &&
    'key' in node
  );
};

export const isReactServerNode = <T>(
  node: Partial<ReactServerNode<T>>
): node is ReactServerNode<T> => {
  return node.__typename !== undefined;
};

export const isProvider = (
  node: unknown
): node is ReactServerNode<{ context: { current: unknown } }> => {
  return node && typeof node === 'object' && 'context' in node && 'key' in node;
};
