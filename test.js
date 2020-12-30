const { State, SocketIOBroker, Store } = require('./src/server/state');
const { Component } = require('./src/server/component');

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



const Poll = Component((props, socket) => {
    const {values, temp, key} = props;
    const [votes, setVotes] = Component.useState(values.map(v => 0),!temp?'votes':null,{flags: 'r'});
    logger.info`State used. ${votes}`;
    const [voted, setVoted, state] = Component.useState({}, 'voted');
    const [hasVoted, setHasVoted] = Component.useState(false,null, {scope: socket.id});
  
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

    const vote = (socket, option) => {
      if (!values[option]) {
        throw new Error(`Unsupported value. Supported values are ${values}`);
      }
  
      if (socket.id in voted) {
        throw new Error('Cannot vote twice');
      }
      
      logger.error`VOTING ${socket.id} ${JSON.stringify(state)}`;
      logger.scope('foo').error`vote ${socket}`

      votes[option]++;
      voted[socket.id] = true;
      setVoted(voted);
      setVotes(votes);
      setHasVoted(option)
    };
  
    return {
      props,
      states: {
        votes,
        voted: hasVoted,
        rendered: +new Date
      },
      actions: {
        vote
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

io.on('connection', (socket) => {
    logger.warning`Client connected.`
    const rendered = {}
    socket.on('useComponent', (key) => {
      const component = Component.instances.get(key);
      logger.info`Using component ${key}`;  
      logger.info`Found component. Rendering ${component}`;
      try {
        const result = component(socket);
        rendered[key] = result;
        socket.once("disconnecting", () => {
          logger.error(`Removing temp variables`);
            result.cleanup();
            // process.exit(0);
          })
          logger.scope('foo').error`useComponent ${socket}`
          socket.emit(`useComponent:${key}`, {...result, actions: Object.keys(result.actions)});
        } catch (e) {
          socket.emit('error', key, 'component:render', e.message);
        }
    })

    socket.on('executeAction', (componentKey, actionId, args) => {
      const component = Component.rendered.get(componentKey);
        if (!component.actions) {
          socket.emit('error', componentKey, actionId, "Component has not rendered. Cannot call action on unmounted component");
          return
        }

        const action = component.actions[actionId];
        logger.error`Request to execute action ${actionId} from client ${socket}`;

        try {
            action(socket, ...args);
        } catch (e) {
            socket.emit('error', componentKey, actionId, e.message);
        }
    })
})

setInterval(() => {
  store.purge();
}, 1000);
setInterval(() => {
    logger.scope('foo').info`Store: ${util.inspect(public, false, true)}`;
}, 3000)

const socket = client('http://localhost:3000');

// socket.emit('useComponent', 'poll')

// socket.on('useComponent:poll', (result) => {
//     console.log ("Use component ", result);
//     const vote = result.actions.vote;

//     socket.emit('executeAction', 'poll', vote, [0]);
// })