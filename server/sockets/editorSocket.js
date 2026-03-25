function registerEditorSocket(io) {
  io.on('connection', (socket) => {
    socket.on('join-page', ({ pageId, userId }) => {
      if (!pageId) return;
      socket.join(`page:${pageId}`);
      socket.to(`page:${pageId}`).emit('presence', {
        type: 'join',
        userId,
        at: Date.now()
      });
    });

    socket.on('leave-page', ({ pageId, userId }) => {
      if (!pageId) return;
      socket.leave(`page:${pageId}`);
      socket.to(`page:${pageId}`).emit('presence', {
        type: 'leave',
        userId,
        at: Date.now()
      });
    });

    socket.on('content-change', ({ pageId, content, userId }) => {
      if (!pageId) return;
      socket.to(`page:${pageId}`).emit('remote-content-change', {
        content,
        userId,
        timestamp: Date.now()
      });
    });

    socket.on('like-update', ({ pageId, likes }) => {
      if (!pageId) return;
      socket.to(`page:${pageId}`).emit('remote-like-update', { likes });
    });

    socket.on('view-update', ({ pageId, views }) => {
      if (!pageId) return;
      socket.to(`page:${pageId}`).emit('remote-view-update', { views });
    });
  });
}

module.exports = registerEditorSocket;
