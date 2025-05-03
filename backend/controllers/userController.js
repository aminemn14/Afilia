// controllers/userController.js

const User = require('../models/User');
const Friend = require('../models/Friend');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret';

// Connexion d'un utilisateur
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Email et mot de passe sont requis' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const payload = { userId: user._id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtenir tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtenir un utilisateur par son ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Créer un nouvel utilisateur
exports.createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstname,
      lastname,
      phoneNumber,
      createdAt,
    } = req.body;

    if (
      !username ||
      !email ||
      !password ||
      !firstname ||
      !lastname ||
      !phoneNumber
    ) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstname,
      lastname,
      phoneNumber,
      role: 'user',
      createdAt: createdAt || new Date(),
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedUser)
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Bloquer un utilisateur (supprime aussi de la liste d'amis)
exports.blockUser = async (req, res) => {
  try {
    const userId = req.params.id; // celui qui bloque
    const targetId = req.params.targetId; // celui à bloquer

    if (userId === targetId) {
      return res
        .status(400)
        .json({ error: 'Vous ne pouvez pas vous bloquer vous-même' });
    }

    // 1) Supprimer relation d'ami dans les deux sens
    await Friend.deleteOne({ userId, friendId: targetId });
    await Friend.deleteOne({ userId: targetId, friendId: userId });

    // 2) Ajouter targetId dans blockedUsers s'il n'y est pas déjà
    const updated = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { blockedUsers: targetId } },
      { new: true }
    ).populate('blockedUsers', 'username firstname lastname');

    if (!updated) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // 3) Émettre événements websocket :
    const io = req.app.get('socketio');
    if (io) {
      // notifier le bloqué
      io.to(targetId).emit('userBlocked', { blockerId: userId });
      // notifier suppression d'ami
      io.to(userId).emit('friendRemoved', { friendId: targetId });
      io.to(targetId).emit('friendRemoved', { friendId: userId });
    }

    res.json({
      message: `Utilisateur ${targetId} bloqué et supprimé des amis`,
      blockedUsers: updated.blockedUsers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Débloquer un utilisateur
exports.unblockUser = async (req, res) => {
  try {
    const userId = req.params.id; // celui qui débloque
    const targetId = req.params.targetId; // celui à débloquer

    const updated = await User.findByIdAndUpdate(
      userId,
      { $pull: { blockedUsers: targetId } },
      { new: true }
    ).populate('blockedUsers', 'username firstname lastname');

    if (!updated) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const io = req.app.get('socketio');
    if (io) {
      io.to(targetId).emit('userUnblocked', { unblockerId: userId });
    }

    res.json({
      message: `Utilisateur ${targetId} débloqué`,
      blockedUsers: updated.blockedUsers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsersWhoBlocked = async (req, res) => {
  try {
    const targetId = req.params.id;
    // Cherche tous les users pour lesquels blockedUsers inclut targetId
    const blockers = await User.find(
      { blockedUsers: targetId },
      '_id firstname lastname username'
    );
    // On ne renvoie que les IDs (ou on peut renvoyer le user complet selon besoin)
    const blockerIds = blockers.map((u) => u._id);
    res.json(blockerIds);
  } catch (err) {
    console.error('Erreur getUsersWhoBlocked:', err);
    res.status(500).json({ error: err.message });
  }
};
