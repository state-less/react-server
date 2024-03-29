export type Maybe<T> = T | null;
/** Contains information about the client request, such as the headers */
export type ClientContext = {
    headers: Record<string, string>;
};
export declare const isClientContext: (context: any) => context is ClientContext;
export declare const isServerContext: (context: any) => context is ClientContext;
/** Contains information about the server */
export type ServerContext = {
    os: string;
    __typename: 'ServerContext';
};
/** Provides context about the current request the component is being rendered under (server / client) */
export type RequestContext = ClientContext | ServerContext;
export declare enum Initiator {
    RenderServer = 0,
    RenderClient = 1,
    FunctionCall = 2,
    StateUpdate = 3,
    Mount = 4
}
export type RenderOptions = {
    context: Maybe<RequestContext>;
    clientProps: Maybe<Record<string, any>>;
    initiator: Initiator;
};
export type ReactServerNode<T> = {
    __typename: string;
    children: Array<ReactServerNode<unknown>>;
    component?: string;
    key: string;
} & T;
export interface IComponent<T> {
    (props: Record<string, any>, options: RenderOptions & {
        key: string;
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
