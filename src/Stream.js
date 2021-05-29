import {Writable} from 'stream';
import { success, failure } from './lib/response-lib/websocket';

export const Streams = {};
export class WebsocketStream extends Writable {
  constructor(socket) {
    super();
    this.sockets = [];
  }
  
  addSocket (socket, info)  {
    this.sockets.push([socket, info]);
  }

  write (data) {
    this.sockets.forEach(([socket, info]) => {
      socket.send(success(data, info));
    })
  }
}
