const { State, SocketIOBroker, Store } = require('./src/server/state');
const {ConnectionHandler} = require('./src/server/handler')
var http = require('http').createServer();
var io = require('socket.io')(http, { cors: {
    origin: '*',
  }});
const {io: client} = require('socket.io-client');
const logger = require('./src/lib/logger');

const store = new Store({autoCreate: true});
const broker = new SocketIOBroker();

store.onRequestState = () => true;

io.on('connection', ConnectionHandler(broker, store));


const socket = client('http://3.21.165.34:3000');

http.listen(3000, () => {
    console.log('listening on *:3000');
});

socket.on('connect', () => {
    logger.info`client conencted`;
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