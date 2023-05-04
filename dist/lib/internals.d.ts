import { IComponent, ReactServerComponent, ReactServerNode, RenderOptions } from './types';
export declare const Lifecycle: <T>(Component: IComponent<T>, props: Record<string, any>, { key, context, clientProps, initiator }: RenderOptions & {
    key: string;
}) => ReactServerNode<T>;
export declare const isServer: (context: RenderOptions) => boolean;
export declare const render: <T>(tree: ReactServerComponent<T>, renderOptions?: RenderOptions, parent?: ReactServerComponent<unknown> | null) => ReactServerNode<T>;
