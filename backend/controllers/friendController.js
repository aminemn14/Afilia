// controllers/friendController.js

const Friend = require('../models/Friend');
const User = require('../models/User');

// Récupérer la liste des amis pour un utilisateur donné
exports.getFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    const friends = await Friend.find({ userId }).populate(
      'friendId',
      '-password'
    );
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Ajouter un ami (relation mutuelle)
exports.addFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    // Empêcher l’auto-ajout
    if (userId === friendId) {
      return res
        .status(400)
        .json({ error: 'Vous ne pouvez pas vous ajouter vous-même.' });
    }

    // Vérifier s'il existe déjà la relation dans les deux sens
    const existing1 = await Friend.findOne({ userId, friendId });
    const existing2 = await Friend.findOne({
      userId: friendId,
      friendId: userId,
    });

    if (existing1 && existing2) {
      return res.status(400).json({ error: 'Vous êtes déjà amis.' });
    }

    // Créer les enregistrements nécessaires
    if (!existing1) {
      await new Friend({ userId, friendId }).save();
    }
    if (!existing2) {
      await new Friend({ userId: friendId, friendId: userId }).save();
    }

    // Émettre un événement pour actualiser les interfaces des deux utilisateurs
    const io = req.app.get('socketio');
    if (io) {
      io.to(userId.toString()).emit('friendAdded', { friendId });
      io.to(friendId.toString()).emit('friendAdded', { friendId: userId });
    }

    res.status(201).json({ message: 'Amitié établie avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Supprimer un ami (relation mutuelle)
exports.removeFriend = async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    const removed1 = await Friend.findOneAndDelete({ userId, friendId });
    const removed2 = await Friend.findOneAndDelete({
      userId: friendId,
      friendId: userId,
    });

    if (!removed1 && !removed2) {
      return res.status(404).json({ error: "Relation d'ami introuvable." });
    }

    // Émettre un événement pour actualiser les interfaces des deux utilisateurs
    const io = req.app.get('socketio');
    if (io) {
      io.to(userId.toString()).emit('friendRemoved', { friendId });
      io.to(friendId.toString()).emit('friendRemoved', { friendId: userId });
    }

    res.json({ message: 'Ami supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
