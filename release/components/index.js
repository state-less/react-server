"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Action = exports.Route = exports.Router = exports.Server = exports.Stream = exports.ClientComponent = exports.StoreProvider = void 0;

var _consts = require("../consts");

var _util = require("../lib/util");

var _jsxRuntime = require("../../jsx-renderer/jsx-runtime");

const {
  WebsocketStream
} = require("../Stream");

const logger = require("../lib/logger");

const {
  Component
} = require("../server/component");

const {
  Store
} = require("../server/state");

const {
  storeContext
} = require("../context");

const internal = new Store({
  autoCreate: true
});

const StoreProvider = props => {
  const {
    store
  } = props;
  return (0, _jsxRuntime.jsx)(storeContext.Provider, {
    value: store,
    children: props.children
  });
};

exports.StoreProvider = StoreProvider;

const Generic = key => props => ({
  component: key,
  props
});

const ServerSymbol = Symbol("react-server.component");

const Server = props => {
  const {
    children
  } = props;
  const components = (0, _util.toArray)(children).reduce((lkp, cmp) => {
    const {
      key
    } = cmp;
    lkp[key] = cmp;
  }, {});
  return {
    v: "0.0.1",
    component: "Server",
    components,
    props
  };
};

exports.Server = Server;

const Router = props => {
  const {
    target
  } = props;

  if (!target) {
    logger.warning`Router has no target. You need to provide a target for <Route> to work. 
        Usually you would use an environment variable. e.g. <Router target={process.env.TARGET}/>`;
    throw new Error("Missing 'target' prop in Router component.");
  } //Dirty workaround to provide children with props without cloning them.
  //The correct solution would be to implement <context.Provider> and useContext.


  Router.context = {
    props
  };
  return {
    component: "Router",
    props
  };
};

exports.Router = Router;
Router.context = null;

const Route = props => {
  const {
    target
  } = props;

  if (!target) {
    logger.warning`Route has no valid target and will not render. You need to provide a target. e.g: <Router target="node" />`;
    return null;
  }

  if (!Router.context.props.target) throw new Error(_consts.ERR_NO_ROUTER_CONTEXT);

  if (!target.includes(Router.context.props.target)) {
    logger.notice`Not rendering route. Target '${target}' doesn't match Router target '${Router.context}'`;
    return null;
  }

  return {
    component: "Route",
    props
  };
};

exports.Route = Route;

const ClientComponent = props => {
  return {
    component: "ClientComponent",
    props
  };
};

exports.ClientComponent = ClientComponent;
ClientComponent.server = true;

const Action = props => {
  const {
    children: name,
    disabled,
    key,
    use,
    ...rest
  } = props;
  return {
    component: "Action",
    props: {
      name,
      disabled,
      boundHandler: rest,
      handler: Object.keys(rest)
    }
  };
};

exports.Action = Action;

const Stream = (props, key) => {
  const instance = {
    component: "Stream",
    stream: new WebsocketStream(),
    props: {
      key
    }
  };
  Stream.instances.set(key, instance);
  return instance;
};

exports.Stream = Stream;
Stream.instances = new Map();
Action.server = true;