import { Context } from '../Dispatcher';

export type Maybe<T> = T | null;
export type ClientRequest = {};

export type ReactServerNode<T> = {
  __typename: string;
  children: Array<ReactServerNode<unknown>>;
  key: string;
} & T;

export interface IComponent<T> {
  (
    props: Record<string, any>,
    options: { request: ClientRequest }
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
