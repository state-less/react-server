import { IComponent, ReactServerComponent, ReactServerNode, RenderOptions, ServerContext } from './types';
export declare const Lifecycle: <T>(Component: IComponent<T>, props: Record<string, any>, { key, context, clientProps, initiator }: RenderOptions & {
    key: string;
}) => ReactServerNode<T>;
export declare const serverContext: () => ServerContext;
export declare const renderCache: {};
export declare const render: <T>(tree: ReactServerComponent<T>, renderOptions?: RenderOptions, parent?: ReactServerComponent<unknown> | null) => ReactServerNode<T>;
