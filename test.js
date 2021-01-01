const { State, SocketIOBroker, Store } = require('./src/server/state');
const {SocketTransport}= require('l0g/transports/SocketTransport');
const { Format } = require('l0g/symbols');
const { Component } = require('./src/server/component');
const  equal = require('fast-deep-equal');

const {ConnectionHandler} = require('./src/server/handler')
var http = require('http').createServer();
var io = require('socket.io')(http, { cors: {
    origin: '*',
  }});
const {io: client} = require('socket.io-client');
const _logger = require('./src/lib/logger');
const util = require('util');
const logger = _logger.scope('state-server.example')

const store = new Store({autoCreate: true});
const public = store.scope('public');
      public.autoCreate = true;

const broker = new SocketIOBroker();
const jwt = require('jsonwebtoken');

//Allow all requests. This is where you can implement authentication via jwt.
store.onRequestState = () => true;



const {useState: usePublicState} = public;


http.listen(3000, () => {
    logger.info('listening on *:3000');
});

io.on('connection', (socket) => {
    const {value, setValue} = usePublicState('connections', 0);
    logger.info`Connection reveived, value: ${value}`;
    setValue(value + 1);

    socket.on('disconnecting', function() {
        const {value, setValue} = usePublicState('connections', 0);
        logger.info`CLient disconnected, value: ${value}`;

        setValue(value - 1);
    });
})

logger.addTransport(
  new SocketTransport(io, 'log')
)

const Poll = Component((props, socket) => {
    const {values, temp, key} = props;
    const [votes, setVotes] = Component.useState(values.map(v => 0),!temp?'votes':null);
    logger.info`State used. ${votes}`;
    const [voted, setVoted, onRequest] = Component.useState({}, 'voted');
    const [authenticated, setAuthenticated] = Component.useClientState(false, null, {scope: socket.id});
    const [secret] = Component.useState('Yo mama', 'secret',  {deny: authenticated == false});
    const [hasVoted, setHasVoted] = Component.useClientState(false,null, {scope: socket.id});
    
    // const [protected] = Component.useState(null, 'protected', {deny: !authenticated});

    Component.useEffect(() => {
      logger.error`TEmp ${temp} effect`

        const to = setTimeout(() => {
           votes[~~(Math.random()*4)]++;
           logger.error`TEmp ${temp} setVotes`
           setVotes(votes);
        }, 2000);
        return () => {
          clearTimeout(to);
        }
    });

    Component.useClientEffect(() => {
      logger.scope('effect').error`Client Connected`
      return () => {
        logger.scope('effect').error`Client Disconnected ${util.inspect(socket)}`
        
      }
    });

    const authenticate = ({socket, respond}, password) => {
      if (password === 'foobar') {
        setAuthenticated(true)
      } else {
        setTimeout(() => {
          respond('Hint, it is foobar');
        }, 2000);
        throw new Error('Wrong password.');
      }
    }

    const vote = ({socket}, option) => {
      if (!values[option]) {
        throw new Error(`Unsupported value. Supported values are ${values}`);
      }
  
      logger.warning`VOTING ${socket.id}`;
      if (socket.id in voted) {
        throw new Error('Cannot vote twice');
      }
      
      logger.scope('foo').error`vote ${socket}`

      votes[option]++;
      voted[socket.id] = true;
      setVoted(voted);
      setVotes(votes);
      setHasVoted(option)

      return "HEY CLIENT"
    };
  
    return {
      props,
      states: {
        votes,
        authenticated,
        voted: hasVoted,
        rendered: +new Date,
        secret
        // protected
      },
      actions: {
        vote,
        authenticate
      }
    }
}, public);

//Handle connectioons using a connection handler, message broker and store. 
//You can write your own handler, but most of the time t
io.on('connection', ConnectionHandler(broker, store));

const poll = Poll({
    values: ['Great idea', 'Dont like it', 'Waste of time', 'Where can i get this?']
}, 'poll');

const temp = Poll({
  values: ['Great idea', 'Dont like it', 'Waste of time', 'Where can i get this?'],
  temp: true,
}, 'poll.temp');

// poll();

io.on('connection', (socket) => {
    logger.warning`Client connected. ${socket.id}`
    socket[Format] = (socket) => `Socket[${socket.id}]`;
    socket.join(`state-server.client:${socket.id}`);

    socket.on('useComponent', (key) => {
      socket.join(`state-server.component.${key}`);
      socket.join(`state-server.component.${key}:${socket.id}`);
      const component = Component.instances.get(key);
      logger.info`Using component ${key}`;  
      logger.info`Found component. Rendering ${component}`;
      try {
        const result = component(socket);

        logger.error`COMPONENT STATE!!! ${result}`;

        socket.once("disconnecting", () => {
          logger.error(`Removing temp variables`);
            result.cleanup();
            // process.exit(0);
          })
          logger.scope('foo').error`useComponent ${socket}`
          socket.emit(`useComponent:${key}`, {id:r});
        } catch (e) {
          socket.emit('error', key, 'socket:render', e.message);
          throw e;
        }
    })

    socket.on('executeAction', (componentKey, actionId, id, args) => {
      const scope = Component.scope.get(socket.id);
      const component = scope.get(componentKey);
      logger.debug`Rendered components ${component}`
        if (!component.actions) {
          socket.emit('error', componentKey, actionId, "Component has not rendered. Cannot call action on unmounted component");
          return
        }

        const action = component.actions[actionId];
        logger.error`Request to execute action ${actionId} from client ${socket}`;

        try {
            const respond = (...args) => {
              socket.emit('executeAction:'+id, componentKey, actionId, id, ...args);
            }
            const result = action({socket, respond}, ...args);

            // logger.error`RENDERED: ${}`
            respond(result);
        } catch (e) {
            socket.emit('error', componentKey, actionId, e.message);
        }
    })
})

setInterval(() => {
  store.purge();
}, 60000);

// setInterval(() => {
//     logger.scope('foo').info`Store: ${util.inspect(public, false, true)}`;
// }, 3000)

// const socket = client('http://localhost:3000');

// socket.emit('useComponent', 'poll')

// socket.on('useComponent:poll', (result) => {
//     console.log ("Use component ", result);
//     const vote = result.actions.vote;

//     socket.emit('executeAction', 'poll', vote, [0]);
// })