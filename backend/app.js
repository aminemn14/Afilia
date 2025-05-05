// backend/app.js

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

const connectDB = require('./config/db');
const Message = require('./models/Message');

const algorithm = 'aes-256-cbc';
const MESSAGE_SECRET = process.env.MESSAGE_SECRET;

// --- Helpers pour chiffrement / déchiffrement ---
function encryptMessage(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(MESSAGE_SECRET, 'hex'),
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptMessage(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(MESSAGE_SECRET, 'hex'),
    iv
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// --- Initialisation Express & DB ---
const app = express();
app.use(cors());
app.use(bodyParser.json());
connectDB();

// --- Import des routes REST ---
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const locationRoutes = require('./routes/locationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const friendRoutes = require('./routes/friendRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const cartRoutes = require('./routes/cartRoutes');
const genericUploadRoutes = require('./routes/genericUpload');

// --- Création du serveur HTTP + Socket.IO ---
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' },
});

// --- Gestion des connexions Socket.IO ---
io.on('connection', (socket) => {
  console.log('Nouvelle connexion Socket.IO :', socket.id);

  // 1) Rejoindre la room userId passée en query (depuis useSocket)
  const { userId } = socket.handshake.query;
  if (userId) {
    socket.join(userId);
    console.log(`→ Socket ${socket.id} rejoint room user ${userId}`);
  }

  // 2) Rejoindre une room de conversation spécifique
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`→ Socket ${socket.id} rejoint conversation ${conversationId}`);
  });

  // 3) Envoi d'un message en temps réel
  socket.on(
    'sendMessage',
    async ({ conversationId, sender_id, receiver_id, content }) => {
      try {
        io.to(conversationId).emit('newMessage', payload);
        io.to(String(receiver_id)).emit('newMessage', payload);
        io.to(String(sender_id)).emit('newMessage', payload);
      } catch (err) {
        console.error('Erreur socket sendMessage :', err);
      }
    }
  );

  socket.on('disconnect', () => {
    console.log('Socket déconnectée :', socket.id);
  });
});

// --- Exposition des routes API ---
app.set('socketio', io);

app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api', genericUploadRoutes);

// --- Démarrage du serveur ---
const PORT = process.env.PORT || 8070;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = {
  app,
  encryptMessage,
  decryptMessage,
};
