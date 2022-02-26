import { ERR_NO_ROUTER_CONTEXT } from "../consts";
import { toArray } from "../lib/util";

const { WebsocketStream } = require("../Stream");
const logger = require("../lib/logger");
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
const Server = (props) => {
  const { children } = props;

  const components = toArray(children).reduce((lkp, cmp) => {
    const { key } = cmp;
    lkp[key] = cmp;
  }, {});

  return {
    v: "0.0.1",
    component: "Server",
    components,
    props,
  };
};

type RouterProps = {
  target: string;
};

const Router: {
  (props): any;
  context: { props: RouterProps } | null;
} = (props) => {
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
    component: "Router",
    props,
  };
};

Router.context = null;

const Route = (props) => {
  const { target } = props;

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
    component: "Route",
    props,
  };
};

const ClientComponent = (props) => {
  return {
    component: "ClientComponent",
    props,
  };
};
ClientComponent.server = true;

const Action = (props) => {
  const { children: name, disabled, key, use, ...rest } = props;
  return {
    component: "Action",
    props: {
      name,
      disabled,
      boundHandler: rest,
      handler: Object.keys(rest),
    },
  };
};

const Stream = (props, key) => {
  const instance = {
    component: "Stream",
    stream: new WebsocketStream(),
    props: {
      key,
    },
  };
  Stream.instances.set(key, instance);
  return instance;
};
Stream.instances = new Map();
Action.server = true;

export { ClientComponent, Stream, Server, Router, Route, Action };
