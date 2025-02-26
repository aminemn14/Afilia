const Message = require('../models/Message');
const mongoose = require('mongoose');

// Obtenir tous les messages
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtenir un message par son ID
exports.getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message non trouvé' });
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Créer un nouveau message
exports.createMessage = async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    const savedMessage = await newMessage.save();

    // Diffuser le message aux rooms correspondantes
    const io = req.app.get('socketio');
    io.to(savedMessage.receiver_id.toString()).emit('newMessage', savedMessage);
    io.to(savedMessage.sender_id.toString()).emit('newMessage', savedMessage);

    res.status(201).json(savedMessage);
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
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
