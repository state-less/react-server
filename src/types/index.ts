import { ReactElement } from "react";
import { Store } from "../server/state";

export type ReactServerChild = ReactServerElement | string | null;
export type ReactServerChildren = ReactServerChild[] | ReactServerChild | null;

export interface PropsWithChildren {
  [index: string]: any;
  key?: string;
  children?: ReactServerChildren;
}
export interface ReactServerComponent<
  P = PropsWithChildren,
  R = ReactServerElement
> {
  (props: P): R;
}

type RouterProps = PropsWithChildren & {
  target: string;
};

export interface RouterComponent extends ReactServerComponent<RouterProps> {
  context: { props: RouterProps } | null;
}

export interface ReactServer$ServerElement extends ReactServerElement {}

export interface ReactServerElement extends JSX.Element {
  /** @deprecated */
  component?: string;
  symbol?: Symbol;
  props: PropsWithChildren;
}

export interface RenderableComponent
  extends ReactServerComponent<PropsWithChildren> {
  handler: Function;
}

export interface ServerComponent extends RenderableComponent {
  server: WebsocketServer;
}

export interface WebsocketServer {}

export type WebSocketServerProps = PropsWithChildren & {
  port?: number;
};

/**
 * Properties for the WebsocketRenderer component
 *
 * @interface WebSocketRendererProps
 * @member {Store} store The root store being used in your server.
 * @field secret random secret that is used to sign JWT.
 */
export interface WebSocketRendererProps {
  secret: String;
  authFactors: String[];
  store: Store;
  children?: ReactServerComponent[];
}
