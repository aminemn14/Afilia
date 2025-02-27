const Message = require('../models/Message');
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
require('dotenv').config();

const MESSAGE_SECRET = process.env.MESSAGE_SECRET;

// Obtenir tous les messages
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function encryptMessage(text) {
  const iv = crypto.randomBytes(16); // vecteur d'initialisation
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(MESSAGE_SECRET, 'hex'),
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Stocke l'IV avec le texte chiffré pour le déchiffrement ultérieur
  return iv.toString('hex') + ':' + encrypted;
}

function decryptMessage(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(MESSAGE_SECRET, 'hex'),
    iv
  );
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Obtenir un message par son ID
exports.getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message non trouvé' });

    // Déchiffrer le contenu du message avant de l'envoyer (à condition que l'utilisateur soit autorisé)
    if (message.content) {
      message.content = decryptMessage(message.content);
    }
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Créer un nouveau message
exports.createMessage = async (req, res) => {
  try {
    if (req.body.content) {
      req.body.content = encryptMessage(req.body.content);
    }
    const newMessage = new Message(req.body);
    const savedMessage = await newMessage.save();

    // Créer une version du message avec le contenu déchiffré
    const messageToSend = savedMessage.toObject();
    if (messageToSend.content) {
      messageToSend.content = decryptMessage(messageToSend.content);
    }

    // Diffuser le message déchiffré aux rooms correspondantes
    const io = req.app.get('socketio');
    io.to(savedMessage.receiver_id.toString()).emit(
      'newMessage',
      messageToSend
    );
    io.to(savedMessage.sender_id.toString()).emit('newMessage', messageToSend);

    res.status(201).json(messageToSend);
  } catch (err) {
    console.error('Erreur lors de la création du message:', err);
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour un message
exports.updateMessage = async (req, res) => {
  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedMessage)
      return res.status(404).json({ error: 'Message non trouvé' });
    res.json(updatedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Supprimer un message
exports.deleteMessage = async (req, res) => {
  try {
    const deletedMessage = await Message.findByIdAndDelete(req.params.id);
    if (!deletedMessage)
      return res.status(404).json({ error: 'Message non trouvé' });
    res.json({ message: 'Message supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer les messages d'une conversation
exports.getMessagesForConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({
      conversation_id: conversationId,
    }).sort({ created_at: -1 });

    // Déchiffrer le contenu de chaque message
    const decryptedMessages = messages.map((message) => {
      if (message.content) {
        message.content = decryptMessage(message.content);
      }
      return message;
    });
    res.json(decryptedMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
