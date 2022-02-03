import { ReactElement } from "react";
import { Store } from "../server/state";

export interface ReactServerComponent extends ReactElement {
    children
}

export interface RenderableComponent extends ReactServerComponent {
    handler: Function
}

export interface ServerComponent extends RenderableComponent {
    server: WebsocketServer
}

export interface WebsocketServer { }

/**
 * Properties for the WebsocketRenderer component
 *
 * @interface WebSocketRendererProps
 * @member {Store} store The root store being used in your server. 
 * @field secret random secret that is used to sign JWT.
 */
export interface WebSocketRendererProps {
    secret: String,
    authFactors: String[],
    store: Store,
    children?: ReactServerComponent[]
}