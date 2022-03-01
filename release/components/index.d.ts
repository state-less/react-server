/// <reference types="react" />
import { PropsWithChildren, ReactServer$ServerElement, ReactServerComponent, RouterComponent } from "../types";
export declare const StoreProvider: (props: any) => JSX.Element;
export declare const serverSymbol: unique symbol;
declare const Server: ReactServerComponent<PropsWithChildren, ReactServer$ServerElement>;
declare const Router: RouterComponent;
declare const Route: ReactServerComponent;
declare const ClientComponent: ReactServerComponent;
declare const Action: ReactServerComponent;
export declare const StreamInstances: Map<any, any>;
declare const Stream: ReactServerComponent;
export { ClientComponent, Stream, Server, Router, Route, Action };
