const { State, SocketIOBroker, Store } = require('./server/state');

var http = require('http').createServer();
var io = require('socket.io')(http, { cors: {
    origin: '*',
  }});
const {io: client} = require('socket.io-client');

const broker = new SocketIOBroker(io);

const store = new Store({autoCreate: true});

io.on('connection', (socket) => {
    const {useState, createState} = store //.scope(socket);
    
    const state = new State([]);

    console.log ("User connected")
    socket.on('setState', (data) => {
        const {id, key = id , value, scope = 'client'} = data;
        const _scope = scope==='client'?socket:scope;
        const {useState, has} = store.scope(_scope);

        console.log ("server set state", data);
        if (!key || !(has(key))) 
            return console.error(`Error setting state with key ${key}`);
        
        const state = useState(key);
        state.setValue(value)
    })

    socket.on('useState', (key, def, options = {}) => {
        console.log ("useState", key, def, options);
        let {scope = 'client', ...echo} = options;
        const _scope = scope==='client'?socket:scope;
        const {useState} = store.scope(_scope);
        const state = useState(key, def).sync(broker, socket);
        socket.join(key);
        //echoing data might pose security risks maybe use configurable whitelists
        socket.emit('createState', {id: state.id, value: state.value, ...echo});
    })
})

const socket = client('http://localhost:3000');

http.listen(3000, () => {
    console.log('listening on *:3000');
});


socket.on('createState', data => {
    console.log ("Client create state", data);
});

socket.on('setState', (state) => {
    console.log ("Client set state", state)
})


socket.emit ('useState', 'foo', 'bar');
socket.emit ('setState', {
    key: 'foo',
    value: 'test'
})

// io.set('origins', '*:*');
// io.origins('*:*')

setTimeout(() => {
    const {useState} = store;
    const {id, value, setValue, sync} = useState('foo', 'bar');
    console.log ("USE STATE", id, value)
    sync (({value}) => {
        console.log ("SYNC Valeu", value)
    })
    setValue('bar2');
}, 2000)