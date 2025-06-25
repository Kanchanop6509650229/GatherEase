import type { NextApiRequest } from 'next';
import { Server } from 'socket.io';

export const config = {
  api: { bodyParser: false },
};

export default function handler(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, { path: '/api/socket/io' });
    res.socket.server.io = io;
    io.on('connection', socket => {
      socket.on('availability:update', data => {
        socket.broadcast.emit('availability:update', data);
      });
      socket.on('restaurant:vote', data => {
        socket.broadcast.emit('restaurant:vote', data);
      });
      socket.on('room:state', data => {
        socket.broadcast.emit('room:state', data);
      });
    });
  }
  res.end();
}
