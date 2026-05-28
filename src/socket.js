const { Server } = require('socket.io');
const { verifyToken } = require('@clerk/clerk-sdk-node');
const { corsOrigins } = require('./config/env');
const { getCurrentMarketplaceUser } = require('./modules/users/user.service');

let io;
const socketsByUserId = new Map();
const lastSeenByUserId = new Map();

const rememberSocket = (userId, socketId) => {
  const key = String(userId);
  const sockets = socketsByUserId.get(key) || new Set();
  sockets.add(socketId);
  socketsByUserId.set(key, sockets);
};

const forgetSocket = (userId, socketId) => {
  const key = String(userId);
  const sockets = socketsByUserId.get(key);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) socketsByUserId.delete(key);
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
      const user = await getCurrentMarketplaceUser(payload.sub);

      socket.user = { id: user.id, clerkId: user.clerkId };
      return next();
    } catch (error) {
      return next(new Error('Authentication required'));
    }
  });

  io.on('connection', (socket) => {
    rememberSocket(socket.user.id, socket.id);
    io.emit('presence:online', { userIds: [...socketsByUserId.keys()] });

    const joinConversation = (conversationId) => {
      if (conversationId) socket.join(`conversation:${conversationId}`);
    };

    const leaveConversation = (conversationId) => {
      if (conversationId) socket.leave(`conversation:${conversationId}`);
    };

    socket.on('join:conversation', joinConversation);
    socket.on('conversation:join', joinConversation);
    socket.on('leave:conversation', leaveConversation);
    socket.on('conversation:leave', leaveConversation);

    socket.on('presence:get', () => {
      socket.emit('online-users', { userIds: [...socketsByUserId.keys()] });
    });

    socket.on('typing:start', ({ conversationId, recipientIds = [] } = {}) => {
      const payload = {
        conversationId,
        user: { _id: String(socket.user.id), appUserId: socket.user.id, id: socket.user.clerkId },
      };

      recipientIds.forEach((recipientId) => {
        const sockets = socketsByUserId.get(String(recipientId));
        sockets?.forEach((socketId) => io.to(socketId).emit('typing:start', payload));
      });
    });

    socket.on('typing:stop', ({ conversationId, recipientIds = [] } = {}) => {
      const payload = { conversationId, userId: String(socket.user.id) };
      recipientIds.forEach((recipientId) => {
        const sockets = socketsByUserId.get(String(recipientId));
        sockets?.forEach((socketId) => io.to(socketId).emit('typing:stop', payload));
      });
    });

    socket.on('disconnect', () => {
      forgetSocket(socket.user.id, socket.id);
      const lastSeen = new Date().toISOString();
      if (!socketsByUserId.has(String(socket.user.id))) {
        lastSeenByUserId.set(String(socket.user.id), lastSeen);
        io.emit('presence:lastSeen', { userId: String(socket.user.id), lastSeen });
      }
      io.emit('presence:online', { userIds: [...socketsByUserId.keys()] });
    });
  });

  return io;
};

const emitToConversationMembers = (conversation, event, payload) => {
  if (!io || !conversation?.members) return;

  conversation.members.forEach((member) => {
    const memberId = member.appUserId || member._id || member.id || member;
    const sockets = socketsByUserId.get(String(memberId));
    if (!sockets) return;
    sockets.forEach((socketId) => io.to(socketId).emit(event, payload));
  });
};

module.exports = {
  initSocket,
  emitToConversationMembers,
};
