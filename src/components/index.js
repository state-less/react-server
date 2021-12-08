const { WebsocketStream } = require('../Stream');
const logger = require('../lib/logger');
const { Component } = require('../server/component');
const { Store } = require('../server/state');
const internal = new Store({autoCreate:true});

const Generic = key => props => ({component: key, props})
const Server = Generic('Server');

const Router = Component((props) => {
    const {target} = props;

    if (!target) {
        logger.warning`Router has no target. You need to provide a target for <Route> to work. 
        Usually you would use an environment variable. e.g. <Router target={process.env.TARGET}/>`;

        throw new Error("Missing 'target' prop in Router component.")
    }
    //Dirty workaround to provide children with props without cloning them.
    //The correct solution would be to implement <context.Provider> and useContext.
    Router.context = {
        props
    };
    return props.children
}, internal);

const Route = Component((props) => {
    const {target} = props;

    if (!target) {
        logger.warning`Route has no valid target and will not render. You need to provide a target. e.g: <Router target="node" />`;
        return null;
    }

    if (target != Router.context.props.target) {
        logger.notice`Not rendering route. Target '${target}' doesn't match Router target '${Router.context}'`
        return null;
    }

    return props.children;
}, internal);

const ClientComponent = (props) => {
    return {
        component: 'ClientComponent',
        props
    }
}
ClientComponent.server = true;

const Action = (props) => {
    const {children: name, ...rest} = props;
    return {
        component: 'Action',
        props: {
            name,
            handler: rest
        }
    }
}

const Stream = (props, key) => {
    const instance = {
        component: 'Stream',
        stream: new WebsocketStream,
        props: {
            key
        }
    }
    Stream.instances.set(key, instance);
    return instance;
}
Stream.instances = new Map;
Action.server = true;

module.exports = {
    ClientComponent,
    Stream,
    Server,
    Router,
    Route,
    Action
}