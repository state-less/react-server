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
    console.log('listening on *:3000');
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
    const {values} = props;
    const [votes, setVotes] = Component.useState(values.map(v => 0), {flags: 'r'});
    logger.info`State used. ${votes}`;
    const [voted, setVoted] = Component.useState({});
    const [hasVoted, setHasVoted] = Component.useState(false, {scope: socket.id});
  
    Component.useEffect(() => {
        setTimeout(() => {
           votes[~~(Math.random()*4)]++;
           setVotes(votes);
        }, 2000)
    });

    const vote = (option) => {
      if (!values[option]) {
        throw new Error(`Unsupported value. Supported values are ${values}`);
      }
  
      if (socket.id in voted) {
        throw new Error('Cannot vote twice');
      }
  
      votes[option]++;
      voted[socket.id] = true;
      setVotes(votes);
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


io.on('connection', (socket) => {
    logger.warning`Client connected.`

    socket.on('useComponent', (key) => {
        logger.info`Using component ${key}`;
        const component = Component.map.get(key);
        logger.info`Found component. Rendering ${component}`;
        const result = component(socket);
        logger.info`Result ${result}. Executing Action ${component.actions}`;

        socket.emit(`useComponent:${key}`, result);
    })

    socket.on('executeAction', (componentKey, actionId, args) => {
        const component = Component.map.get(componentKey);
        const action = component.actions.get(actionId);

        logger.info`Request to execute action from client ${socket}`;
        try {

            action(...args);
        } catch (e) {
            socket.emit('error', componentKey, actionId, e.message);
        }
    })
})

// setInterval(() => {
//     logger.info`Store: ${util.inspect(public.map)}`;
// }, 3000)

const socket = client('http://localhost:3000');

// socket.emit('useComponent', 'poll')

// socket.on('useComponent:poll', (result) => {
//     console.log ("Use component ", result);
//     const vote = result.actions.vote;

//     socket.emit('executeAction', 'poll', vote, [0]);
// })