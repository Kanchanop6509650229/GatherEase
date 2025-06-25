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
      socket.on('join', roomId => {
        socket.join(roomId);
      });
      socket.on('availability:update', ({ roomId, data }) => {
        socket.to(roomId).broadcast.emit('availability:update', data);
      });
      socket.on('restaurant:vote', ({ roomId, data }) => {
        socket.to(roomId).broadcast.emit('restaurant:vote', data);
      });
      socket.on('room:state', ({ roomId, data }) => {
        socket.to(roomId).broadcast.emit('room:state', data);
      });
    });
  }
  res.end();
}
