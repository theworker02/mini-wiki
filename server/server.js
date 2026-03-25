require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

require('./db/database');

const authRouter = require('./routes/auth');
const pagesRouter = require('./routes/pages');
const commentsRouter = require('./routes/comments');
const aiRouter = require('./routes/ai');
const loreRouter = require('./routes/lore');
const profileRouter = require('./routes/profile');
const registerEditorSocket = require('./sockets/editorSocket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/lore', loreRouter);
app.use('/api/profile', profileRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

registerEditorSocket(io);

server.listen(PORT, () => {
  console.log(`Mini Wiki API running on http://localhost:${PORT}`);
});
