require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');

// Routes
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const locationRoutes = require('./routes/locationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const friendRoutes = require('./routes/friendRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

// Route d'upload générique
const genericUploadRoutes = require('./routes/genericUpload');

const app = express();
app.use(cors());
app.use(bodyParser.json());
connectDB();

// Création du serveur HTTP
const server = http.createServer(app);

// Initialisation de Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});
io.on('connection', (socket) => {
  console.log('Nouvelle connexion:', socket.id);
  socket.on('joinRoom', (userId) => {
    socket.join(userId);
  });
  socket.on('disconnect', () => {
    console.log('Déconnexion:', socket.id);
  });
});
app.set('socketio', io);

// Utilisation des routes API
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api', genericUploadRoutes);

const PORT = process.env.PORT || 8070;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
