import { ClientContext, IComponent, Maybe, ReactServerComponent, ReactServerNode } from './types';
export declare const Lifecycle: <T>(Component: IComponent<T>, props: Record<string, any>, { key, request }: {
    key: string;
    request: Maybe<ClientContext>;
}) => ReactServerNode<T>;
export declare const render: <T>(tree: ReactServerComponent<T>, request?: Maybe<ClientContext>, parent?: ReactServerNode<unknown> | null) => ReactServerNode<T>;
