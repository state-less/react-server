import { ERR_NO_ROUTER_CONTEXT } from "../consts";
import { toArray } from "../lib/util";
import {
  PropsWithChildren,
  ReactServer$ServerElement,
  ReactServerComponent,
  ReactServerElement,
  RouterComponent,
} from "../types";
import logger from "../lib/logger";

const { WebsocketStream } = require("../Stream");
const { Component } = require("../server/component");
const { Store } = require("../server/state");
const { storeContext } = require("../context");
const internal = new Store({ autoCreate: true });

export const StoreProvider = (props) => {
  const { store } = props;
  return (
    <storeContext.Provider value={store}>
      {props.children}
    </storeContext.Provider>
  );
};
const Generic = (key) => (props) => ({ component: key, props });

const ServerSymbol = Symbol("react-server.component");
const Server: ReactServerComponent<
  PropsWithChildren,
  ReactServer$ServerElement
> = (props) => {
  const { children, key } = props;

  const elements = toArray(children).reduce((lkp, cmp) => {
    const { key } = cmp;
    lkp[key] = cmp;
  }, {});

  return {
    v: "0.0.1",
    key,
    type: Server,
    elements,
    props,
  };
};

const Router: RouterComponent = (props) => {
  const { target } = props;

  if (!target) {
    logger.warning`Router has no target. You need to provide a target for <Route> to work. 
        Usually you would use an environment variable. e.g. <Router target={process.env.TARGET}/>`;

    throw new Error("Missing 'target' prop in Router component.");
  }
  //Dirty workaround to provide children with props without cloning them.
  //The correct solution would be to implement <context.Provider> and useContext.
  Router.context = {
    props,
  };

  return {
    key: props.key,
    type: Router,
    props,
  };
};

Router.context = null;

const Route: ReactServerComponent = (props) => {
  const { target, key } = props;

  if (!target) {
    logger.warning`Route has no valid target and will not render. You need to provide a target. e.g: <Router target="node" />`;
    return null;
  }

  if (!Router.context.props.target) throw new Error(ERR_NO_ROUTER_CONTEXT);

  if (!target.includes(Router.context.props.target)) {
    logger.notice`Not rendering route. Target '${target}' doesn't match Router target '${Router.context}'`;
    return null;
  }

  return {
    type: Route,
    key,
    props,
  };
};

const ClientComponent: ReactServerComponent = (props) => {
  return {
    type: ClientComponent,
    component: "ClientComponent",
    key: props.key,
    props,
  };
};

const Action: ReactServerComponent = (props) => {
  const { children: name, disabled, key, use, ...rest } = props;
  return {
    type: Action,
    component: "Action",
    key,
    props: {
      name,
      disabled,
      boundHandler: rest,
      handler: Object.keys(rest),
    },
  };
};

export const StreamInstances = new Map();
const Stream: ReactServerComponent = (props) => {
  const { key } = props;
  const instance = {
    type: Stream,
    key,
    component: "Stream",
    stream: new WebsocketStream(),
    props,
  };
  StreamInstances.set(key, instance);
  return instance;
};

export { ClientComponent, Stream, Server, Router, Route, Action };
