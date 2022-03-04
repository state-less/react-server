"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Action = exports.Route = exports.Router = exports.Server = exports.Stream = exports.ClientComponent = exports.StreamInstances = exports.serverSymbol = exports.StoreProvider = void 0;

var _consts = require("../consts");

var _logger = _interopRequireDefault(require("../lib/logger"));

var _jsxRuntime = require("../../jsx-renderer/jsx-runtime");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  WebsocketStream
} = require("../Stream");

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

const serverSymbol = Symbol("server");
exports.serverSymbol = serverSymbol;

const Server = props => {
  const {
    children,
    key
  } = props;
  return {
    type: Server,
    key,
    props
  };
};

exports.Server = Server;

const Router = props => {
  const {
    target
  } = props;

  if (!target) {
    _logger.default.warning`Router has no target. You need to provide a target for <Route> to work. 
        Usually you would use an environment variable. e.g. <Router target={process.env.TARGET}/>`;
    throw new Error("Missing 'target' prop in Router component.");
  } //Dirty workaround to provide children with props without cloning them.
  //The correct solution would be to implement <context.Provider> and useContext.


  Router.context = {
    props
  };
  return {
    key: props.key,
    type: Router,
    props
  };
};

exports.Router = Router;
Router.context = null;

const Route = props => {
  const {
    target,
    key
  } = props;

  if (!target) {
    _logger.default.warning`Route has no valid target and will not render. You need to provide a target. e.g: <Router target="node" />`;
    return null;
  }

  if (!Router.context.props.target) throw new Error(_consts.ERR_NO_ROUTER_CONTEXT);

  if (!target.includes(Router.context.props.target)) {
    _logger.default.notice`Not rendering route. Target '${target}' doesn't match Router target '${Router.context}'`;
    return null;
  }

  return {
    type: Route,
    key,
    props
  };
};

exports.Route = Route;

const ClientComponent = props => {
  return {
    type: ClientComponent,
    component: "ClientComponent",
    key: props.key,
    props
  };
};

exports.ClientComponent = ClientComponent;

const Action = props => {
  const {
    children: name,
    disabled,
    key,
    use,
    ...rest
  } = props;
  return {
    type: Action,
    component: "Action",
    key,
    props: {
      name,
      disabled,
      boundHandler: rest,
      handler: Object.keys(rest)
    }
  };
};

exports.Action = Action;
const StreamInstances = new Map();
exports.StreamInstances = StreamInstances;

const Stream = props => {
  const {
    key
  } = props;
  const instance = {
    type: Stream,
    key,
    component: "Stream",
    stream: new WebsocketStream(),
    props
  };
  StreamInstances.set(key, instance);
  return instance;
};

exports.Stream = Stream;