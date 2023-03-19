import { IComponent, ReactServerComponent, ReactServerNode, RenderContext } from './types';
export declare const Lifecycle: <T>(Component: IComponent<T>, props: Record<string, any>, { key, context, clientProps }: RenderContext & {
    key: string;
}) => ReactServerNode<T>;
export declare const render: <T>(tree: ReactServerComponent<T>, context?: RenderContext, parent?: ReactServerNode<unknown> | null) => ReactServerNode<T>;
