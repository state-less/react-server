import { ClientRequest, IComponent, Maybe, ReactServerComponent, ReactServerNode } from './types';
export declare const Lifecycle: <T>(Component: IComponent<T>, props: Record<string, any>, { key, request }: {
    key: string;
    request: Maybe<ClientRequest>;
}) => ReactServerNode<T>;
export declare const render: <T>(tree: ReactServerComponent<T>, request?: Maybe<ClientRequest>, parent?: ReactServerNode<unknown> | null) => ReactServerNode<T>;
