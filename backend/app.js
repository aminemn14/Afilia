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

const app = express();
app.use(cors());
app.use(bodyParser.json());
connectDB();

// Créer un serveur HTTP
const server = http.createServer(app);

// Initialiser Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

// Lorsqu'un client se connecte, on peut écouter et émettre des événements
io.on('connection', (socket) => {
  console.log('Nouvelle connexion:', socket.id);

  // Par exemple, écoutez un événement "joinRoom" si vous voulez regrouper les utilisateurs par ID
  socket.on('joinRoom', (userId) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log('Déconnexion:', socket.id);
  });
});

// Exportez io pour l'utiliser dans vos contrôleurs
app.set('socketio', io);

// Routes API
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/invitations', invitationRoutes);

const PORT = process.env.PORT || 8070;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
