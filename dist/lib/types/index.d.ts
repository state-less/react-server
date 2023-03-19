export type Maybe<T> = T | null;
export type ClientContext = {
    headers: Record<string, string>;
};
export type ReactServerNode<T> = {
    __typename: string;
    children: Array<ReactServerNode<unknown>>;
    key: string;
} & T;
export interface IComponent<T> {
    (props: Record<string, any>, options: {
        request: ClientContext;
    }): ReactServerNode<T>;
}
export type ReactServerComponent<T> = {
    props: Record<string, any>;
    key: string;
    Component: IComponent<T>;
};
export declare const isReactServerComponent: <T>(node: unknown) => node is ReactServerComponent<T>;
export declare const isReactServerNode: <T>(node: Partial<ReactServerNode<T>>) => node is ReactServerNode<T>;
export declare const isProvider: (node: unknown) => node is ReactServerNode<{
    context: {
        current: unknown;
    };
}>;
