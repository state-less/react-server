const { State, SocketIOBroker, Store } = require('./src/server/state');
const {ConnectionHandler} = require('./src/server/handler')
var http = require('http').createServer();
var io = require('socket.io')(http, { cors: {
    origin: '*',
  }});
const {io: client} = require('socket.io-client');
const logger = require('./src/lib/logger');

const store = new Store({autoCreate: true});
const public = store.scope('public');
public.autoCreate = true;
const broker = new SocketIOBroker();

store.onRequestState = () => true;

io.on('connection', ConnectionHandler(broker, store));


const socket = client('http://localhost:3000');

const {useState: usePublicState} = public;


http.listen(3000, () => {
    console.log('listening on *:3000');
});


setInterval(() => {
    const {value, setValue} = usePublicState('connections', 1);
    const len = io.sockets.size;
    logger.warning`Updating connection count ${value}. ${io.sockets.sockets.size}`;


    setValue(io.sockets.sockets.size);
},1000);

// io.on('connection', (socket) => {
//     const {value, setValue} = usePublicState('connections', 1);
//     logger.info`Connection reveived, value: ${value}`;
//     setValue(value + 1);

//     socket.on('disconnecting', function() {
//         const {value, setValue} = usePublicState('connections', 1);
//         logger.info`CLient disconnected, value: ${value}`;

//         setValue(value - 1);
//     });
// })

socket.on('close', () => {
    const {state, setValue} = useState('connections', 0);

    logger.info`client conencted`;
    setValue(conns + 1);
})

socket.on('error', () => {
    logger.error`client conencted`;
})

socket.on('createState:123', data => {
    console.log ("Client create state", data);

});
socket.on(`setState:$123`, (state) => {
    console.log ("Client set state", state)
})

socket.on('*', (state) => {
    console.log ("Client set state", state)
})

socket.emit ('useState', 'foo', 'bar', {clientId: 123});
socket.emit ('setState', {
    key: 'foo',
    value: 'test'
})

// io.set('origins', '*:*');
// io.origins('*:*')

setTimeout(() => {
    const {useState} = store;
    const {setValue} = useState('foo', 'bar');
    setValue('foobar');
}, 2000)